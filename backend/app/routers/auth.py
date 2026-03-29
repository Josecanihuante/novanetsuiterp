"""Router de autenticación."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    verify_token,
)
from app.repositories.user_repository import UserRepository
from app.schemas.users import TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


def _error(code: str, message: str, status_code: int = 400):
    raise HTTPException(
        status_code=status_code,
        detail={"success": False, "error": {"code": code, "message": message}},
    )


@router.post("/login", response_model=dict, summary="Iniciar sesión")
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Verifica credenciales y retorna access_token + refresh_token."""
    repo = UserRepository(db)
    user = repo.get_by_email(form.username)
    if not user or not verify_password(form.password, user.hashed_password):
        _error("INVALID_CREDENTIALS", "Credenciales inválidas.", status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        _error("USER_INACTIVE", "Usuario inactivo.", status.HTTP_403_FORBIDDEN)

    access_token  = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return {
        "success": True,
        "data": {
            "access_token":  access_token,
            "refresh_token": refresh_token,
            "token_type":    "bearer",
            "user": {
                "id":        user.id,
                "email":     user.email,
                "full_name": user.full_name,
                "role":      user.role,
            },
        },
    }


@router.post("/refresh", response_model=dict, summary="Renovar access token")
def refresh_token(payload: dict, db: Session = Depends(get_db)):
    """Renueva el access_token usando un refresh_token válido."""
    token = payload.get("refresh_token")
    if not token:
        _error("MISSING_TOKEN", "refresh_token requerido.", status.HTTP_400_BAD_REQUEST)

    data = verify_token(token)
    if data.get("type") != "refresh":
        _error("INVALID_TOKEN_TYPE", "Token no es de tipo refresh.", status.HTTP_401_UNAUTHORIZED)

    repo = UserRepository(db)
    user = repo.get_by_id(data["sub"])
    if not user or not user.is_active:
        _error("USER_NOT_FOUND", "Usuario no encontrado o inactivo.", status.HTTP_401_UNAUTHORIZED)

    new_access = create_access_token({"sub": user.id, "role": user.role})
    return {"success": True, "data": {"access_token": new_access, "token_type": "bearer"}}


@router.post("/logout", response_model=dict, summary="Cerrar sesión")
def logout():
    """
    Invalida la sesión del cliente.
    En esta implementación el cliente descarta el token;
    para revocación server-side se requiere una blocklist (Redis).
    """
    return {"success": True, "data": {"message": "Sesión cerrada correctamente."}}
