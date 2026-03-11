"""Motor y sesión SQLAlchemy con soporte SSL para bases de datos cloud."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from typing import Generator

from app.core.config import settings

def get_connect_args(url: str) -> dict:
    """Neon, Render y otros Postgres cloud requieren SSL."""
    if any(host in url for host in ["neon.tech", "render.com", "supabase"]):
        return {"sslmode": "require"}
    return {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=get_connect_args(settings.DATABASE_URL),
    pool_pre_ping=True,   # detecta conexiones caídas antes de usarlas
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,     # reconecta tras inactividad prolongada
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db() -> Generator[Session, None, None]:
    """Dependencia FastAPI — provee una sesión de BD por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
