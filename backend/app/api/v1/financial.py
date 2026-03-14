"""Router de Estados Financieros."""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.repositories.account_repository import PeriodRepository
from app.services import financial_service

router = APIRouter(prefix="/financial", tags=["Financial Statements"])


def _get_period_data(db: Session, period_id: str) -> dict:
    """
    Construye el dict financiero del período a partir de journal_lines.
    TODO: implementar query real de aggregaciones en sprint siguiente.
    Por ahora retorna estructura vacía tipada.
    """
    from decimal import Decimal
    return {
        "ingresos": Decimal("0"), "costo_ventas": Decimal("0"),
        "gastos_operativos": Decimal("0"), "depreciacion": Decimal("0"),
        "amortizacion": Decimal("0"), "gastos_financieros": Decimal("0"),
        "impuesto_renta": Decimal("0"),
        "efectivo": Decimal("0"), "cuentas_cobrar": Decimal("0"),
        "inventario": Decimal("0"), "otros_activos_corrientes": Decimal("0"),
        "activos_fijos": Decimal("0"), "depreciacion_acumulada": Decimal("0"),
        "activos_intangibles": Decimal("0"), "otros_activos_nc": Decimal("0"),
        "cuentas_pagar": Decimal("0"), "deuda_cp": Decimal("0"),
        "otros_pasivos_corrientes": Decimal("0"), "deuda_lp": Decimal("0"),
        "otros_pasivos_nc": Decimal("0"), "capital": Decimal("0"),
        "reservas": Decimal("0"), "utilidades_retenidas": Decimal("0"),
        "resultado_ejercicio": Decimal("0"),
        "utilidad_neta": Decimal("0"), "var_cxc": Decimal("0"),
        "var_inventario": Decimal("0"), "var_cxp": Decimal("0"),
        "otros_operativos": Decimal("0"), "compra_activos": Decimal("0"),
        "venta_activos": Decimal("0"), "otros_inversion": Decimal("0"),
        "emision_deuda": Decimal("0"), "pago_deuda": Decimal("0"),
        "dividendos": Decimal("0"), "otros_financiamiento": Decimal("0"),
        "saldo_inicial": Decimal("0"),
        "fuentes": [], "usos": [],
        "moneda": "CLP",
    }


def _check_period(db: Session, period_id: str):
    repo = PeriodRepository(db)
    period = repo.get_by_id(period_id)
    if not period:
        return None
    return period


@router.get("/income-statement", response_model=dict, summary="Estado de Resultados")
def income_statement(
    period_id: str = Query(..., description="UUID del período actual"),
    compare_period_id: Optional[str] = Query(None, description="UUID del período de comparación"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Estado de Resultados con análisis vertical y horizontal."""
    if not _check_period(db, period_id):
        return {"success": False, "error": {"code": "PERIOD_NOT_FOUND", "message": "Período no encontrado."}}

    data = _get_period_data(db, period_id)
    data_ant = _get_period_data(db, compare_period_id) if compare_period_id else None
    resultado = financial_service.generar_estado_resultados(data, data_ant)

    return {"success": True, "data": resultado}


@router.get("/balance-sheet", response_model=dict, summary="Balance General")
def balance_sheet(
    period_id: str = Query(..., description="UUID del período actual"),
    compare_period_id: Optional[str] = Query(None, description="UUID del período de comparación"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Balance General con verificación de cuadre Activo = Pasivo + Patrimonio."""
    if not _check_period(db, period_id):
        return {"success": False, "error": {"code": "PERIOD_NOT_FOUND", "message": "Período no encontrado."}}

    data = _get_period_data(db, period_id)
    data_ant = _get_period_data(db, compare_period_id) if compare_period_id else None
    resultado = financial_service.generar_balance_general(data, data_ant)

    return {"success": True, "data": resultado}


@router.get("/cash-flow", response_model=dict, summary="Estado de Flujos de Efectivo")
def cash_flow(
    period_id: str = Query(..., description="UUID del período actual"),
    compare_period_id: Optional[str] = Query(None, description="UUID del período de comparación"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Estado de Flujos de Efectivo (método indirecto)."""
    if not _check_period(db, period_id):
        return {"success": False, "error": {"code": "PERIOD_NOT_FOUND", "message": "Período no encontrado."}}

    data = _get_period_data(db, period_id)
    data_ant = _get_period_data(db, compare_period_id) if compare_period_id else None
    resultado = financial_service.generar_efe(data, data_ant)

    return {"success": True, "data": resultado}


@router.get("/source-use", response_model=dict, summary="Estado de Origen y Aplicación de Fondos")
def source_use(
    period_id: str = Query(..., description="UUID del período"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Estado de Origen y Aplicación de Fondos (EOAF)."""
    if not _check_period(db, period_id):
        return {"success": False, "error": {"code": "PERIOD_NOT_FOUND", "message": "Período no encontrado."}}

    data = _get_period_data(db, period_id)
    resultado = financial_service.generar_eoaf(data)

    return {"success": True, "data": resultado}
