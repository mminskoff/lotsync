from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.core.config import settings


def _sqlalchemy_url() -> str:
    url = settings.database_url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


engine: Engine = create_engine(_sqlalchemy_url(), pool_pre_ping=True)


def check_db_connection() -> None:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
