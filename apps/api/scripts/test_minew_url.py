#!/usr/bin/env python3
"""Set Eddystone URL (jengine action 36) on a Minew ESL tag.

Does not change the e-paper image (command 02). Updates one BLE advertising slot only.

Run from apps/api on gateway WiFi:
    PYTHONPATH=. .venv/bin/python scripts/test_minew_url.py \\
        --url "https://example.com/vin/TEST" \\
        --tag e100000a1525 --gateway AC233FC267C2
"""

from __future__ import annotations

import argparse
import json
import time

from app.adapters.transport.minew_jengine import normalize_jengine_mac
from app.adapters.transport.minew_mqtt_client import get_minew_mqtt_client
from app.core.config import settings


def build_slot_url_set_req(
    *,
    tag_mac: str,
    url: str,
    device_key: str,
    req_id: int,
    slot_number: int = 1,
) -> dict:
    tag_key = normalize_jengine_mac(tag_mac)
    if not tag_key:
        raise ValueError("Tag MAC must be 12 hex characters")
    if not device_key or len(device_key) != 16:
        raise ValueError("Device key must be 16 characters")

    return {
        "action": 36,
        "version": 1,
        "method": "set_req",
        "req_id": req_id,
        "payload": {
            "key": device_key,
            "details": {
                tag_key: {
                    "slot": [
                        {
                            "slot_number": slot_number,
                            "frame_type": "10FF",
                            "adv_interval": 500,
                            "txpower": 0,
                            "adv_by_trigger": False,
                            "rssi_at_xm": -59,
                            "url": url,
                        }
                    ]
                }
            },
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Set Minew Eddystone URL (action 36)")
    parser.add_argument("--gateway", help="Gateway MQTT MAC")
    parser.add_argument("--tag", help="Tag screen ID (12 hex)")
    parser.add_argument("--url", required=True, help="https URL for Eddystone slot")
    parser.add_argument("--slot", type=int, default=1, help="Advertising slot 0-3")
    parser.add_argument("--wait", type=int, default=30, help="Seconds to listen for responses")
    args = parser.parse_args()

    gateway_mac = (args.gateway or settings.gateway_mac).strip()
    tag_mac = (args.tag or settings.esl_tag_mac).strip()
    device_key = settings.minew_jengine_device_key.strip()
    if len(device_key) != 16:
        raise SystemExit("MINEW_JENGINE_DEVICE_KEY must be set (16 chars)")

    req_id = int(time.time()) % 2_000_000_000
    command = build_slot_url_set_req(
        tag_mac=tag_mac,
        url=args.url.strip(),
        device_key=device_key,
        req_id=req_id,
        slot_number=args.slot,
    )

    client = get_minew_mqtt_client()
    client.connect()
    client.subscribe_status()
    result = client.publish_jengine_command(gateway_mac, command, req_id=req_id)
    print(f"published req_id={req_id} topic={result['topic']}")
    print(f"url={args.url.strip()}")
    print(f"listening {args.wait}s for set_rsp and type=url adverts...")

    seen: set[str] = set()
    deadline = time.monotonic() + args.wait
    while time.monotonic() < deadline:
        for msg in client.recent_messages(limit=300):
            p = msg.get("payload")
            if not isinstance(p, dict):
                continue
            if p.get("req_id") == req_id and p.get("method") == "set_rsp":
                sig = json.dumps(p, sort_keys=True)
                if sig not in seen:
                    seen.add(sig)
                    print(f"\nset_rsp ({msg['topic']}):")
                    print(json.dumps(p, indent=2))
            adv = p.get("adv")
            if isinstance(adv, list):
                for item in adv:
                    if (
                        isinstance(item, dict)
                        and str(item.get("mac", "")).lower() == normalize_jengine_mac(tag_mac)
                        and item.get("type") == "url"
                    ):
                        print(f"\nBLE url advert: {item.get('url')}")
        time.sleep(0.5)

    print("\nDone. Tap the tag with your phone and scan the QR to compare URLs.")
    client.disconnect()


if __name__ == "__main__":
    main()
