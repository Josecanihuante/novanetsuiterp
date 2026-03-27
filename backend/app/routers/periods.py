"""Router Períodos Contables."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.models.accounting import Period
from app.schemas.accounting import PeriodCreate, PeriodUpdate

router = APIRouter(prefix="/periods", tags=["Periods"])


def _rbac_write(user: User) -> None:
    if user.role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Sin permisos para esta operación."}},
        )


def _rbac_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Solo admin puede realizar esta operación."}},
        )


@router.get("", response_model=dict, summary="Listar períodos contables")
def list_periods(
    fiscal_year: int | None = Query(None),
    is_closed: bool | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Period)
    if fiscal_year is not None:
        query = query.filter(Period.fiscal_year == fiscal_year)
    if is_closed is not None:
        query = query.filter(Period.is_closed == is_closed)

    total = query.count()
    skip = (page - 1) * size
    periods = query.order_by(Period.start_date).offset(skip).limit(size).all()

    return {
        "success": True,
        "data": [
            {
                "id": str(p.id), "name": p.name,
                "start_date": p.start_date.isoformat(), "end_date": p.end_date.isoformat(),
                "fiscal_year": p.fiscal_year, "is_closed": p.is_closed,
                "created_at": p.created_at.isoformat(),
            }
            for p in periods
        ],
        "meta": {"page": page, "size": size, "count": total},
    }


@router.get("/{period_id}", response_model=dict, summary="Detalle de período")
def get_period(
    period_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    period = db.query(Period).filter(Period.id == period_id).first()
    if not period:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Período no encontrado."}},
        )
    return {
        "success": True,
        "data": {
            "id": str(period.id), "name": period.name,
            "start_date": period.start_date.isoformat(), "end_date": period.end_date.isoformat(),
            "fiscal_year": period.fiscal_year, "is_closed": period.is_closed,
        },
    }


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Crear período")
def create_period(
    body: PeriodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_write(current_user)
    # Verificar solapamiento de fechas
    overlap = db.query(Period).filter(
        Period.fiscal_year == body.fiscal_year,
        Period.start_date < body.end_date,
        Period.end_date > body.start_date,
    ).first()
    if overlap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "PERIOD_OVERLAP", "message": "El período se solapa con uno existente."}},
        )
    period = Period(
        name=body.name,
        start_date=body.start_date,
        end_date=body.end_date,
        fiscal_year=body.fiscal_year,
        is_closed=body.is_closed,
    )
    db.add(period)
    db.commit()
    db.refresh(period)
    return {"success": True, "data": {"id": str(period.id), "name": period.name, "fiscal_year": period.fiscal_year}}


@router.put("/{period_id}", response_model=dict, summary="Actualizar período")
def update_period(
    period_id: str,
    body: PeriodUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_write(current_user)
    period = db.query(Period).filter(Period.id == period_id).first()
    if not period:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Período no encontrado."}},
        )
    if period.is_closed and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "PERIOD_CLOSED", "message": "No se puede modificar un período cerrado."}},
        )
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(period, field, value)
    db.commit()
    db.refresh(period)
    return {"success": True, "data": {"id": str(period.id), "name": period.name, "is_closed": period.is_closed}}


@router.delete("/{period_id}", response_model=dict, summary="Eliminar período (solo admin)")
def delete_period(
    period_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_admin(current_user)
    period = db.query(Period).filter(Period.id == period_id).first()
    if not period:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Período no encontrado."}},
        )
    if period.is_closed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "PERIOD_CLOSED", "message": "No se puede eliminar un período cerrado."}},
        )
    db.delete(period)
    db.commit()
    return {"success": True, "data": {"message": "Período eliminado correctamente."}}


@router.patch("/{period_id}/close", response_model=dict, summary="Cerrar período (solo admin)")
def close_period(
    period_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_admin(current_user)
    period = db.query(Period).filter(Period.id == period_id).first()
    if not period:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Período no encontrado."}},
        )
    if period.is_closed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "ALREADY_CLOSED", "message": "El período ya está cerrado."}},
        )
    period.is_closed = True
    db.commit()
    return {"success": True, "data": {"id": str(period.id), "name": period.name, "is_closed": True, "message": "Período cerrado exitosamente."}}
