"""Router Diario Contable (Journal Entries)."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.repositories.journal_repository import JournalRepository
from app.schemas.accounting import JournalEntryCreate, JournalEntryUpdate

router = APIRouter(prefix="/journal", tags=["Journal"])


def _rbac_write(user: User):
    if user.role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Sin permisos para escritura."}},
        )


@router.get("/entries", response_model=dict, summary="Listar asientos")
def list_entries(
    period_id: Optional[str] = Query(None),
    is_posted: Optional[bool] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = JournalRepository(db)
    status_filter = "posted" if is_posted is True else ("draft" if is_posted is False else None)
    skip = (page - 1) * size
    entries = repo.list(period_id=period_id, status=status_filter, skip=skip, limit=size)
    return {
        "success": True,
        "data": [
            {
                "id": e.id, "entry_number": e.entry_number, "entry_date": e.entry_date.isoformat(),
                "description": e.description, "status": e.status, "period_id": e.period_id,
            }
            for e in entries
        ],
        "meta": {"page": page, "size": size, "count": len(entries)},
    }


@router.post("/entries", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Crear asiento borrador")
def create_entry(
    body: JournalEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crea asiento borrador. Valida Σdébito = Σcrédito antes de guardar."""
    _rbac_write(current_user)
    repo = JournalRepository(db)
    entry = repo.create(body, created_by=current_user.id)
    return {"success": True, "data": {"id": entry.id, "entry_number": entry.entry_number, "status": entry.status}}


@router.get("/entries/{entry_id}", response_model=dict, summary="Detalle de asiento con líneas")
def get_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = JournalRepository(db)
    entry = repo.get_by_id(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Asiento no encontrado."}})
    return {
        "success": True,
        "data": {
            "id": entry.id, "entry_number": entry.entry_number,
            "entry_date": entry.entry_date.isoformat(),
            "description": entry.description, "status": entry.status,
            "period_id": entry.period_id, "reference": entry.reference,
            "lines": [
                {
                    "id": l.id, "account_id": l.account_id,
                    "debit": float(l.debit), "credit": float(l.credit),
                    "description": l.description, "line_order": l.line_order,
                }
                for l in entry.lines
            ],
        },
    }


@router.put("/entries/{entry_id}", response_model=dict, summary="Editar asiento (solo borradores)")
def update_entry(
    entry_id: str,
    body: JournalEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_write(current_user)
    repo = JournalRepository(db)
    entry = repo.get_by_id(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Asiento no encontrado."}})
    if entry.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "ENTRY_POSTED", "message": "Solo se pueden editar asientos en estado borrador."}},
        )
    entry = repo.update(entry, body)
    return {"success": True, "data": {"id": entry.id, "status": entry.status}}


@router.patch("/entries/{entry_id}/post", response_model=dict, summary="Contabilizar asiento (irreversible)")
def post_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cambia el estado del asiento a 'posted'. Operación irreversible."""
    _rbac_write(current_user)
    repo = JournalRepository(db)
    entry = repo.get_by_id(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Asiento no encontrado."}})
    if entry.status == "posted":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "ALREADY_POSTED", "message": "El asiento ya está contabilizado."}},
        )
    from app.schemas.accounting import JournalEntryUpdate
    entry = repo.update(entry, JournalEntryUpdate(status="posted"))
    return {"success": True, "data": {"id": entry.id, "status": entry.status, "message": "Asiento contabilizado."}}
