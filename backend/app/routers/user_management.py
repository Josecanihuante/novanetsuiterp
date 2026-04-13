"""
Router de gestión de usuarios por empresa.
- admin: crea/edita/desactiva contador y viewer de SU empresa
- superadmin: puede ver todas las empresas (por script, no por este router)
"""
import secrets
import string
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, can_manage_role
from app.models.users import User
from app.repositories.user_repository import UserRepository
from app.schemas.users import UserCreate

router = APIRouter(prefix="/user-management", tags=["Gestión de Usuarios"])


# ── Guards ────────────────────────────────────────────────────────────────────

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {
                "code": "FORBIDDEN",
                "message": "Solo administradores pueden gestionar usuarios."
            }},
        )
    return current_user


def _validate_can_manage(manager: User, target_role: str) -> None:
    if not can_manage_role(manager.role, target_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {
                "code": "ROLE_NOT_ALLOWED",
                "message": (
                    f"Como '{manager.role}' solo puede gestionar: "
                    "contadores y observadores."
                    if manager.role == "admin"
                    else "ningún usuario."
                ),
            }},
        )


def _validate_same_company(manager: User, target: User) -> None:
    if manager.role == "superadmin":
        return
    if str(manager.company_id) != str(target.company_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {
                "code": "CROSS_COMPANY_FORBIDDEN",
                "message": "No puede gestionar usuarios de otra empresa."
            }},
        )


def _generate_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return "".join(secrets.choice(alphabet) for _ in range(length))


# ── Schemas del router ────────────────────────────────────────────────────────

class CreateUserBody(BaseModel):
    email:     EmailStr
    full_name: str
    role:      str   # solo 'contador' o 'viewer' para admin
    password:  Optional[str] = None  # si None → se genera automáticamente


class UpdateUserBody(BaseModel):
    full_name: Optional[str] = None
    email:     Optional[EmailStr] = None
    role:      Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/usuarios", summary="Listar usuarios de mi empresa")
def list_usuarios(
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Lista usuarios (contador y viewer) de la empresa del admin."""
    repo  = UserRepository(db)
    users = repo.list_by_company(
        company_id=str(current_user.company_id),
        include_inactive=include_inactive,
    )
    return {
        "success": True,
        "data": [
            {
                "id":         str(u.id),
                "email":      u.email,
                "full_name":  u.full_name,
                "role":       u.role,
                "is_active":  u.is_active,
                "last_login": u.last_login.isoformat() if u.last_login else None,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ],
    }


@router.post("/usuarios", status_code=201, summary="Crear usuario contador u observador")
def create_usuario(
    body: CreateUserBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Crea un nuevo usuario en la empresa del admin.
    Admin solo puede crear 'contador' o 'viewer' — nunca 'admin' ni 'superadmin'.
    """
    _validate_can_manage(current_user, body.role)

    repo = UserRepository(db)

    # Verificar email único
    if repo.get_by_email(body.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {
                "code": "EMAIL_ALREADY_EXISTS",
                "message": f"El email '{body.email}' ya está registrado en el sistema."
            }},
        )

    password = body.password or _generate_password()

    user_data = UserCreate(
        email=body.email,
        full_name=body.full_name,
        role=body.role,
        password=password,
        is_active=True,
    )
    user = repo.create_with_company(
        data=user_data,
        company_id=str(current_user.company_id),
        created_by_id=str(current_user.id),
    )

    return {
        "success": True,
        "data": {
            "id":                  str(user.id),
            "email":               user.email,
            "full_name":           user.full_name,
            "role":                user.role,
            "temporary_password":  password,
            "message": (
                "Usuario creado. Comparta la contraseña temporal de forma segura. "
                "Solo se muestra una vez."
            ),
        },
    }


@router.put("/usuarios/{user_id}", summary="Actualizar usuario")
def update_usuario(
    user_id: UUID,
    body: UpdateUserBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    repo = UserRepository(db)
    user = repo.get_by_id(str(user_id))
    if not user:
        raise HTTPException(status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND"}})

    _validate_same_company(current_user, user)
    _validate_can_manage(current_user, user.role)

    if body.role and body.role != user.role:
        _validate_can_manage(current_user, body.role)

    if body.email and body.email != user.email:
        if repo.get_by_email(body.email):
            raise HTTPException(status_code=409,
                detail={"success": False, "error": {
                    "code": "EMAIL_ALREADY_EXISTS",
                    "message": f"El email '{body.email}' ya está en uso."
                }})
        user.email = body.email.lower().strip()

    if body.full_name:
        user.full_name = body.full_name.strip()
    if body.role:
        user.role = body.role

    db.commit()
    db.refresh(user)
    return {"success": True, "data": {"id": str(user.id), "email": user.email, "role": user.role}}


@router.post("/usuarios/{user_id}/resetear-contrasena", summary="Resetear contraseña")
def reset_contrasena(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    repo = UserRepository(db)
    user = repo.get_by_id(str(user_id))
    if not user:
        raise HTTPException(status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND"}})

    _validate_same_company(current_user, user)
    _validate_can_manage(current_user, user.role)

    new_password = _generate_password()
    repo.reset_password(user, new_password)

    return {
        "success": True,
        "data": {
            "temporary_password": new_password,
            "message": "Contraseña reseteada. Solo se muestra una vez.",
        },
    }


@router.post("/usuarios/{user_id}/activar", summary="Activar usuario")
def activar_usuario(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    repo = UserRepository(db)
    user = repo.get_by_id(str(user_id))
    if not user:
        raise HTTPException(status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND"}})
    _validate_same_company(current_user, user)
    _validate_can_manage(current_user, user.role)
    repo.toggle_active(user, activate=True)
    return {"success": True, "data": {"id": str(user.id), "is_active": True}}


@router.post("/usuarios/{user_id}/desactivar", summary="Desactivar usuario")
def desactivar_usuario(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if str(user_id) == str(current_user.id):
        raise HTTPException(status_code=400,
            detail={"success": False, "error": {
                "code": "CANNOT_DEACTIVATE_SELF",
                "message": "No puede desactivar su propia cuenta."
            }})
    repo = UserRepository(db)
    user = repo.get_by_id(str(user_id))
    if not user:
        raise HTTPException(status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND"}})
    _validate_same_company(current_user, user)
    _validate_can_manage(current_user, user.role)
    repo.toggle_active(user, activate=False)
    return {"success": True, "data": {"id": str(user.id), "is_active": False}}
