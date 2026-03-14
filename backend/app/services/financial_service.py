"""
Servicio de Estados Financieros.

Genera los 4 estados financieros estándar a partir de journal_lines
agrupadas por account.account_type / account.code.

Estados:
  1. Estado de Resultados (Income Statement)
  2. Balance General (Balance Sheet)
  3. Estado de Flujos de Efectivo — EFE (Cash Flow Statement)
  4. Estado de Origen y Aplicación de Fondos — EOAF (Sources & Uses)
"""
from decimal import Decimal
from typing import Any, Optional


# ══════════════════════════════════════════════════════════════════════════════
# Helpers internos
# ══════════════════════════════════════════════════════════════════════════════

def _safe_pct(value: Decimal, base: Decimal) -> Optional[float]:
    """Porcentaje vertical: value / base × 100. None si base == 0."""
    if not base:
        return None
    return float(value / base * 100)


def _delta(current: Decimal, previous: Optional[Decimal]) -> dict:
    """Análisis horizontal: variación absoluta y %."""
    if previous is None:
        return {"delta_abs": None, "delta_pct": None}
    delta_abs = current - previous
    delta_pct = float(delta_abs / previous * 100) if previous else None
    return {"delta_abs": float(delta_abs), "delta_pct": delta_pct}


def _build_line(
    name: str,
    value: Decimal,
    base: Optional[Decimal] = None,
    prev_value: Optional[Decimal] = None,
    indent: int = 0,
) -> dict:
    """Construye una línea del estado financiero con análisis vertical y horizontal."""
    line: dict[str, Any] = {
        "name": name,
        "value": float(value),
        "indent": indent,
    }
    if base is not None:
        line["vertical_pct"] = _safe_pct(value, base)
    if prev_value is not None:
        line.update(_delta(value, prev_value))
    return line


# ══════════════════════════════════════════════════════════════════════════════
# 1. Estado de Resultados
# ══════════════════════════════════════════════════════════════════════════════

def generar_estado_resultados(
    data: dict[str, Decimal],
    data_anterior: Optional[dict[str, Decimal]] = None,
) -> dict:
    """
    Genera el Estado de Resultados con análisis vertical y horizontal.

    Claves esperadas en `data`:
        ingresos, costo_ventas, gastos_operativos, depreciacion,
        amortizacion, gastos_financieros, impuesto_renta

    Todas las claves opcionales: si faltan, se asumen en 0.
    """
    def v(key: str, d: Optional[dict] = None) -> Decimal:
        src = d if d is not None else data
        return Decimal(str(src.get(key, 0) or 0))

    ingresos          = v("ingresos")
    costo_ventas      = v("costo_ventas")
    gastos_op         = v("gastos_operativos")
    depreciacion      = v("depreciacion")
    amortizacion      = v("amortizacion")
    gastos_fin        = v("gastos_financieros")
    impuesto          = v("impuesto_renta")

    utilidad_bruta    = ingresos - costo_ventas
    ebit              = utilidad_bruta - gastos_op
    ebitda            = ebit + depreciacion + amortizacion
    ebt               = ebit - gastos_fin
    utilidad_neta     = ebt - impuesto

    # Valores del período anterior (para análisis horizontal)
    prev = data_anterior or {}
    def p(key: str) -> Optional[Decimal]:
        val = prev.get(key)
        return Decimal(str(val)) if val is not None else None

    base = ingresos  # base para análisis vertical

    lineas = [
        _build_line("Ingresos", ingresos, base, p("ingresos"), indent=0),
        _build_line("(-) Costo de Ventas (CMV)", costo_ventas, base, p("costo_ventas"), indent=1),
        _build_line("Utilidad Bruta", utilidad_bruta, base,
                    (p("ingresos") or Decimal(0)) - (p("costo_ventas") or Decimal(0))
                    if data_anterior else None, indent=0),
        _build_line("(-) Gastos Operativos", gastos_op, base, p("gastos_operativos"), indent=1),
        _build_line("EBIT (Resultado Operacional)", ebit, base,
                    (p("ingresos") or Decimal(0)) - (p("costo_ventas") or Decimal(0)) - (p("gastos_operativos") or Decimal(0))
                    if data_anterior else None, indent=0),
        _build_line("(+) Depreciación", depreciacion, base, p("depreciacion"), indent=1),
        _build_line("(+) Amortización", amortizacion, base, p("amortizacion"), indent=1),
        _build_line("EBITDA", ebitda, base, None, indent=0),
        _build_line("(-) Gastos Financieros", gastos_fin, base, p("gastos_financieros"), indent=1),
        _build_line("EBT (Resultado antes Impuestos)", ebt, base, None, indent=0),
        _build_line("(-) Impuesto a la Renta", impuesto, base, p("impuesto_renta"), indent=1),
        _build_line("Utilidad Neta", utilidad_neta, base, None, indent=0),
    ]

    return {
        "titulo": "Estado de Resultados",
        "moneda": data.get("moneda", "CLP"),
        "lineas": lineas,
        "resumen": {
            "ingresos":       float(ingresos),
            "utilidad_bruta": float(utilidad_bruta),
            "ebit":           float(ebit),
            "ebitda":         float(ebitda),
            "ebt":            float(ebt),
            "utilidad_neta":  float(utilidad_neta),
            "margen_bruto_pct":    _safe_pct(utilidad_bruta, ingresos),
            "margen_operativo_pct": _safe_pct(ebit, ingresos),
            "margen_neto_pct":     _safe_pct(utilidad_neta, ingresos),
        },
    }


# ══════════════════════════════════════════════════════════════════════════════
# 2. Balance General
# ══════════════════════════════════════════════════════════════════════════════

def generar_balance_general(
    data: dict[str, Decimal],
    data_anterior: Optional[dict[str, Decimal]] = None,
) -> dict:
    """
    Genera el Balance General (Activo = Pasivo + Patrimonio).

    Claves esperadas en `data`:
        ACTIVO CORRIENTE: efectivo, cuentas_cobrar, inventario, otros_activos_corrientes
        ACTIVO NO CORRIENTE: activos_fijos, depreciacion_acumulada, activos_intangibles, otros_activos_nc
        PASIVO CORRIENTE: cuentas_pagar, deuda_cp, otros_pasivos_corrientes
        PASIVO NO CORRIENTE: deuda_lp, otros_pasivos_nc
        PATRIMONIO: capital, reservas, utilidades_retenidas, resultado_ejercicio
    """
    def v(key: str, d: Optional[dict] = None) -> Decimal:
        src = d if d is not None else data
        return Decimal(str(src.get(key, 0) or 0))

    def p(key: str) -> Optional[Decimal]:
        if not data_anterior:
            return None
        val = data_anterior.get(key)
        return Decimal(str(val)) if val is not None else None

    # Activo Corriente
    efectivo             = v("efectivo")
    cxc                  = v("cuentas_cobrar")
    inventario           = v("inventario")
    otros_ac             = v("otros_activos_corrientes")
    activo_corriente     = efectivo + cxc + inventario + otros_ac

    # Activo No Corriente
    activos_fijos        = v("activos_fijos")
    dep_acumulada        = v("depreciacion_acumulada")
    intangibles          = v("activos_intangibles")
    otros_anc            = v("otros_activos_nc")
    activo_nc            = activos_fijos - dep_acumulada + intangibles + otros_anc

    activo_total         = activo_corriente + activo_nc

    # Pasivo Corriente
    cxp                  = v("cuentas_pagar")
    deuda_cp             = v("deuda_cp")
    otros_pc             = v("otros_pasivos_corrientes")
    pasivo_corriente     = cxp + deuda_cp + otros_pc

    # Pasivo No Corriente
    deuda_lp             = v("deuda_lp")
    otros_pnc            = v("otros_pasivos_nc")
    pasivo_nc            = deuda_lp + otros_pnc

    pasivo_total         = pasivo_corriente + pasivo_nc

    # Patrimonio
    capital              = v("capital")
    reservas             = v("reservas")
    util_retenidas       = v("utilidades_retenidas")
    resultado_ej         = v("resultado_ejercicio")
    patrimonio           = capital + reservas + util_retenidas + resultado_ej

    base = activo_total

    lineas_activo = [
        {"seccion": "ACTIVO CORRIENTE"},
        _build_line("Efectivo y equivalentes", efectivo, base, p("efectivo"), indent=1),
        _build_line("Cuentas por cobrar", cxc, base, p("cuentas_cobrar"), indent=1),
        _build_line("Inventarios", inventario, base, p("inventario"), indent=1),
        _build_line("Otros activos corrientes", otros_ac, base, p("otros_activos_corrientes"), indent=1),
        _build_line("TOTAL ACTIVO CORRIENTE", activo_corriente, base, None, indent=0),
        {"seccion": "ACTIVO NO CORRIENTE"},
        _build_line("Activos fijos brutos", activos_fijos, base, p("activos_fijos"), indent=1),
        _build_line("(-) Depreciación acumulada", dep_acumulada, base, p("depreciacion_acumulada"), indent=1),
        _build_line("Activos intangibles", intangibles, base, p("activos_intangibles"), indent=1),
        _build_line("Otros activos no corrientes", otros_anc, base, p("otros_activos_nc"), indent=1),
        _build_line("TOTAL ACTIVO NO CORRIENTE", activo_nc, base, None, indent=0),
        _build_line("TOTAL ACTIVO", activo_total, base, None, indent=0),
    ]

    lineas_pasivo_patrimonio = [
        {"seccion": "PASIVO CORRIENTE"},
        _build_line("Cuentas por pagar", cxp, base, p("cuentas_pagar"), indent=1),
        _build_line("Deuda corto plazo", deuda_cp, base, p("deuda_cp"), indent=1),
        _build_line("Otros pasivos corrientes", otros_pc, base, p("otros_pasivos_corrientes"), indent=1),
        _build_line("TOTAL PASIVO CORRIENTE", pasivo_corriente, base, None, indent=0),
        {"seccion": "PASIVO NO CORRIENTE"},
        _build_line("Deuda largo plazo", deuda_lp, base, p("deuda_lp"), indent=1),
        _build_line("Otros pasivos no corrientes", otros_pnc, base, p("otros_pasivos_nc"), indent=1),
        _build_line("TOTAL PASIVO NO CORRIENTE", pasivo_nc, base, None, indent=0),
        _build_line("TOTAL PASIVO", pasivo_total, base, None, indent=0),
        {"seccion": "PATRIMONIO"},
        _build_line("Capital pagado", capital, base, p("capital"), indent=1),
        _build_line("Reservas", reservas, base, p("reservas"), indent=1),
        _build_line("Utilidades retenidas", util_retenidas, base, p("utilidades_retenidas"), indent=1),
        _build_line("Resultado del ejercicio", resultado_ej, base, p("resultado_ejercicio"), indent=1),
        _build_line("TOTAL PATRIMONIO", patrimonio, base, None, indent=0),
        _build_line("TOTAL PASIVO + PATRIMONIO", pasivo_total + patrimonio, base, None, indent=0),
    ]

    return {
        "titulo": "Balance General",
        "moneda": data.get("moneda", "CLP"),
        "activo": lineas_activo,
        "pasivo_patrimonio": lineas_pasivo_patrimonio,
        "resumen": {
            "activo_total":      float(activo_total),
            "activo_corriente":  float(activo_corriente),
            "activo_nc":         float(activo_nc),
            "pasivo_total":      float(pasivo_total),
            "pasivo_corriente":  float(pasivo_corriente),
            "pasivo_nc":         float(pasivo_nc),
            "patrimonio":        float(patrimonio),
            "cuadra":            float(activo_total) == float(pasivo_total + patrimonio),
        },
    }


# ══════════════════════════════════════════════════════════════════════════════
# 3. Estado de Flujos de Efectivo (EFE)
# ══════════════════════════════════════════════════════════════════════════════

def generar_efe(
    data: dict[str, Decimal],
    data_anterior: Optional[dict[str, Decimal]] = None,
) -> dict:
    """
    Genera el EFE (método indirecto simplificado).

    Claves esperadas:
        OPERACIONES: utilidad_neta, depreciacion, amortizacion,
                     var_cxc, var_inventario, var_cxp, otros_operativos
        INVERSIÓN: compra_activos, venta_activos, otros_inversion
        FINANCIAMIENTO: emision_deuda, pago_deuda, dividendos, otros_financiamiento
        saldo_inicial
    """
    def v(key: str) -> Decimal:
        return Decimal(str(data.get(key, 0) or 0))

    def p(key: str) -> Optional[Decimal]:
        if not data_anterior:
            return None
        val = data_anterior.get(key)
        return Decimal(str(val)) if val is not None else None

    # Operaciones
    util_neta   = v("utilidad_neta")
    deprec      = v("depreciacion")
    amort       = v("amortizacion")
    var_cxc     = v("var_cxc")      # variación cxc (negativo = aumento activo)
    var_inv     = v("var_inventario")
    var_cxp     = v("var_cxp")      # variación cxp (positivo = aumento pasivo)
    otros_op    = v("otros_operativos")
    fco = util_neta + deprec + amort - var_cxc - var_inv + var_cxp + otros_op

    # Inversión
    compra_act  = v("compra_activos")
    venta_act   = v("venta_activos")
    otros_inv   = v("otros_inversion")
    fci = -compra_act + venta_act + otros_inv

    # Financiamiento
    emision     = v("emision_deuda")
    pago_deuda  = v("pago_deuda")
    dividendos  = v("dividendos")
    otros_fin   = v("otros_financiamiento")
    fcf = emision - pago_deuda - dividendos + otros_fin

    saldo_inicial  = v("saldo_inicial")
    variacion_neta = fco + fci + fcf
    saldo_final    = saldo_inicial + variacion_neta

    def h(key_fco: str, custom_val: Optional[Decimal] = None) -> dict:
        val = custom_val if custom_val is not None else v(key_fco)
        return _delta(val, p(key_fco))

    lineas = [
        {"seccion": "ACTIVIDADES DE OPERACIÓN"},
        {**_build_line("Utilidad neta del ejercicio", util_neta, indent=1), **h("utilidad_neta")},
        {**_build_line("(+) Depreciación y amortización", deprec + amort, indent=1)},
        {**_build_line("(-) Variación cuentas por cobrar", -var_cxc, indent=1), **h("var_cxc")},
        {**_build_line("(-) Variación inventarios", -var_inv, indent=1), **h("var_inventario")},
        {**_build_line("(+) Variación cuentas por pagar", var_cxp, indent=1), **h("var_cxp")},
        {**_build_line("Otros flujos operativos", otros_op, indent=1), **h("otros_operativos")},
        _build_line("FLUJO DE CAJA OPERACIONAL (FCO)", fco, indent=0),
        {"seccion": "ACTIVIDADES DE INVERSIÓN"},
        {**_build_line("(-) Compra de activos (CAPEX)", -compra_act, indent=1), **h("compra_activos")},
        {**_build_line("(+) Venta de activos", venta_act, indent=1), **h("venta_activos")},
        {**_build_line("Otros flujos de inversión", otros_inv, indent=1), **h("otros_inversion")},
        _build_line("FLUJO DE CAJA DE INVERSIÓN (FCI)", fci, indent=0),
        {"seccion": "ACTIVIDADES DE FINANCIAMIENTO"},
        {**_build_line("(+) Emisión de deuda", emision, indent=1), **h("emision_deuda")},
        {**_build_line("(-) Pago de deuda", -pago_deuda, indent=1), **h("pago_deuda")},
        {**_build_line("(-) Dividendos pagados", -dividendos, indent=1), **h("dividendos")},
        {**_build_line("Otros flujos financieros", otros_fin, indent=1), **h("otros_financiamiento")},
        _build_line("FLUJO DE CAJA FINANCIERO (FCF)", fcf, indent=0),
        {"seccion": "RESUMEN"},
        _build_line("Saldo inicial de caja", saldo_inicial, indent=0),
        _build_line("Variación neta de efectivo", variacion_neta, indent=1),
        _build_line("Saldo final de caja", saldo_final, indent=0),
    ]

    return {
        "titulo": "Estado de Flujos de Efectivo",
        "metodo": "indirecto",
        "moneda": data.get("moneda", "CLP"),
        "lineas": lineas,
        "resumen": {
            "fco":            float(fco),
            "fci":            float(fci),
            "fcf":            float(fcf),
            "variacion_neta": float(variacion_neta),
            "saldo_inicial":  float(saldo_inicial),
            "saldo_final":    float(saldo_final),
        },
    }


# ══════════════════════════════════════════════════════════════════════════════
# 4. Estado de Origen y Aplicación de Fondos (EOAF)
# ══════════════════════════════════════════════════════════════════════════════

def generar_eoaf(data: dict[str, Decimal]) -> dict:
    """
    Genera el EOAF (Fuentes y Usos de fondos). Sin análisis adicional.

    Claves esperadas:
        fuentes: lista de dicts {"nombre": str, "monto": Decimal}
        usos:    lista de dicts {"nombre": str, "monto": Decimal}
    """
    fuentes_raw: list[dict] = data.get("fuentes", [])
    usos_raw:    list[dict] = data.get("usos", [])

    fuentes = [
        {"nombre": f["nombre"], "monto": float(Decimal(str(f.get("monto", 0))))}
        for f in fuentes_raw
    ]
    usos = [
        {"nombre": u["nombre"], "monto": float(Decimal(str(u.get("monto", 0))))}
        for u in usos_raw
    ]

    total_fuentes = sum(f["monto"] for f in fuentes)
    total_usos    = sum(u["monto"] for u in usos)
    superavit     = total_fuentes - total_usos

    return {
        "titulo": "Estado de Origen y Aplicación de Fondos",
        "moneda": data.get("moneda", "CLP"),
        "fuentes": fuentes,
        "usos": usos,
        "resumen": {
            "total_fuentes": total_fuentes,
            "total_usos":    total_usos,
            "superavit":     superavit,
            "equilibrado":   abs(superavit) < 0.01,
        },
    }


# ══════════════════════════════════════════════════════════════════════════════
# Generador completo (todos los estados de un período)
# ══════════════════════════════════════════════════════════════════════════════

def generar_estados_financieros(
    data: dict[str, Any],
    data_anterior: Optional[dict[str, Any]] = None,
) -> dict:
    """
    Genera los 4 estados financieros en una sola llamada.

    `data` debe contener sub-dicts o las claves planas necesarias para cada estado.
    """
    er  = generar_estado_resultados(data, data_anterior)
    bg  = generar_balance_general(data, data_anterior)
    efe = generar_efe(data, data_anterior)
    eoaf_data = {
        "fuentes": data.get("fuentes", []),
        "usos":    data.get("usos", []),
        "moneda":  data.get("moneda", "CLP"),
    }
    eoaf = generar_eoaf(eoaf_data)

    return {
        "estado_resultados": er,
        "balance_general": bg,
        "efe": efe,
        "eoaf": eoaf,
    }
