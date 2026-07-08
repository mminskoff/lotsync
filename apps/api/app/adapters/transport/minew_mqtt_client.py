"""Minew G1-E MQTT client — publish display updates and subscribe to gateway status."""

from __future__ import annotations

import json
import logging
import threading
from collections import deque
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import paho.mqtt.client as mqtt

from app.adapters.transport.minew_jengine import normalize_mac
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


def build_command_topic(gateway_mac: str) -> str:
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
    mac = normalize_mac(tag_mac)
    if not mac:
        raise ValueError("Tag MAC must be 12 uppercase hex characters")
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

    def publish_display_update(
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
            self._seq = (self._seq % 65535) + 1
            seq = self._seq

        topic = build_command_topic(gateway_mac)
        payload = build_ddata_payload(tag_mac, encoded_data, seq=seq)
        body = json.dumps(payload, separators=(",", ":"))
        assert self._client is not None
        info = self._client.publish(topic, body, qos=0)
        if info.rc != mqtt.MQTT_ERR_SUCCESS:
            raise OSError(f"MQTT publish failed with rc={info.rc}")

        logger.info(
            "Published Minew display update topic=%s tag_mac=%s seq=%s bytes=%d",
            topic,
            normalize_mac(tag_mac),
            seq,
            len(encoded_data),
        )
        return {"topic": topic, "payload": payload, "seq": seq}

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
            error = payload.get("error")
            if error is not None and str(error) != "0":
                logger.warning("Minew gateway reported error=%s topic=%s", error, topic)
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
