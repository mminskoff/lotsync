#!/usr/bin/env python3
"""Send a Minew test label update over MQTT.

Run from apps/api:
    PYTHONPATH=. .venv/bin/python scripts/test_minew_update.py \\
        --gateway FC233FC2B7C2 --tag <TAG_BLE_MAC>

Uses MQTT_HOST / MQTT_PORT / credentials from .env when flags omitted.
"""

from __future__ import annotations

import argparse
import uuid

from app.core.database import SessionLocal
from app.models.dealership import Dealership
from app.schemas.esl_update import TestUpdateRequest
from app.services import minew_update_service
from sqlalchemy import select


def main() -> None:
    parser = argparse.ArgumentParser(description="Publish Minew TEST UPDATE to gateway")
    parser.add_argument("--gateway", help="Gateway MAC (12 hex, no colons)")
    parser.add_argument("--tag", help="ESL tag BLE MAC (12 hex, no colons)")
    parser.add_argument("--width", type=int, default=800)
    parser.add_argument("--height", type=int, default=480)
    parser.add_argument("--color-mode", default="E6", choices=["BWR", "BWRY", "E6"])
    parser.add_argument("--price", default="$32,995")
    parser.add_argument("--dealership-id", type=uuid.UUID, help="Dealership UUID for job row")
    parser.add_argument("--no-subscribe", action="store_true")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        dealership_id = args.dealership_id
        if dealership_id is None:
            dealership_id = db.scalar(select(Dealership.id).limit(1))
        if dealership_id is None:
            raise SystemExit("No dealership found — pass --dealership-id")

        result = minew_update_service.run_test_update(
            db,
            dealership_id,
            TestUpdateRequest(
                tag_mac=args.tag,
                gateway_mac=args.gateway,
                width=args.width,
                height=args.height,
                color_mode=args.color_mode,
                price=args.price,
                subscribe=not args.no_subscribe,
            ),
        )
        print(f"job_id={result.job_id}")
        print(f"topic={result.topic}")
        print(f"seq={result.seq}")
        print(f"tag_mac={result.tag_mac}")
        print(f"gateway_mac={result.gateway_mac}")
        print(f"image={result.image_path}")
        print(f"mqtt_data={result.encoded_payload_path}")
        print("Watch gateway MQTT status logs for set_rsp / error fields.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
