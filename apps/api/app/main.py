from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.core.database import check_db_connection

app = FastAPI(title="LotSync API", version="0.1.0")


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
