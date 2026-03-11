"""
Servicio BSC (Balanced Scorecard) — Cálculo de métricas financieras.

Todas las funciones reciben un dict `d` con los datos del período.
Retornan float o None. Nunca lanzan excepción.
"""
from typing import Optional
from sqlalchemy.orm import Session


def safe_div(a, b) -> Optional[float]:
    """División segura: retorna None si el divisor es cero o None."""
    return None if not b else a / b


# ══════════════════════════════════════════════════════════════════════════════
# PERSPECTIVA 1 — Rentabilidad
# ══════════════════════════════════════════════════════════════════════════════

def utilidad_bruta(d: dict) -> float:
    return d["ingresos"] - d["costo_ventas"]


def margen_bruto(d: dict) -> Optional[float]:
    result = safe_div(utilidad_bruta(d), d["ingresos"])
    return None if result is None else result * 100


def ebit(d: dict) -> float:
    return utilidad_bruta(d) - d["gastos_operativos"]


def ebitda(d: dict) -> float:
    return ebit(d) + d["depreciacion"] + d["amortizacion"]


def margen_ebitda(d: dict) -> Optional[float]:
    result = safe_div(ebitda(d), d["ingresos"])
    return None if result is None else result * 100


def margen_operativo(d: dict) -> Optional[float]:
    result = safe_div(ebit(d), d["ingresos"])
    return None if result is None else result * 100


def ebt(d: dict) -> float:
    return ebit(d) - d["gastos_financieros"]


def utilidad_neta(d: dict) -> float:
    return ebt(d) - d["impuesto_renta"]


def margen_neto(d: dict) -> Optional[float]:
    result = safe_div(utilidad_neta(d), d["ingresos"])
    return None if result is None else result * 100


def roi(d: dict) -> Optional[float]:
    result = safe_div(d["ganancia"] - d["inversion"], d["inversion"])
    return None if result is None else result * 100


def roa(d: dict) -> Optional[float]:
    result = safe_div(utilidad_neta(d), d["activos_totales"])
    return None if result is None else result * 100


def roe(d: dict) -> Optional[float]:
    result = safe_div(utilidad_neta(d), d["patrimonio"])
    return None if result is None else result * 100


def roic(d: dict) -> Optional[float]:
    result = safe_div(d["nopat"], d["capital_invertido"])
    return None if result is None else result * 100


def contribucion_marginal(d: dict) -> float:
    return d["ingresos"] - d["costos_variables"]


# ══════════════════════════════════════════════════════════════════════════════
# PERSPECTIVA 2 — Liquidez
# ══════════════════════════════════════════════════════════════════════════════

def capital_trabajo(d: dict) -> float:
    return d["activo_corriente"] - d["pasivo_corriente"]


def razon_corriente(d: dict) -> Optional[float]:
    return safe_div(d["activo_corriente"], d["pasivo_corriente"])


def prueba_acida(d: dict) -> Optional[float]:
    return safe_div(d["activo_corriente"] - d["inventario"], d["pasivo_corriente"])


def solvencia_cp(d: dict) -> Optional[float]:
    result = safe_div(d["efectivo"], d["pasivo_corriente"])
    return None if result is None else result * 100


def free_cash_flow(d: dict) -> float:
    return d["fco"] - d["capex"]


# ══════════════════════════════════════════════════════════════════════════════
# PERSPECTIVA 3 — Endeudamiento
# ══════════════════════════════════════════════════════════════════════════════

def estructura_financiamiento(d: dict) -> Optional[float]:
    result = safe_div(d["deuda_total"], d["deuda_total"] + d["patrimonio"])
    return None if result is None else result * 100


def deuda_patrimonio(d: dict) -> Optional[float]:
    return safe_div(d["pasivo_total"], d["patrimonio"])


def deuda_activos(d: dict) -> Optional[float]:
    result = safe_div(d["pasivo_total"], d["activo_total"])
    return None if result is None else result * 100


def deuda_ebitda(d: dict) -> Optional[float]:
    return safe_div(d["deuda_financiera_neta"], ebitda(d))


def cobertura_intereses(d: dict) -> Optional[float]:
    return safe_div(ebit(d), d["gastos_intereses"])


def leverage(d: dict) -> Optional[float]:
    return safe_div(d["activo_total"], d["patrimonio"])


def z_altman(d: dict) -> Optional[float]:
    """
    Score Z de Altman para predicción de quiebra.
    Z > 2.99: zona segura. 1.81 < Z < 2.99: zona gris. Z < 1.81: zona de quiebra.
    """
    a = d["activo_total"]
    if not a:
        return None
    return (
        1.2 * (d["capital_trabajo"] / a)
        + 1.4 * (d["utilidades_retenidas"] / a)
        + 3.3 * (ebit(d) / a)
        + 0.6 * (d["valor_mercado"] / d["pasivo_total"])
        + d["ingresos"] / a
    )


# ══════════════════════════════════════════════════════════════════════════════
# PERSPECTIVA 4 — Eficiencia
# ══════════════════════════════════════════════════════════════════════════════

def rot_activo_total(d: dict) -> Optional[float]:
    return safe_div(d["ingresos"], d["activos_totales"])


def rot_capital_trabajo(d: dict) -> Optional[float]:
    return safe_div(d["ingresos"], capital_trabajo(d))


def ventas_empleado(d: dict) -> Optional[float]:
    return safe_div(d["ingresos"], d["num_empleados"])


def gasto_op_ventas(d: dict) -> Optional[float]:
    result = safe_div(d["gastos_operativos"], d["ingresos"])
    return None if result is None else result * 100


def gasto_op_diario(d: dict) -> Optional[float]:
    return safe_div(d["gastos_operativos"], d["dias_periodo"])


# ══════════════════════════════════════════════════════════════════════════════
# PERSPECTIVA 5 — Ciclo de Efectivo
# ══════════════════════════════════════════════════════════════════════════════

def dias_cxc(d: dict) -> Optional[float]:
    """Días promedio de cobro (Cuentas por Cobrar / (Ingresos / 360))."""
    return safe_div(d["cuentas_cobrar"], safe_div(d["ingresos"], 360))


def dias_inventario(d: dict) -> Optional[float]:
    """Días de inventario (Inventario / (CMV / 360))."""
    return safe_div(d["inventario"], safe_div(d["cmv"], 360))


def dias_proveedores(d: dict) -> Optional[float]:
    """Días promedio de pago (Cuentas por Pagar / (CMV / 360))."""
    return safe_div(d["cuentas_pagar"], safe_div(d["cmv"], 360))


def ciclo_efectivo(d: dict) -> float:
    """Ciclo de Conversión de Efectivo = DxC + DxI - DxP."""
    return (dias_cxc(d) or 0) + (dias_inventario(d) or 0) - (dias_proveedores(d) or 0)


# ══════════════════════════════════════════════════════════════════════════════
# PERSPECTIVA 6 — Estratégico
# ══════════════════════════════════════════════════════════════════════════════

def punto_equilibrio(d: dict) -> Optional[float]:
    """Unidades / valor de ventas mínimo para cubrir costos fijos."""
    return safe_div(d["costos_fijos"], d["margen_contribucion_unitario"])


def cobertura_pe(d: dict) -> Optional[float]:
    """% de cobertura sobre el punto de equilibrio."""
    result = safe_div(d["ventas_reales"], d["ventas_pe"])
    return None if result is None else result * 100


def roi_dupont(d: dict) -> Optional[float]:
    """ROE descompuesto (DuPont): Margen Neto × Rotación Activo × Leverage."""
    mn = margen_neto(d)
    ra = rot_activo_total(d)
    lev = leverage(d)
    return None if None in (mn, ra, lev) else mn * ra * lev


def eva(d: dict) -> float:
    """Economic Value Added: NOPAT - (WACC × Capital Invertido)."""
    return d["nopat"] - (d["wacc"] * d["capital_invertido"])


def crecimiento_ventas(d: dict) -> Optional[float]:
    """Tasa de crecimiento de ventas respecto al período anterior."""
    result = safe_div(d["ventas_actual"] - d["ventas_anterior"], d["ventas_anterior"])
    return None if result is None else result * 100


# ══════════════════════════════════════════════════════════════════════════════
# Función de cálculo completo
# ══════════════════════════════════════════════════════════════════════════════

def calcular_todas_las_metricas(d: dict) -> dict:
    """
    Ejecuta todas las métricas BSC para el dict de datos `d`.
    Captura cualquier excepción individual y retorna None para esa métrica.
    """
    metricas = {
        # Perspectiva 1 – Rentabilidad
        "utilidad_bruta": utilidad_bruta,
        "margen_bruto": margen_bruto,
        "ebit": ebit,
        "ebitda": ebitda,
        "margen_ebitda": margen_ebitda,
        "margen_operativo": margen_operativo,
        "ebt": ebt,
        "utilidad_neta": utilidad_neta,
        "margen_neto": margen_neto,
        "roi": roi,
        "roa": roa,
        "roe": roe,
        "roic": roic,
        "contribucion_marginal": contribucion_marginal,
        # Perspectiva 2 – Liquidez
        "capital_trabajo": capital_trabajo,
        "razon_corriente": razon_corriente,
        "prueba_acida": prueba_acida,
        "solvencia_cp": solvencia_cp,
        "free_cash_flow": free_cash_flow,
        # Perspectiva 3 – Endeudamiento
        "estructura_financiamiento": estructura_financiamiento,
        "deuda_patrimonio": deuda_patrimonio,
        "deuda_activos": deuda_activos,
        "deuda_ebitda": deuda_ebitda,
        "cobertura_intereses": cobertura_intereses,
        "leverage": leverage,
        "z_altman": z_altman,
        # Perspectiva 4 – Eficiencia
        "rot_activo_total": rot_activo_total,
        "rot_capital_trabajo": rot_capital_trabajo,
        "ventas_empleado": ventas_empleado,
        "gasto_op_ventas": gasto_op_ventas,
        "gasto_op_diario": gasto_op_diario,
        # Perspectiva 5 – Ciclo de Efectivo
        "dias_cxc": dias_cxc,
        "dias_inventario": dias_inventario,
        "dias_proveedores": dias_proveedores,
        "ciclo_efectivo": ciclo_efectivo,
        # Perspectiva 6 – Estratégico
        "punto_equilibrio": punto_equilibrio,
        "cobertura_pe": cobertura_pe,
        "roi_dupont": roi_dupont,
        "eva": eva,
        "crecimiento_ventas": crecimiento_ventas,
    }

    resultado = {}
    for nombre, fn in metricas.items():
        try:
            resultado[nombre] = fn(d)
        except Exception:
            resultado[nombre] = None

    return resultado


def get_snapshots(db: Session, period_id: Optional[str]) -> list[dict]:
    """Obtiene los snapshots de la base de datos a través de BSC Repository."""
    from app.repositories.bsc_repository import BSCSnapshotRepository
    repo = BSCSnapshotRepository(db)
    return repo.get_latest_snapshots(period_id)
