"""Fixtures globales de pytest."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app

# BD SQLite en memoria para tests
SQLALCHEMY_TEST_URL = "sqlite:///:memory:"

engine_test = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)


@pytest.fixture()
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Fixtures de autenticación JWT ────────────────────────────────────────────

@pytest.fixture(scope="session")
def admin_token() -> str:
    """Token JWT para el rol admin."""
    return create_access_token(data={
        "sub": "ceo@innovaconsulting.cl",
        "role": "admin",
        "user_id": "00000000-0000-0000-0000-000000000001",
    })


@pytest.fixture(scope="session")
def contador_token() -> str:
    """Token JWT para el rol contador."""
    return create_access_token(data={
        "sub": "contador.jefe@innovaconsulting.cl",
        "role": "contador",
        "user_id": "00000000-0000-0000-0000-000000000002",
    })


@pytest.fixture(scope="session")
def viewer_token() -> str:
    """Token JWT para el rol viewer."""
    return create_access_token(data={
        "sub": "auditor@pwc-chile.cl",
        "role": "viewer",
        "user_id": "00000000-0000-0000-0000-000000000003",
    })


@pytest.fixture(scope="session")
def admin_headers(admin_token: str) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def contador_headers(contador_token: str) -> dict:
    return {"Authorization": f"Bearer {contador_token}"}


@pytest.fixture(scope="session")
def viewer_headers(viewer_token: str) -> dict:
    return {"Authorization": f"Bearer {viewer_token}"}
