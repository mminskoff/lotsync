from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import app.models  # noqa: F401 — register ORM models for SQLAlchemy metadata
from app.core.config import settings
from app.core.config import settings
from app.core.database import check_db_connection
from app.routers import api_router

app = FastAPI(title="LotSync API", version="0.1.0")

if settings.environment == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router)


@app.get("/health")
def health():
    gateway_mac = settings.gateway_mac.strip()
    return {
        "status": "ok",
        "renderer_adapter": settings.renderer_adapter,
        "transport_adapter": settings.transport_adapter,
        "minew_mqtt_configured": bool(
            settings.mqtt_host.strip()
            and (gateway_mac or settings.minew_mqtt_topic.strip())
        ),
        "gateway_mac_set": bool(gateway_mac),
        "esl_tag_mac_set": bool(settings.esl_tag_mac.strip()),
    }


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
