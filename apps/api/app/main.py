from fastapi import FastAPI
from fastapi.responses import JSONResponse

import app.models  # noqa: F401 — register ORM models for SQLAlchemy metadata
from app.core.database import check_db_connection
from app.routers import api_router

app = FastAPI(title="LotSync API", version="0.1.0")

app.include_router(api_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    try:
        check_db_connection()
        return {"status": "ok", "database": "connected"}
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "error", "database": "disconnected"},
        )
