#!/usr/bin/env python3
"""Discover Minew gateway on LAN (ARP) and ESL tag BLE MACs (MQTT uplink).

Run from apps/api:
    PYTHONPATH=. .venv/bin/python scripts/discover_minew_gateway.py
    PYTHONPATH=. .venv/bin/python scripts/discover_minew_gateway.py --apply --test
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
import uuid

import paho.mqtt.client as mqtt
from sqlalchemy import select

from app.adapters.transport.minew_jengine import normalize_mac
from app.core.database import SessionLocal
from app.models.dealership import Dealership
from app.models.esl_device import ESLDevice
from app.schemas.esl_update import TestUpdateRequest
from app.services import minew_update_service

MAC_LINE_RE = re.compile(
    r"\((?P<ip>[\d.]+)\)\s+at\s+(?P<mac>(?:[0-9a-f]{2}:){5}[0-9a-f]{2})",
    re.IGNORECASE,
)
MINEW_OUI_RE = re.compile(r"23:3f", re.IGNORECASE)


def find_gateway_from_arp() -> tuple[str | None, str | None]:
    result = subprocess.run(["arp", "-a"], capture_output=True, text=True, check=False)
    for line in result.stdout.splitlines():
        if not MINEW_OUI_RE.search(line):
            continue
        match = MAC_LINE_RE.search(line)
        if match:
            ip = match.group("ip")
            mac = match.group("mac").replace(":", "").upper()
            return ip, mac
    return None, None


def extract_macs(payload: str) -> list[str]:
    macs: list[str] = []
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        data = None
    if isinstance(data, dict):
        for key in ("mac", "tag_mac", "ble_mac", "esl_mac"):
            mac = normalize_mac(str(data.get(key, "")))
            if mac:
                macs.append(mac)
        for value in data.values():
            if isinstance(value, dict):
                for key in ("mac", "tag_mac", "ble_mac"):
                    mac = normalize_mac(str(value.get(key, "")))
                    if mac:
                        macs.append(mac)
    for token in re.findall(r"[0-9A-Fa-f]{12}", payload):
        mac = normalize_mac(token)
        if mac:
            macs.append(mac)
    return macs


def sniff_mqtt(host: str, port: int, seconds: int) -> dict[str, set[str]]:
    by_topic: dict[str, set[str]] = {}
    seen: set[str] = set()

    def on_message(_client, _userdata, msg) -> None:
        text = msg.payload.decode("utf-8", errors="replace")
        topic = msg.topic or "(no topic)"
        macs = extract_macs(text)
        if not macs:
            return
        bucket = by_topic.setdefault(topic, set())
        for mac in macs:
            if mac not in seen:
                seen.add(mac)
                bucket.add(mac)
                print(f"[mqtt] topic={topic} mac={mac}")
                print(f"       {text[:240]}{'…' if len(text) > 240 else ''}")

    client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
    client.on_message = on_message
    print(f"Connecting MQTT {host}:{port} …")
    client.connect(host, port, keepalive=30)
    client.loop_start()
    client.subscribe("#", qos=0)
    print(f"Listening {seconds}s — power-cycle tag E100000A1525 if nothing appears …")
    time.sleep(seconds)
    client.loop_stop()
    client.disconnect()
    return by_topic


def apply_tag_mac(device_id: str, tag_mac: str, slug: str) -> None:
    db = SessionLocal()
    try:
        dealer = db.scalar(select(Dealership).where(Dealership.slug == slug))
        if dealer is None:
            raise SystemExit(f"Dealership not found: {slug}")
        device = db.scalar(
            select(ESLDevice).where(
                ESLDevice.dealership_id == dealer.id,
                ESLDevice.device_id == device_id,
            )
        )
        if device is None:
            raise SystemExit(f"ESL device not found: {device_id}")
        device.provider_device_id = tag_mac
        db.commit()
        print(f"Updated esl_devices.provider_device_id for {device_id} → {tag_mac}")
    finally:
        db.close()


def run_test(tag_mac: str, gateway_mac: str, slug: str) -> None:
    db = SessionLocal()
    try:
        dealer = db.scalar(select(Dealership).where(Dealership.slug == slug))
        if dealer is None:
            raise SystemExit(f"Dealership not found: {slug}")
        result = minew_update_service.run_test_update(
            db,
            dealer.id,
            TestUpdateRequest(
                tag_mac=tag_mac,
                gateway_mac=gateway_mac,
                width=400,
                height=300,
                color_mode="BWRY",
                price="$32,995",
                subscribe=True,
            ),
        )
        print(f"test job_id={result.job_id}")
        print(f"test topic={result.topic}")
        print(f"test tag_mac={result.tag_mac}")
        print("Watch the physical tag for a refresh.")
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Discover Minew gateway and tag BLE MACs")
    parser.add_argument("--host", help="Gateway IP (default: ARP discovery)")
    parser.add_argument("--port", type=int, default=1883)
    parser.add_argument("--seconds", type=int, default=45)
    parser.add_argument("--device-id", default="E100000A1525")
    parser.add_argument("--slug", default="dover-dodge")
    parser.add_argument("--gateway-mac", default="FC233FC2B7C2")
    parser.add_argument("--apply", action="store_true", help="Save first tag MAC to DB")
    parser.add_argument("--test", action="store_true", help="Publish test label after discovery")
    args = parser.parse_args()

    arp_ip, arp_mac = find_gateway_from_arp()
    host = args.host or arp_ip
    if not host:
        raise SystemExit("No Minew gateway in ARP — is it powered on and on the same Wi-Fi?")

    print(f"Gateway candidate: {host}" + (f" (ARP MAC {arp_mac})" if arp_mac else ""))
    if arp_mac and arp_mac != args.gateway_mac:
        print(f"Note: label GATEWAY_MAC={args.gateway_mac} differs from ARP {arp_mac}")
        print("      If publishes fail, retry with --gateway-mac", arp_mac)

    by_topic = sniff_mqtt(host, args.port, args.seconds)
    all_macs = sorted({mac for macs in by_topic.values() for mac in macs})
    if not all_macs:
        raise SystemExit(
            "No tag MACs seen on MQTT. Check Wi-Fi client isolation, gateway power, "
            "and try: mosquitto_sub -h "
            f"{host} -p {args.port} -t '#' -v"
        )

    tag_mac = all_macs[0]
    print(f"\nFirst tag MAC: {tag_mac}")
    if len(all_macs) > 1:
        print("Other MACs:", ", ".join(all_macs[1:]))

    if args.apply:
        apply_tag_mac(args.device_id, tag_mac, args.slug)

    if args.test:
        run_test(tag_mac, args.gateway_mac, args.slug)


if __name__ == "__main__":
    main()
