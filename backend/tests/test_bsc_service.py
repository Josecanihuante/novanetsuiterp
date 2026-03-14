"""Tests unitarios para bsc_service."""
import pytest
from app.services.bsc_service import calcular_todas_las_metricas

BASE = {
    "ingresos": 1_000_000,
    "costo_ventas": 600_000,
    "gastos_operativos": 150_000,
    "depreciacion": 20_000,
    "amortizacion": 10_000,
    "gastos_financieros": 30_000,
    "impuesto_renta": 54_000,
    "activos_totales": 2_000_000,
    "patrimonio": 800_000,
    "pasivo_total": 1_200_000,
    "activo_corriente": 500_000,
    "pasivo_corriente": 300_000,
    "inventario": 100_000,
    "efectivo": 150_000,
    "costos_variables": 400_000,
    "fco": 180_000,
    "capex": 50_000,
    "deuda_total": 900_000,
    "deuda_financiera_neta": 750_000,
    "gastos_intereses": 30_000,
    "activo_total": 2_000_000,
    "valor_mercado": 1_500_000,
    "utilidades_retenidas": 200_000,
    "capital_trabajo": 200_000,
    "nopat": 136_000,
    "capital_invertido": 1_400_000,
    "wacc": 0.08,
    "num_empleados": 50,
    "dias_periodo": 30,
    "cuentas_cobrar": 200_000,
    "cuentas_pagar": 150_000,
    "cmv": 600_000,
    "costos_fijos": 100_000,
    "margen_contribucion_unitario": 2500,
    "ventas_reales": 1_000_000,
    "ventas_pe": 700_000,
    "inversion": 500_000,
    "ganancia": 650_000,
    "ventas_actual": 1_000_000,
    "ventas_anterior": 850_000,
}

# Modificado para forzar divisiones por cero
BASE_ZERO = {k: 0 for k in BASE}

def test_todas_las_metricas_base():
    """Prueba que el cálculo general no falle y retorne valores calculados."""
    res = calcular_todas_las_metricas(BASE)
    assert res is not None
    assert isinstance(res, dict)
    
    # 1. Rentabilidad
    assert res["utilidad_bruta"] == 400_000
    assert res["margen_bruto"] == pytest.approx(40.0)
    assert res["ebit"] == 250_000
    assert res["ebitda"] == 280_000
    assert res["margen_ebitda"] == pytest.approx(28.0)
    assert res["margen_operativo"] == pytest.approx(25.0)
    assert res["ebt"] == 220_000
    assert res["utilidad_neta"] == 166_000  # 220k - 54k
    assert res["margen_neto"] == pytest.approx(16.6)
    assert res["roi"] == pytest.approx(30.0)
    assert res["roa"] == pytest.approx(8.3)
    assert res["roe"] == pytest.approx(20.75)
    assert res["roic"] == pytest.approx(136_000 / 14_000) # 136k / 1.4M * 100 = 9.714
    assert res["contribucion_marginal"] == 600_000

    # 2. Liquidez
    assert res["capital_trabajo"] == 200_000
    assert res["razon_corriente"] == pytest.approx(500/300)
    assert res["prueba_acida"] == pytest.approx(400/300)
    assert res["solvencia_cp"] == pytest.approx(150/300 * 100)
    assert res["free_cash_flow"] == 130_000

    # 3. Endeudamiento
    assert res["estructura_financiamiento"] == pytest.approx(900/(900+800) * 100)
    assert res["deuda_patrimonio"] == pytest.approx(1200/800)
    assert res["deuda_activos"] == pytest.approx(1200/2000 * 100)
    assert res["deuda_ebitda"] == pytest.approx(750/280)
    assert res["cobertura_intereses"] == pytest.approx(250/30)
    assert res["leverage"] == pytest.approx(2000/800)
    
    assert res["z_altman"] is not None

    # 4. Eficiencia
    assert res["rot_activo_total"] == pytest.approx(1/2) # 1M / 2M
    assert res["rot_capital_trabajo"] == pytest.approx(1000/200)
    assert res["ventas_empleado"] == 20_000
    assert res["gasto_op_ventas"] == pytest.approx(15.0)
    assert res["gasto_op_diario"] == 5000

    # 5. Ciclo Efectivo
    # dias_cxc = 200k / (1M / 360) = 72
    assert res["dias_cxc"] == 72.0
    # dias_inventario = 100k / (600k / 360) = 60
    assert res["dias_inventario"] == 60.0
    # dias_proveedores = 150k / (600k / 360) = 90
    assert res["dias_proveedores"] == 90.0
    # ciclo_efectivo = 72 + 60 - 90 = 42
    assert res["ciclo_efectivo"] == 42.0

    # 6. Estratégico
    assert res["punto_equilibrio"] == 100_000 / 2500 # 40
    assert res["cobertura_pe"] == pytest.approx(100/70 * 100)
    
    # roi_dupont = margen_neto (0.166) * rot_activo (0.5) * leverage (2.5) -> 0.166 * 1.25 -> approx 20.75
    assert res["roi_dupont"] == pytest.approx(20.75)
    
    assert res["eva"] == 136_000 - (0.08 * 1_400_000)
    assert res["crecimiento_ventas"] == pytest.approx((150 / 850) * 100)


def test_todas_las_metricas_zero():
    """Comprueba que división por cero no lance ZeroDivisionError y retorne None."""
    res = calcular_todas_las_metricas(BASE_ZERO)
    
    # Métricas que se basan solo en restas/sumas deben dar 0.
    assert res["utilidad_bruta"] == 0
    assert res["ebit"] == 0
    assert res["ebitda"] == 0
    assert res["ebt"] == 0
    assert res["utilidad_neta"] == 0
    assert res["contribucion_marginal"] == 0
    assert res["capital_trabajo"] == 0
    assert res["free_cash_flow"] == 0
    assert res["eva"] == 0

    # Todas las métricas que implican divisiones deben dar None
    assert res["margen_bruto"] is None
    assert res["margen_ebitda"] is None
    assert res["margen_operativo"] is None
    assert res["margen_neto"] is None
    assert res["roi"] is None
    assert res["roa"] is None
    assert res["roe"] is None
    assert res["roic"] is None
    
    assert res["razon_corriente"] is None
    assert res["prueba_acida"] is None
    assert res["solvencia_cp"] is None
    
    assert res["estructura_financiamiento"] is None
    assert res["deuda_patrimonio"] is None
    assert res["deuda_activos"] is None
    assert res["deuda_ebitda"] is None
    assert res["cobertura_intereses"] is None
    assert res["leverage"] is None
    assert res["z_altman"] is None

    assert res["rot_activo_total"] is None
    assert res["rot_capital_trabajo"] is None
    assert res["ventas_empleado"] is None
    assert res["gasto_op_ventas"] is None
    assert res["gasto_op_diario"] is None

    assert res["dias_cxc"] is None
    assert res["dias_inventario"] is None
    assert res["dias_proveedores"] is None
    # Como DxC, DxI, DxP son None, el ciclo efectivo suma 0 en safe (or 0)
    assert res["ciclo_efectivo"] == 0
    
    assert res["punto_equilibrio"] is None
    assert res["cobertura_pe"] is None
    assert res["roi_dupont"] is None
    assert res["crecimiento_ventas"] is None
