"""Minew G1-E MQTT client — publish display updates and subscribe to gateway status."""

from __future__ import annotations

import json
import logging
import threading
import time
from collections import deque
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import paho.mqtt.client as mqtt

from app.adapters.transport.minew_jengine import (
    build_command_02_data,
    build_jengine_image_set_req,
    encode_image_data_b64,
    normalize_esl_mqtt_mac,
    normalize_mac,
)
from app.core.config import settings

logger = logging.getLogger(__name__)

MAX_STATUS_MESSAGES = 200


@dataclass
class GatewayMessage:
    topic: str
    payload: dict[str, Any] | str
    received_at: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "topic": self.topic,
            "payload": self.payload,
            "received_at": self.received_at,
        }


def _gateway_mac_lower(gateway_mac: str) -> str:
    mac = normalize_mac(gateway_mac)
    if not mac:
        raise ValueError("Gateway MAC must be 12 uppercase hex characters")
    return mac.lower()


def build_action_topic(gateway_mac: str) -> str:
    """Default jengine downlink topic: /gw/{mac}/action."""
    override = settings.minew_mqtt_topic.strip()
    if override:
        return override
    return f"/gw/{_gateway_mac_lower(gateway_mac)}/action"


def build_response_topic(gateway_mac: str) -> str:
    return f"/gw/{_gateway_mac_lower(gateway_mac)}/response"


def build_status_topic(gateway_mac: str) -> str:
    return f"/gw/{_gateway_mac_lower(gateway_mac)}/status"


def build_command_topic(gateway_mac: str) -> str:
    """Legacy dData topic: Mqtt/GateWay/{MAC}/Command."""
    override = settings.minew_mqtt_topic.strip()
    if override:
        return override
    mac = normalize_mac(gateway_mac)
    if not mac:
        raise ValueError("Gateway MAC must be 12 uppercase hex characters")
    prefix = settings.minew_mqtt_topic_prefix.strip().strip("/")
    suffix = settings.minew_mqtt_topic_suffix.strip().strip("/")
    return f"{prefix}/{mac}/{suffix}"


def build_ddata_payload(tag_mac: str, encoded_data: str, *, seq: int) -> dict[str, Any]:
    mac = normalize_esl_mqtt_mac(tag_mac)
    if not mac:
        raise ValueError("Tag device id must be 12 uppercase hex characters")
    return {
        "msg": settings.minew_mqtt_msg_type,
        "mac": mac,
        "seq": seq,
        "auth1": settings.minew_mqtt_auth1,
        "dType": settings.minew_mqtt_dtype,
        "data": encoded_data,
    }


class MinewMqttClient:
    """Thread-safe MQTT client for Minew gateway downlink and status logging."""

    def __init__(self) -> None:
        self._client: mqtt.Client | None = None
        self._connected = False
        self._subscribed = False
        self._lock = threading.Lock()
        self._messages: deque[GatewayMessage] = deque(maxlen=MAX_STATUS_MESSAGES)
        self._seq = 0
        self._req_id = 0

    def _next_seq(self) -> int:
        self._seq = (self._seq % 65535) + 1
        return self._seq

    def _next_req_id(self) -> int:
        self._req_id = (self._req_id % 2_147_483_647) + 1
        return self._req_id

    @property
    def connected(self) -> bool:
        return self._connected

    @property
    def subscribed(self) -> bool:
        return self._subscribed

    def connect(self) -> None:
        host = settings.mqtt_host.strip()
        if not host:
            raise ValueError("MQTT_HOST is not configured")

        with self._lock:
            if self._connected and self._client is not None:
                return

            client = mqtt.Client(
                callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
                client_id=settings.minew_mqtt_client_id or "lotsync-mqtt",
            )
            username = settings.mqtt_username.strip()
            password = settings.mqtt_password.strip()
            if username:
                client.username_pw_set(username, password or None)

            client.on_connect = self._on_connect
            client.on_message = self._on_message

            client.connect(host, settings.mqtt_port, keepalive=60)
            client.loop_start()
            self._client = client
            self._connected = True
            logger.info("Minew MQTT connected to %s:%s", host, settings.mqtt_port)

    def disconnect(self) -> None:
        with self._lock:
            if self._client is None:
                return
            self._client.loop_stop()
            self._client.disconnect()
            self._client = None
            self._connected = False
            self._subscribed = False

    def publish_jengine_command(
        self,
        gateway_mac: str,
        command: dict[str, Any],
        *,
        req_id: int | None = None,
    ) -> dict[str, Any]:
        if not self._connected or self._client is None:
            self.connect()

        topic = build_action_topic(gateway_mac)
        body = json.dumps(command, separators=(",", ":"))
        assert self._client is not None
        info = self._client.publish(topic, body, qos=0)
        if info.rc != mqtt.MQTT_ERR_SUCCESS:
            raise OSError(f"MQTT publish failed with rc={info.rc}")
        # qos=0 has no broker ack; loop briefly so short-lived scripts flush the socket.
        deadline = time.monotonic() + 2.0
        while not info.is_published() and time.monotonic() < deadline:
            time.sleep(0.05)

        resolved_req_id = int(command.get("req_id") or req_id or 0)
        logger.info(
            "Published Minew jengine command topic=%s action=%s req_id=%s bytes=%d",
            topic,
            command.get("action"),
            resolved_req_id,
            len(body),
        )
        return {"topic": topic, "payload": command, "req_id": resolved_req_id}

    def publish_label_update(
        self,
        gateway_mac: str,
        tag_mac: str,
        pixel_bytes: bytes,
        *,
        width: int,
        height: int,
        seq: int | None = None,
        req_id: int | None = None,
        opcode: int | None = None,
        img_id: int | None = None,
    ) -> dict[str, Any]:
        """Publish a display update using configured downlink format (jengine or legacy dData)."""
        downlink = settings.minew_mqtt_downlink_format.strip().lower()
        if downlink == "ddata":
            if seq is None:
                seq = self._next_seq()
            encoded_data = build_command_02_data(
                pixel_bytes,
                width=width,
                height=height,
                encoding=settings.minew_jengine_data_encoding,
            )
            return self.publish_ddata_update(gateway_mac, tag_mac, encoded_data, seq=seq)

        resolved_req_id = req_id or self._next_req_id()
        resolved_opcode = opcode if opcode is not None else resolved_req_id
        resolved_img_id = img_id if img_id is not None else resolved_req_id
        image_b64 = encode_image_data_b64(pixel_bytes)
        command = build_jengine_image_set_req(
            tag_mac=tag_mac,
            image_data_b64=image_b64,
            req_id=resolved_req_id,
            opcode=resolved_opcode,
            img_id=resolved_img_id,
            device_key=settings.minew_jengine_device_key.strip(),
            single=settings.minew_jengine_single_firmware,
            screen=settings.minew_jengine_screen.strip().upper() or "A",
            compress=settings.minew_jengine_compress.strip().upper() or "NONE",
        )
        return self.publish_jengine_command(gateway_mac, command, req_id=resolved_req_id)

    def publish_ddata_update(
        self,
        gateway_mac: str,
        tag_mac: str,
        encoded_data: str,
        *,
        seq: int | None = None,
    ) -> dict[str, Any]:
        if not self._connected or self._client is None:
            self.connect()

        if seq is None:
            seq = self._next_seq()

        topic = build_command_topic(gateway_mac)
        payload = build_ddata_payload(tag_mac, encoded_data, seq=seq)
        body = json.dumps(payload, separators=(",", ":"))
        assert self._client is not None
        info = self._client.publish(topic, body, qos=0)
        if info.rc != mqtt.MQTT_ERR_SUCCESS:
            raise OSError(f"MQTT publish failed with rc={info.rc}")

        logger.info(
            "Published Minew dData update topic=%s tag_mac=%s seq=%s bytes=%d",
            topic,
            normalize_esl_mqtt_mac(tag_mac),
            seq,
            len(encoded_data),
        )
        return {"topic": topic, "payload": payload, "seq": seq}

    def publish_display_update(
        self,
        gateway_mac: str,
        tag_mac: str,
        encoded_data: str,
        *,
        seq: int | None = None,
    ) -> dict[str, Any]:
        """Legacy entry point — publishes raw dData hex envelope."""
        return self.publish_ddata_update(gateway_mac, tag_mac, encoded_data, seq=seq)

    def subscribe_status(self, topic: str | None = None) -> str:
        if not self._connected or self._client is None:
            self.connect()

        subscribe_topic = (topic or settings.minew_mqtt_subscribe_topic).strip() or "#"
        assert self._client is not None
        info = self._client.subscribe(subscribe_topic, qos=0)
        if info[0] != mqtt.MQTT_ERR_SUCCESS:
            raise OSError(f"MQTT subscribe failed with rc={info[0]}")
        self._subscribed = True
        logger.info("Subscribed to Minew MQTT status topic=%s", subscribe_topic)
        return subscribe_topic

    def recent_messages(self, limit: int = 50) -> list[dict[str, Any]]:
        with self._lock:
            rows = list(self._messages)[-limit:]
        return [row.to_dict() for row in rows]

    def _on_connect(
        self,
        client: mqtt.Client,
        userdata: Any,
        connect_flags: Any,
        reason_code: Any,
        properties: Any = None,
    ) -> None:
        if reason_code == 0 or str(reason_code) == "Success":
            logger.debug("Minew MQTT on_connect success")
            try:
                self.subscribe_status()
            except OSError:
                logger.exception("Auto-subscribe to Minew status topic failed")
        else:
            logger.error("Minew MQTT connect failed: %s", reason_code)

    def _on_message(
        self,
        client: mqtt.Client,
        userdata: Any,
        message: mqtt.MQTTMessage,
    ) -> None:
        topic = message.topic
        raw = message.payload.decode("utf-8", errors="replace")
        try:
            payload: dict[str, Any] | str = json.loads(raw)
        except json.JSONDecodeError:
            payload = raw

        entry = GatewayMessage(
            topic=topic,
            payload=payload,
            received_at=datetime.now(UTC).isoformat(),
        )
        with self._lock:
            self._messages.append(entry)

        logger.info("Minew gateway message topic=%s payload=%s", topic, payload)

        if isinstance(payload, dict):
            method = payload.get("method")
            if method in {"set_rsp", "get_rsp"}:
                logger.info("Minew jengine response topic=%s payload=%s", topic, payload)
            error = payload.get("error")
            if error is not None and str(error) != "0":
                logger.warning("Minew gateway reported error=%s topic=%s", error, topic)
            payload_body = payload.get("payload")
            if isinstance(payload_body, dict):
                code = payload_body.get("code")
                if code is not None and int(code) >= 100:
                    logger.warning(
                        "Minew jengine stage-1 error code=%s topic=%s message=%s",
                        code,
                        topic,
                        payload_body.get("message"),
                    )
            for key in ("set_rsp", "opcode", "img_id", "mac"):
                if key in payload:
                    logger.debug("Minew status %s=%s", key, payload.get(key))


_client: MinewMqttClient | None = None
_client_lock = threading.Lock()


def get_minew_mqtt_client() -> MinewMqttClient:
    global _client
    with _client_lock:
        if _client is None:
            _client = MinewMqttClient()
        return _client
