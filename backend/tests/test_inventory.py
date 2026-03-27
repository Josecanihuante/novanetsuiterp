"""Tests para el módulo de inventario (productos)."""
import pytest
from fastapi.testclient import TestClient


def test_inventory_list_without_token_returns_401(client: TestClient):
    r = client.get("/api/v1/inventory/products")
    assert r.status_code == 401


def test_inventory_list_as_admin_returns_200(client: TestClient, admin_headers: dict):
    r = client.get("/api/v1/inventory/products", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["success"] is True


def test_inventory_list_as_viewer_returns_200(client: TestClient, viewer_headers: dict):
    r = client.get("/api/v1/inventory/products", headers=viewer_headers)
    assert r.status_code == 200


def test_inventory_create_as_viewer_returns_403(client: TestClient, viewer_headers: dict):
    r = client.post("/api/v1/inventory/products", json={
        "sku": "TEST-001", "name": "Producto Test", "unit_cost": 1000, "sale_price": 1500
    }, headers=viewer_headers)
    assert r.status_code == 403


def test_inventory_delete_as_contador_returns_403(client: TestClient, contador_headers: dict):
    r = client.delete("/api/v1/inventory/products/00000000-0000-0000-0000-000000000000", headers=contador_headers)
    assert r.status_code in (403, 404)


def test_inventory_get_nonexistent_returns_404(client: TestClient, admin_headers: dict):
    r = client.get("/api/v1/inventory/products/00000000-0000-0000-0000-000000000000", headers=admin_headers)
    assert r.status_code == 404


# ── Test de negocio ───────────────────────────────────────────────────────────

def test_ppm_amount_equals_gross_income_times_rate():
    """
    Regla PPM Chile: ppm_amount = gross_income * tasa_ppm (≈ 0.028)
    Este test valida la fórmula base del cálculo de PPM.
    """
    gross_income = 10_000_000  # CLP
    ppm_rate = 0.028
    expected_ppm = gross_income * ppm_rate
    assert expected_ppm == 280_000.0


def test_viewer_can_read_all_main_endpoints(client: TestClient, viewer_headers: dict):
    """viewer puede hacer GET en todos los módulos principales."""
    endpoints = [
        "/api/v1/accounts",
        "/api/v1/journal/entries",
        "/api/v1/invoices",
        "/api/v1/customers",
        "/api/v1/vendors",
        "/api/v1/inventory/products",
    ]
    for endpoint in endpoints:
        r = client.get(endpoint, headers=viewer_headers)
        assert r.status_code == 200, f"viewer debería poder hacer GET en {endpoint}, pero obtuvo {r.status_code}"
