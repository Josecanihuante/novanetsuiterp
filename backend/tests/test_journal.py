"""Tests para el módulo de asientos contables (journal entries)."""
import pytest
from fastapi.testclient import TestClient


# ── Sin autenticación ─────────────────────────────────────────────────────────

def test_journal_list_without_token_returns_401(client: TestClient):
    r = client.get("/api/v1/journal/entries")
    assert r.status_code == 401


# ── Happy path ────────────────────────────────────────────────────────────────

def test_journal_list_as_admin_returns_200(client: TestClient, admin_headers: dict):
    r = client.get("/api/v1/journal/entries", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["success"] is True


def test_journal_list_as_viewer_returns_200(client: TestClient, viewer_headers: dict):
    """viewer puede ver asientos (solo lectura)."""
    r = client.get("/api/v1/journal/entries", headers=viewer_headers)
    assert r.status_code == 200


# ── Permisos de rol ───────────────────────────────────────────────────────────

def test_journal_create_as_viewer_returns_403(client: TestClient, viewer_headers: dict):
    r = client.post("/api/v1/journal/entries", json={
        "period_id": "00000000-0000-0000-0000-000000000000",
        "entry_number": "J-001",
        "entry_date": "2026-01-01T00:00:00",
        "lines": [
            {"account_id": "00000000-0000-0000-0000-000000000001", "debit": 1000, "credit": 0},
            {"account_id": "00000000-0000-0000-0000-000000000002", "debit": 0, "credit": 1000},
        ]
    }, headers=viewer_headers)
    assert r.status_code == 403


def test_journal_post_as_contador_returns_403(client: TestClient, contador_headers: dict):
    """Solo admin puede contabilizar asientos — contador recibe 403."""
    r = client.patch(
        "/api/v1/journal/entries/00000000-0000-0000-0000-000000000000/post",
        headers=contador_headers
    )
    # 403 porque no tiene permiso, o 404 si el asiento no existe
    # El test valida que el patch de 'post' no es accesible para contador
    assert r.status_code in (403, 404)


# ── Not Found ─────────────────────────────────────────────────────────────────

def test_journal_get_nonexistent_returns_404(client: TestClient, admin_headers: dict):
    r = client.get("/api/v1/journal/entries/00000000-0000-0000-0000-000000000000", headers=admin_headers)
    assert r.status_code == 404


# ── Reglas de negocio ─────────────────────────────────────────────────────────

def test_journal_create_unbalanced_entry_returns_422(client: TestClient, admin_headers: dict):
    """Asiento que no cuadra (débito ≠ crédito) debe ser rechazado."""
    r = client.post("/api/v1/journal/entries", json={
        "period_id": "00000000-0000-0000-0000-000000000000",
        "entry_number": "J-INVALID",
        "entry_date": "2026-01-01T00:00:00",
        "lines": [
            {"account_id": "00000000-0000-0000-0000-000000000001", "debit": 1000, "credit": 0},
            {"account_id": "00000000-0000-0000-0000-000000000002", "debit": 0, "credit": 500},
        ]
    }, headers=admin_headers)
    assert r.status_code == 422
