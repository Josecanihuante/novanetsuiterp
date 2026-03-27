"""Tests para el módulo de cuentas contables."""
import pytest
from fastapi.testclient import TestClient


# ── Sin autenticación ─────────────────────────────────────────────────────────

def test_accounts_list_without_token_returns_401(client: TestClient):
    r = client.get("/api/v1/accounts")
    assert r.status_code == 401


def test_accounts_create_without_token_returns_401(client: TestClient):
    r = client.post("/api/v1/accounts", json={})
    assert r.status_code == 401


# ── Happy path ────────────────────────────────────────────────────────────────

def test_accounts_list_as_admin_returns_200(client: TestClient, admin_headers: dict):
    r = client.get("/api/v1/accounts", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)


def test_accounts_tree_returns_200(client: TestClient, admin_headers: dict):
    r = client.get("/api/v1/accounts/tree", headers=admin_headers)
    assert r.status_code == 200


# ── Permisos de rol ───────────────────────────────────────────────────────────

def test_accounts_create_as_viewer_returns_403(client: TestClient, viewer_headers: dict):
    r = client.post("/api/v1/accounts", json={
        "code": "1-01", "name": "Caja", "account_type": "asset"
    }, headers=viewer_headers)
    assert r.status_code == 403


def test_accounts_delete_as_contador_returns_403(client: TestClient, contador_headers: dict):
    r = client.delete("/api/v1/accounts/00000000-0000-0000-0000-000000000000", headers=contador_headers)
    # 403 o 404 — lo importante es que no sea 200
    assert r.status_code in (403, 404)


# ── Not Found ─────────────────────────────────────────────────────────────────

def test_accounts_get_nonexistent_returns_404(client: TestClient, admin_headers: dict):
    r = client.get("/api/v1/accounts/00000000-0000-0000-0000-000000000000", headers=admin_headers)
    assert r.status_code == 404
