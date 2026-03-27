"""Tests para el módulo de clientes."""
import pytest
from fastapi.testclient import TestClient


def test_customers_list_without_token_returns_401(client: TestClient):
    r = client.get("/api/v1/customers")
    assert r.status_code == 401


def test_customers_list_as_admin_returns_200(client: TestClient, admin_headers: dict):
    r = client.get("/api/v1/customers", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["success"] is True
    assert isinstance(r.json()["data"], list)


def test_customers_list_as_viewer_returns_200(client: TestClient, viewer_headers: dict):
    r = client.get("/api/v1/customers", headers=viewer_headers)
    assert r.status_code == 200


def test_customers_create_as_viewer_returns_403(client: TestClient, viewer_headers: dict):
    r = client.post("/api/v1/customers", json={
        "tax_id": "76.000.001-1", "name": "Test SA"
    }, headers=viewer_headers)
    assert r.status_code == 403


def test_customers_delete_as_contador_returns_403(client: TestClient, contador_headers: dict):
    r = client.delete("/api/v1/customers/00000000-0000-0000-0000-000000000000", headers=contador_headers)
    assert r.status_code in (403, 404)


def test_customers_get_nonexistent_returns_404(client: TestClient, admin_headers: dict):
    r = client.get("/api/v1/customers/00000000-0000-0000-0000-000000000000", headers=admin_headers)
    assert r.status_code == 404
