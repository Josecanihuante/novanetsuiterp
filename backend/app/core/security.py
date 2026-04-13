from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

# ── Crypto ────────────────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


# ── Password helpers ──────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    """Devuelve el hash bcrypt de una contraseña en texto plano."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verifica que la contraseña en texto plano coincida con el hash."""
    return pwd_context.verify(plain, hashed)


# ── JWT helpers ───────────────────────────────────────────────────────────────
def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Genera un JWT de acceso con expiración configurable."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Genera un JWT de refresh con expiración larga."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> dict:
    """
    Decodifica y valida un JWT. Lanza HTTPException 401 si es inválido o expirado.
    Retorna el payload decodificado.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"code": "INVALID_TOKEN", "message": "Token inválido o expirado"},
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError:
        raise credentials_exception


# ── Jerarquía de roles ────────────────────────────────────────────────────────
ROLE_HIERARCHY = {
    'superadmin': 4,
    'admin':      3,
    'contador':   2,
    'viewer':     1,
}


def can_manage_role(manager_role: str, target_role: str) -> bool:
    """
    Define qué roles puede gestionar cada manager:
    - superadmin: puede gestionar admin, contador, viewer
    - admin:      puede gestionar solo contador y viewer (NUNCA admin ni superadmin)
    - contador/viewer: no pueden gestionar a nadie
    """
    if manager_role == 'superadmin':
        return target_role in ('admin', 'contador', 'viewer')
    if manager_role == 'admin':
        return target_role in ('contador', 'viewer')
    return False


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Dependency de FastAPI. Decodifica el token, busca el usuario en BD
    y lo retorna. Lanza 401 si el token es inválido o el usuario no existe.
    Registra el último acceso (last_login) en cada autenticación exitosa.
    """
    from app.models.users import User  # CORREGIDO: users (plural), import diferido

    payload = verify_token(token)
    user_id: Optional[str] = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Token sin sujeto"},
        )

    user = db.get(User, user_id)
    if user is None or user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "USER_NOT_FOUND", "message": "Usuario no encontrado"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "USER_INACTIVE", "message": "Usuario inactivo"},
        )

    # Registrar último acceso
    try:
        user.last_login = datetime.now(timezone.utc)
        db.commit()
    except Exception:
        db.rollback()

    return user
