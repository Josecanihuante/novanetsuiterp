"""Router Impuestos y PPM."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.repositories.tax_repository import TaxRepository
from app.schemas.tax import PpmPaymentCreate, TaxConfigCreate, TaxConfigUpdate
from app.services.ppm_service import calcular_ppm

router = APIRouter(prefix="/taxes", tags=["Taxes"])


def _rbac_write(user: User):
    if user.role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Sin permisos."}},
        )


# ── Configuración tributaria ──────────────────────────────────────────────────

@router.get("/ppm/config", response_model=dict, summary="Configuración tributaria activa")
def get_tax_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = TaxRepository(db)
    configs = repo.list_configs()
    return {
        "success": True,
        "data": [
            {
                "id": c.id, "tax_code": c.tax_code, "tax_name": c.tax_name,
                "rate": float(c.rate), "applies_to": c.applies_to,
                "is_active": c.is_active,
                "effective_from": c.effective_from.isoformat(),
                "effective_to": c.effective_to.isoformat() if c.effective_to else None,
            }
            for c in configs
        ],
    }


@router.put("/ppm/config", response_model=dict, summary="Actualizar configuración tributaria")
def update_tax_config(
    body: TaxConfigUpdate,
    config_id: str = Query(..., description="UUID de la configuración a actualizar"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_write(current_user)
    repo = TaxRepository(db)
    config = repo.get_config_by_id(config_id)
    if not config:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Configuración no encontrada."}},
        )
    config = repo.update_config(config, body)
    return {
        "success": True,
        "data": {
            "id": config.id, "tax_code": config.tax_code,
            "rate": float(config.rate), "is_active": config.is_active,
        },
    }


# ── Cálculo PPM ───────────────────────────────────────────────────────────────

@router.post("/ppm/calculate", response_model=dict, summary="Calcular PPM del mes")
def calculate_ppm(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calcula el PPM para el mes/año enviado.
    Body: { month, year, gross_income, config_id, prev_year? }
    """
    _rbac_write(current_user)

    month       = body.get("month")
    year        = body.get("year")
    gross_income = body.get("gross_income", 0)
    config_id   = body.get("config_id")

    if not all([month, year, config_id]):
        raise HTTPException(
            status_code=422,
            detail={"success": False, "error": {"code": "MISSING_FIELDS", "message": "Se requieren month, year y config_id."}},
        )

    repo = TaxRepository(db)
    config = repo.get_config_by_id(config_id)
    if not config:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Configuración tributaria no encontrada."}},
        )

    # Simular objeto config compatible con ppm_service
    class _Config:
        tax_regime = "pro_pyme" if config.rate <= 0.0025 else "general"

    resultado = calcular_ppm(month, year, float(gross_income), _Config(), tax_anterior=None)
    return {"success": True, "data": resultado}


# ── Historial PPM ─────────────────────────────────────────────────────────────

@router.get("/ppm/history", response_model=dict, summary="Historial de PPM del año tributario")
def ppm_history(
    year: int = Query(..., description="Año tributario"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = TaxRepository(db)
    ppms = repo.list_ppms(skip=0, limit=12)
    resultado = [
        p for p in ppms
        if hasattr(p, "created_at") and p.created_at.year == year
    ]
    return {
        "success": True,
        "data": [
            {
                "id": p.id, "period_id": p.period_id,
                "taxable_base": float(p.taxable_base),
                "ppm_rate": float(p.ppm_rate),
                "amount_due": float(p.amount_due),
                "amount_paid": float(p.amount_paid),
                "status": p.status,
                "payment_date": p.payment_date.isoformat() if p.payment_date else None,
                "folio": p.folio,
            }
            for p in resultado
        ],
        "meta": {"year": year, "count": len(resultado)},
    }
