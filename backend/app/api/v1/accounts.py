"""Router Plan de Cuentas."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.repositories.account_repository import AccountRepository
from app.schemas.account import AccountCreate, AccountUpdate

router = APIRouter(prefix="/accounts", tags=["Accounts"])


def _rbac(user: User, write: bool = False):
    """viewer=solo GET; contador=GET+POST+PUT; admin=todo."""
    if write and user.role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Sin permisos para esta operación."}},
        )


@router.get("", response_model=dict, summary="Listar cuentas")
def list_accounts(
    account_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = AccountRepository(db)
    skip = (page - 1) * size
    accounts = repo.list(account_type=account_type, skip=skip, limit=size)
    return {
        "success": True,
        "data": [a.__dict__ for a in accounts],
        "meta": {"page": page, "size": size, "count": len(accounts)},
    }


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Crear cuenta")
def create_account(
    body: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac(current_user, write=True)
    repo = AccountRepository(db)
    if repo.get_by_code(body.code):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "DUPLICATE_CODE", "message": f"Ya existe una cuenta con el código {body.code}."}},
        )
    account = repo.create(body)
    return {"success": True, "data": account.__dict__}


@router.get("/tree", response_model=dict, summary="Árbol jerárquico del plan de cuentas")
def accounts_tree(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna el plan de cuentas completo en estructura de árbol anidado."""
    repo = AccountRepository(db)
    all_accounts = repo.list(limit=2000)

    # Construir árbol en memoria
    by_id = {a.id: {**{c: getattr(a, c) for c in ["id", "code", "name", "account_type", "parent_id"]}, "children": []} for a in all_accounts}
    roots = []
    for node in by_id.values():
        parent_id = node["parent_id"]
        if parent_id and parent_id in by_id:
            by_id[parent_id]["children"].append(node)
        else:
            roots.append(node)

    return {"success": True, "data": sorted(roots, key=lambda x: x["code"])}


@router.get("/{account_id}", response_model=dict, summary="Detalle de cuenta")
def get_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = AccountRepository(db)
    account = repo.get_by_id(account_id)
    if not account:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Cuenta no encontrada."}})
    return {"success": True, "data": account.__dict__}


@router.put("/{account_id}", response_model=dict, summary="Editar cuenta")
def update_account(
    account_id: str,
    body: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac(current_user, write=True)
    repo = AccountRepository(db)
    account = repo.get_by_id(account_id)
    if not account:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Cuenta no encontrada."}})
    account = repo.update(account, body)
    return {"success": True, "data": account.__dict__}


@router.delete("/{account_id}", response_model=dict, summary="Eliminar cuenta (soft delete)")
def delete_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Solo admin puede eliminar cuentas."}})
    repo = AccountRepository(db)
    account = repo.get_by_id(account_id)
    if not account:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Cuenta no encontrada."}})
    repo.soft_delete(account)
    return {"success": True, "data": {"message": "Cuenta eliminada correctamente."}}
