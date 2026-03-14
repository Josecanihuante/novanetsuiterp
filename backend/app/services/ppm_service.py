"""
Servicio PPM (Pagos Provisionales Mensuales — Chile).

Calcula el PPM mensual según:
- Régimen Pro PyME: tasa fija 0.25%
- Contribuyentes sin historial: tasa inicial 1%
- Contribuyentes con historial: tasa = FirstCategoryTax / GrossIncome del año anterior (tope 5%, Art. 84 LIR)
- Suspensión automática si hay pérdida tributaria acumulada (Art. 90 LIR)
"""
from typing import Optional


def calcular_ppm(
    mes: int,
    anio: int,
    ingresos_brutos: float,
    config,
    tax_anterior=None,
) -> dict:
    """
    Parámetros
    ----------
    mes              : mes del período (1-12)
    anio             : año del período
    ingresos_brutos  : ingresos brutos del mes
    config           : objeto con atributo `tax_regime` ('pro_pyme' | 'general')
    tax_anterior     : resultado fiscal del año anterior (puede ser None)
                       Debe tener: first_category_tax, gross_income, accumulated_loss

    Retorna
    -------
    dict con period_month, period_year, gross_income, ppm_rate,
    ppm_amount, is_suspended, suspension_reason, detalle (lista de str)
    """
    # ── 1. Determinar tasa ────────────────────────────────────────────────────
    if config.tax_regime == "pro_pyme":
        tasa = 0.0025
    elif tax_anterior is None:
        tasa = 0.01
    else:
        tasa_calculada = (
            tax_anterior.first_category_tax / tax_anterior.gross_income
            if tax_anterior.gross_income
            else 0.01
        )
        tasa = min(tasa_calculada, 0.05)  # tope 5% — Art. 84 LIR

    # ── 2. Verificar suspensión (Art. 90 LIR) ────────────────────────────────
    suspendido = bool(tax_anterior and tax_anterior.accumulated_loss > 0)

    # ── 3. Calcular monto ─────────────────────────────────────────────────────
    monto = 0.0 if suspendido else round(ingresos_brutos * tasa, 0)

    # ── 4. Construir detalle legible ──────────────────────────────────────────
    detalle = [
        f"Ingresos brutos del mes: ${ingresos_brutos:,.0f}",
        f"Régimen tributario: {config.tax_regime}",
        f"Tasa PPM aplicada: {tasa * 100:.4f}%",
        f"PPM calculado: ${monto:,.0f}",
    ]
    if suspendido:
        detalle.append("⚠ PPM suspendido por pérdida tributaria acumulada (Art. 90 LIR)")

    return {
        "period_month": mes,
        "period_year": anio,
        "gross_income": ingresos_brutos,
        "ppm_rate": tasa,
        "ppm_amount": monto,
        "is_suspended": suspendido,
        "suspension_reason": (
            "Pérdida tributaria acumulada Art. 90 LIR" if suspendido else None
        ),
        "detalle": detalle,
    }
