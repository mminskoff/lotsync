"""Process pending ESL sync events (run as a separate worker process)."""

from __future__ import annotations

import argparse
import logging
import time

from app.core.database import SessionLocal
from app.services.sync_engine_service import process_pending_sync_events

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def run_once(limit: int) -> dict[str, int]:
    db = SessionLocal()
    try:
        return process_pending_sync_events(db, limit=limit)
    finally:
        db.close()


def run_loop(limit: int, interval_seconds: float) -> None:
    logger.info("Sync worker started (limit=%s, interval=%ss)", limit, interval_seconds)
    while True:
        summary = run_once(limit)
        if summary["processed"]:
            logger.info("Batch complete: %s", summary)
        time.sleep(interval_seconds)


def main() -> None:
    parser = argparse.ArgumentParser(description="LotSync sync event worker")
    parser.add_argument("--once", action="store_true", help="Process one batch and exit")
    parser.add_argument("--limit", type=int, default=25, help="Max events per batch")
    parser.add_argument("--interval", type=float, default=5.0, help="Poll interval in seconds")
    args = parser.parse_args()

    if args.once:
        summary = run_once(args.limit)
        logger.info("Done: %s", summary)
        return

    run_loop(args.limit, args.interval)


if __name__ == "__main__":
    main()
