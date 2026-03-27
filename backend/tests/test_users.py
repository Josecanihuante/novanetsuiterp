"""Tests para el módulo de usuarios (CRUD + roles)."""
import pytest
from fastapi.testclient import TestClient


# ── Sin autenticación ─────────────────────────────────────────────────────────

def test_users_list_without_token_returns_401(client: TestClient):
    r = client.get("/api/v1/users")
    assert r.status_code == 401


def test_users_me_without_token_returns_401(client: TestClient):
    r = client.get("/api/v1/users/me")
    assert r.status_code == 401


# ── Permisos de rol ───────────────────────────────────────────────────────────

def test_users_list_as_viewer_returns_403(client: TestClient, viewer_headers: dict):
    """viewer no puede listar usuarios (solo admin)."""
    r = client.get("/api/v1/users", headers=viewer_headers)
    assert r.status_code == 403


def test_users_list_as_contador_returns_403(client: TestClient, contador_headers: dict):
    """contador no puede listar usuarios (solo admin)."""
    r = client.get("/api/v1/users", headers=contador_headers)
    assert r.status_code == 403


def test_users_create_as_viewer_returns_403(client: TestClient, viewer_headers: dict):
    r = client.post("/api/v1/users", json={
        "email": "nuevo@test.cl", "full_name": "Test User",
        "role": "viewer", "password": "Test1234!"
    }, headers=viewer_headers)
    assert r.status_code == 403


def test_users_create_as_contador_returns_403(client: TestClient, contador_headers: dict):
    r = client.post("/api/v1/users", json={
        "email": "nuevo@test.cl", "full_name": "Test User",
        "role": "viewer", "password": "Test1234!"
    }, headers=contador_headers)
    assert r.status_code == 403


# ── Not Found ─────────────────────────────────────────────────────────────────

def test_users_get_nonexistent_returns_404(client: TestClient, admin_headers: dict):
    r = client.get("/api/v1/users/00000000-0000-0000-0000-000000000000", headers=admin_headers)
    assert r.status_code == 404


# ── Me endpoint ───────────────────────────────────────────────────────────────

def test_users_me_as_any_role_returns_200(client: TestClient, viewer_headers: dict):
    r = client.get("/api/v1/users/me", headers=viewer_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert "email" in data["data"]
    assert "role" in data["data"]
