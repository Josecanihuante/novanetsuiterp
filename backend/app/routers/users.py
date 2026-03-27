"""Router Usuarios — CRUD completo con validación RBAC."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.repositories.user_repository import UserRepository
from app.schemas.users import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


def _require_admin(user: User) -> None:
    """Solo admin puede gestionar usuarios."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Solo admin puede gestionar usuarios."}},
        )


def _require_write(user: User) -> None:
    """viewer no puede escribir."""
    if user.role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Sin permisos para esta operación."}},
        )


@router.get("", response_model=dict, summary="Listar usuarios")
def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    repo = UserRepository(db)
    skip = (page - 1) * size
    users = repo.list(skip=skip, limit=size)
    return {
        "success": True,
        "data": [
            {
                "id": str(u.id), "email": u.email, "full_name": u.full_name,
                "role": u.role, "is_active": u.is_active,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ],
        "meta": {"page": page, "size": size, "count": len(users)},
    }


@router.get("/me", response_model=dict, summary="Perfil del usuario autenticado")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "data": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "is_active": current_user.is_active,
        },
    }


@router.get("/{user_id}", response_model=dict, summary="Detalle de usuario")
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Usuario no encontrado."}},
        )
    return {
        "success": True,
        "data": {
            "id": str(user.id), "email": user.email, "full_name": user.full_name,
            "role": user.role, "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
        },
    }


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Crear usuario")
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    repo = UserRepository(db)
    if repo.get_by_email(body.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "DUPLICATE_EMAIL", "message": f"Ya existe un usuario con el email {body.email}."}},
        )
    user = repo.create(body)
    return {
        "success": True,
        "data": {"id": str(user.id), "email": user.email, "role": user.role},
    }


@router.put("/{user_id}", response_model=dict, summary="Actualizar usuario")
def update_user(
    user_id: str,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Usuario no encontrado."}},
        )
    user = repo.update(user, body)
    return {"success": True, "data": {"id": str(user.id), "email": user.email, "role": user.role}}


@router.delete("/{user_id}", response_model=dict, summary="Eliminar usuario (soft delete)")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Usuario no encontrado."}},
        )
    if str(user.id) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "SELF_DELETE", "message": "No puedes eliminar tu propio usuario."}},
        )
    repo.soft_delete(user)
    return {"success": True, "data": {"message": "Usuario eliminado correctamente."}}
