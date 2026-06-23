#!/usr/bin/env bash
# Run the sync worker from apps/api (loads .env via pydantic-settings).
set -euo pipefail
cd "$(dirname "$0")"
export PYTHONPATH=.

if [[ -x .venv/bin/python ]]; then
  PYTHON=.venv/bin/python
else
  PYTHON=python3
fi

exec "$PYTHON" -m app.workers.sync_worker "$@"
