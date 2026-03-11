"""Tests unitarios para financial_service — verificación ecuación contable."""
from decimal import Decimal
from app.services.financial_service import (
    generar_balance_general,
    generar_estado_resultados,
    generar_efe,
    generar_eoaf,
    generar_estados_financieros,
)

# Datos de prueba
DATA = {
    # Resultados
    "ingresos": Decimal("1000000"),
    "costo_ventas": Decimal("600000"),
    "gastos_operativos": Decimal("150000"),
    "depreciacion": Decimal("20000"),
    "amortizacion": Decimal("10000"),
    "gastos_financieros": Decimal("30000"),
    "impuesto_renta": Decimal("54000"),
    # Balance — Activo
    "efectivo": Decimal("150000"),
    "cuentas_cobrar": Decimal("200000"),
    "inventario": Decimal("100000"),
    "otros_activos_corrientes": Decimal("50000"),
    "activos_fijos": Decimal("1200000"),
    "depreciacion_acumulada": Decimal("200000"),
    "activos_intangibles": Decimal("100000"),
    "otros_activos_nc": Decimal("0"),
    # Balance — Pasivo
    "cuentas_pagar": Decimal("150000"),
    "deuda_cp": Decimal("100000"),
    "otros_pasivos_corrientes": Decimal("50000"),
    "deuda_lp": Decimal("700000"),
    "otros_pasivos_nc": Decimal("0"),
    # Balance — Patrimonio
    "capital": Decimal("400000"),
    "reservas": Decimal("50000"),
    "utilidades_retenidas": Decimal("100000"),
    "resultado_ejercicio": Decimal("50000"),  # hace cuadrar el balance
    # EFE
    "utilidad_neta": Decimal("136000"),
    "var_cxc": Decimal("0"),
    "var_inventario": Decimal("0"),
    "var_cxp": Decimal("0"),
    "otros_operativos": Decimal("0"),
    "compra_activos": Decimal("50000"),
    "venta_activos": Decimal("0"),
    "otros_inversion": Decimal("0"),
    "emision_deuda": Decimal("0"),
    "pago_deuda": Decimal("0"),
    "dividendos": Decimal("0"),
    "otros_financiamiento": Decimal("0"),
    "saldo_inicial": Decimal("100000"),
    # EOAF
    "fuentes": [
        {"nombre": "Utilidad neta", "monto": Decimal("136000")},
        {"nombre": "Nuevo préstamo", "monto": Decimal("200000")},
    ],
    "usos": [
        {"nombre": "CAPEX", "monto": Decimal("50000")},
        {"nombre": "Pago dividendos", "monto": Decimal("0")},
    ],
    "moneda": "CLP",
}


def test_ecuacion_contable():
    """Activo Total == Pasivo Total + Patrimonio."""
    resultado = generar_balance_general(DATA)
    resumen = resultado["resumen"]
    total_activo = resumen["activo_total"]
    total_ppc = resumen["pasivo_total"] + resumen["patrimonio"]
    assert abs(total_activo - total_ppc) < 0.01


def test_ecuacion_contable_flag():
    """El flag 'cuadra' debe ser True con datos balanceados."""
    resultado = generar_balance_general(DATA)
    assert resultado["resumen"]["cuadra"] is True


def test_estado_resultados_utilidad_bruta():
    """Utilidad bruta = Ingresos - CMV."""
    resultado = generar_estado_resultados(DATA)
    lineas = {l["name"]: l["value"] for l in resultado["lineas"] if "name" in l}
    assert abs(lineas["Utilidad Bruta"] - 400_000) < 0.01


def test_estado_resultados_margen_neto():
    """Margen neto esperado: 136k / 1M = 13.6%."""
    resultado = generar_estado_resultados(DATA)
    assert abs(resultado["resumen"]["margen_neto_pct"] - 13.6) < 0.01


def test_efe_saldo_final():
    """Saldo final = saldo inicial + variación neta."""
    resultado = generar_efe(DATA)
    resumen = resultado["resumen"]
    esperado = resumen["saldo_inicial"] + resumen["variacion_neta"]
    assert abs(resumen["saldo_final"] - esperado) < 0.01


def test_eoaf_totales():
    """Fuentes y usos calculados correctamente."""
    resultado = generar_eoaf({"fuentes": DATA["fuentes"], "usos": DATA["usos"], "moneda": "CLP"})
    resumen = resultado["resumen"]
    assert abs(resumen["total_fuentes"] - 336_000) < 0.01
    assert abs(resumen["total_usos"] - 50_000) < 0.01


def test_generar_todos_los_estados():
    """Genera los 4 estados sin excepción."""
    resultado = generar_estados_financieros(DATA)
    assert "estado_resultados" in resultado
    assert "balance_general" in resultado
    assert "efe" in resultado
    assert "eoaf" in resultado
