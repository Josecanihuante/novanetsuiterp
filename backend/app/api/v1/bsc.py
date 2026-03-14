"""Router BSC — Métricas del Balanced Scorecard."""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services import bsc_service
from app.repositories.account_repository import PeriodRepository

router = APIRouter(prefix="/bsc", tags=["BSC"])


def _build_perspectivas(metricas: dict) -> list[dict]:
    """Agrupa las métricas por perspectiva para la respuesta."""
    return [
        {
            "perspectiva": "Rentabilidad",
            "metricas": {k: metricas.get(k) for k in [
                "utilidad_bruta", "margen_bruto", "ebit", "ebitda",
                "margen_ebitda", "margen_operativo", "ebt", "utilidad_neta",
                "margen_neto", "roi", "roa", "roe", "roic", "contribucion_marginal",
            ]},
        },
        {
            "perspectiva": "Liquidez",
            "metricas": {k: metricas.get(k) for k in [
                "capital_trabajo", "razon_corriente", "prueba_acida",
                "solvencia_cp", "free_cash_flow",
            ]},
        },
        {
            "perspectiva": "Endeudamiento",
            "metricas": {k: metricas.get(k) for k in [
                "estructura_financiamiento", "deuda_patrimonio", "deuda_activos",
                "deuda_ebitda", "cobertura_intereses", "leverage", "z_altman",
            ]},
        },
        {
            "perspectiva": "Eficiencia",
            "metricas": {k: metricas.get(k) for k in [
                "rot_activo_total", "rot_capital_trabajo", "ventas_empleado",
                "gasto_op_ventas", "gasto_op_diario",
            ]},
        },
        {
            "perspectiva": "Ciclo de Efectivo",
            "metricas": {k: metricas.get(k) for k in [
                "dias_cxc", "dias_inventario", "dias_proveedores", "ciclo_efectivo",
            ]},
        },
        {
            "perspectiva": "Estratégico",
            "metricas": {k: metricas.get(k) for k in [
                "punto_equilibrio", "cobertura_pe", "roi_dupont", "eva", "crecimiento_ventas",
            ]},
        },
    ]


@router.get("/metrics", response_model=dict, summary="Calcular métricas BSC del período")
def get_metrics(
    period_id: str = Query(..., description="UUID del período a calcular"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calcula y retorna las métricas BSC agrupadas por perspectiva.
    Los datos financieros se obtienen de journal_lines del período.
    """
    # Verificar que el período existe
    period_repo = PeriodRepository(db)
    period = period_repo.get_by_id(period_id)
    if not period:
        return {
            "success": False,
            "error": {"code": "PERIOD_NOT_FOUND", "message": f"Período {period_id} no encontrado."},
        }

    # TODO: construir el dict `d` desde journal_lines del período
    # Por ahora se retorna estructura vacía con las perspectivas definidas
    d: dict = {}  # <- Se poblará con aggregaciones de journal_lines en sprint siguiente
    metricas = bsc_service.calcular_todas_las_metricas(d)
    perspectivas = _build_perspectivas(metricas)

    return {
        "success": True,
        "data": {
            "period_id":  period_id,
            "period_name": period.name,
            "perspectivas": perspectivas,
        },
    }


@router.get("/snapshot", response_model=dict, summary="Último snapshot BSC guardado")
def get_snapshot(
    period_id: Optional[str] = Query(None, description="UUID del período (default: el más reciente)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna el último snapshot guardado a través de su repositorio BSC."""
    snapshots = bsc_service.get_snapshots(db, period_id)

    return {"success": True, "data": {"snapshots": snapshots, "count": len(snapshots)}}
