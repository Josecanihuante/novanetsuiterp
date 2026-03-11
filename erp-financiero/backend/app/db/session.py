"""Motor y sesión SQLAlchemy con soporte SSL para Neon (PostgreSQL serverless)."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings

# Neon requiere SSL; se activa cuando la URL pertenece a neon.tech
# o cuando no trae sslmode explícito en la query string.
# En local con Docker sin SSL, suministra la variable DATABASE_URL con
# sslmode=disable o usa la URL de Neon directamente en Railway.
connect_args: dict = {}
if "neon.tech" in settings.DATABASE_URL:
    connect_args = {"sslmode": "require"}
elif "sslmode" not in settings.DATABASE_URL and "localhost" not in settings.DATABASE_URL:
    connect_args = {"sslmode": "require"}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,   # detecta conexiones caídas antes de usarlas
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependencia FastAPI — provee una sesión de BD por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
