"""Motor y sesión SQLAlchemy con soporte SSL para Neon/Render."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from typing import Generator

from app.core.config import settings


def get_database_url(url: str) -> str:
    """
    Asegura SSL para Neon / Postgres cloud.
    Evita problemas con psycopg2 en producción.
    """
    if "sslmode=" not in url:
        return f"{url}?sslmode=require"
    return url


engine = create_engine(
    get_database_url(settings.DATABASE_URL),
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    """Dependencia FastAPI — sesión por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()