"""Tests unitarios para ppm_service."""
import pytest
from app.services.ppm_service import calcular_ppm


class MockConfig:
    def __init__(self, regime: str):
        self.tax_regime = regime


class MockTax:
    def __init__(self, impuesto: float, ingresos: float, perdida: float = 0):
        self.first_category_tax = impuesto
        self.gross_income = ingresos
        self.accumulated_loss = perdida


# ── Régimen Pro PyME ─────────────────────────────────────────────────────────

def test_pro_pyme():
    r = calcular_ppm(3, 2025, 1_000_000, MockConfig("pro_pyme"), None)
    assert r["ppm_rate"] == pytest.approx(0.0025)
    assert r["ppm_amount"] == 2_500


# ── Régimen general sin historial ─────────────────────────────────────────────

def test_sin_historia():
    r = calcular_ppm(3, 2025, 1_000_000, MockConfig("general"), None)
    assert r["ppm_rate"] == pytest.approx(0.01)


# ── Régimen general con historial ─────────────────────────────────────────────

def test_general_tasa_normal():
    tax = MockTax(impuesto=25_000, ingresos=1_000_000)  # tasa = 2.5%
    r = calcular_ppm(3, 2025, 500_000, MockConfig("general"), tax)
    assert r["ppm_rate"] == pytest.approx(0.025)
    assert r["ppm_amount"] == 12_500


# ── Tope del 5% (Art. 84 LIR) ────────────────────────────────────────────────

def test_general_tope_5_porciento():
    tax = MockTax(impuesto=80_000, ingresos=1_000_000)  # tasa calculada=8% > tope
    r = calcular_ppm(3, 2025, 500_000, MockConfig("general"), tax)
    assert r["ppm_rate"] == pytest.approx(0.05)


# ── Suspensión Art. 90 LIR ────────────────────────────────────────────────────

def test_suspension_art90():
    tax = MockTax(impuesto=20_000, ingresos=1_000_000, perdida=500_000)
    r = calcular_ppm(3, 2025, 1_000_000, MockConfig("general"), tax)
    assert r["is_suspended"] is True
    assert r["ppm_amount"] == 0


# ── Detalle siempre presente ──────────────────────────────────────────────────

def test_detalle_presente():
    r = calcular_ppm(1, 2025, 500_000, MockConfig("pro_pyme"), None)
    assert isinstance(r["detalle"], list)
    assert len(r["detalle"]) >= 4


# ── Campos del resultado ─────────────────────────────────────────────────────

def test_campos_resultado():
    r = calcular_ppm(6, 2025, 300_000, MockConfig("pro_pyme"), None)
    assert "period_month" in r
    assert "period_year" in r
    assert "gross_income" in r
    assert "ppm_rate" in r
    assert "ppm_amount" in r
    assert "is_suspended" in r
    assert "suspension_reason" in r
    assert r["period_month"] == 6
    assert r["period_year"] == 2025
