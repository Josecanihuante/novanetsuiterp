# PROMPT — Gestión de Usuarios Multi-tenant (CORREGIDO)
# Agentes: @developer-backend + @base-de-datos + @developer-frontend + @technical-reviewer
# Ejecutar en conversación NUEVA en Antigravity
# ============================================================
# CORRECCIONES APLICADAS respecto a la versión anterior:
# 1. Roles unificados en español: admin | contador | viewer (+ superadmin nuevo)
# 2. Nombres de campos corregidos según modelos reales:
#    - Customer: usa tax_id (no rut), payment_terms_days (no payment_days)
#    - Invoice: usa issue_date (no invoice_date), invoice_type (no type)
#    - JournalEntry: usa status='draft'|'posted' (no is_posted bool)
#    - User: modelo en app/models/users.py (no app/models/user.py)
# 3. Schema Pydantic users.py tiene roles INCORRECTOS (manager|accountant)
#    → debe corregirse a admin|contador|viewer|superadmin
# 4. Router existente en app/routers/users.py → EXTENDER, no reemplazar
# 5. UserRepository en app/repositories/user_repository.py → EXTENDER
# ============================================================

## Estado actual del código (leer antes de implementar)

### Modelo User real — backend/app/models/users.py
```python
class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'contador', 'viewer')", name="check_role"),
        {"schema": "users"},
    )
    id:              UUID PK
    email:           String(255) unique
    full_name:       String(255)
    hashed_password: String(255)
    role:            String(50) default='viewer'
    is_active:       Boolean default=True
    created_at:      TIMESTAMPTZ
    updated_at:      TIMESTAMPTZ
    deleted_at:      TIMESTAMPTZ nullable  ← soft delete
    # NO TIENE: company_id, created_by, last_login
```

### Schema Pydantic real — backend/app/schemas/users.py
```python
# PROBLEMA: tiene roles incorrectos (manager|accountant)
# DEBE CORREGIRSE A: admin|contador|viewer|superadmin
role: str = Field(pattern=r"^(admin|manager|accountant|viewer)$")  # ← INCORRECTO
```

### Router existente — backend/app/routers/users.py
Ya tiene endpoints: GET /, GET /me, GET /{id}, POST /, PUT /{id}, DELETE /{id}
Todos protegidos con `_require_admin`. Usar como base y EXTENDER.

### UserRepository — backend/app/repositories/user_repository.py
Métodos existentes: get_by_id, get_by_email, list, create, update, soft_delete
El método `list` filtra por `deleted_at.is_(None)` — EXTENDER para filtrar por company_id.

---

# PARTE 1 — BASE DE DATOS
## @base-de-datos

### 1.1 Ejecutar en Neon SQL Editor — en este orden exacto

```sql
-- PASO 1: Crear tabla de empresas
CREATE TABLE IF NOT EXISTS users.companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut             VARCHAR(20) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    trade_name      VARCHAR(255),
    activity        VARCHAR(255),
    address         TEXT,
    city            VARCHAR(100),
    phone           VARCHAR(50),
    email           VARCHAR(255),
    logo_url        TEXT,
    tax_regime      VARCHAR(30) DEFAULT 'general'
                    CHECK (tax_regime IN ('general','pro_pyme','micro_empresa')),
    ppm_rate        NUMERIC(8,6) DEFAULT 0.028,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PASO 2: Agregar columnas a users.users (todas nullable para no romper datos existentes)
ALTER TABLE users.users
    ADD COLUMN IF NOT EXISTS company_id  UUID REFERENCES users.companies(id),
    ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES users.users(id),
    ADD COLUMN IF NOT EXISTS last_login  TIMESTAMPTZ;

-- PASO 3: Actualizar el CHECK de roles para incluir superadmin y el español correcto
ALTER TABLE users.users DROP CONSTRAINT IF EXISTS check_role;
ALTER TABLE users.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users.users DROP CONSTRAINT IF EXISTS chk_users_role;

ALTER TABLE users.users
    ADD CONSTRAINT chk_users_role
    CHECK (role IN ('superadmin', 'admin', 'contador', 'viewer'));

-- PASO 4: Crear empresa Innova Consulting (la empresa existente)
INSERT INTO users.companies (id, rut, name, activity, tax_regime, ppm_rate)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    '76.987.654-3',
    'Innova Consulting Group SpA',
    'Consultoría de Estrategia y Transformación Digital',
    'general',
    0.028
) ON CONFLICT (rut) DO NOTHING;

-- PASO 5: Asignar company_id a todos los usuarios existentes
UPDATE users.users
SET company_id = '10000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

-- PASO 6: Índices
CREATE INDEX IF NOT EXISTS idx_users_company_id
    ON users.users(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_active
    ON users.users(role, is_active) WHERE deleted_at IS NULL;

-- PASO 7: Verificar que todo quedó bien
SELECT
    c.name AS empresa,
    u.email,
    u.role,
    u.is_active,
    u.company_id IS NOT NULL AS tiene_empresa
FROM users.users u
LEFT JOIN users.companies c ON c.id = u.company_id
ORDER BY u.role, u.email;
```

---

# PARTE 2 — BACKEND
## @developer-backend

### 2.1 Corregir backend/app/schemas/users.py

**CAMBIO CRÍTICO**: unificar roles en español. Reemplazar el pattern de roles en TODO el archivo:

```python
# ANTES (incorrecto):
role: str = Field(default="viewer", pattern=r"^(admin|manager|accountant|viewer)$")

# DESPUÉS (correcto):
role: str = Field(default="viewer", pattern=r"^(superadmin|admin|contador|viewer)$")
```

Aplicar el cambio en `UserBase` y `UserUpdate`. El archivo completo corregido:

```python
"""Schemas Pydantic v2 para la entidad User."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

ROLES_VALIDOS = r"^(superadmin|admin|contador|viewer)$"

class UserBase(BaseModel):
    email:     EmailStr
    full_name: str  = Field(..., min_length=2, max_length=255)
    role:      str  = Field(default="viewer", pattern=ROLES_VALIDOS)
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    role:      Optional[str] = Field(None, pattern=ROLES_VALIDOS)
    is_active: Optional[bool] = None
    password:  Optional[str] = Field(None, min_length=8)

class UserResponse(UserBase):
    id:         str
    company_id: Optional[UUID] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
```

### 2.2 Actualizar backend/app/models/users.py

Agregar los campos nuevos al modelo existente:

```python
import uuid
from datetime import datetime
from sqlalchemy import CheckConstraint, ForeignKey
from sqlalchemy import UUID, Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "role IN ('superadmin', 'admin', 'contador', 'viewer')",
            name="chk_users_role"
        ),
        {"schema": "users"},
    )

    id:              Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email:           Mapped[str]       = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str]       = mapped_column(String(255), nullable=False)
    full_name:       Mapped[str]       = mapped_column(String(255), nullable=False)
    role:            Mapped[str]       = mapped_column(String(50), nullable=False, default="viewer", server_default="viewer")
    is_active:       Mapped[bool]      = mapped_column(Boolean, default=True, nullable=False)

    # Campos nuevos para multi-tenant
    company_id:  Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.companies.id"),
        nullable=True,
        index=True,
    )
    created_by:  Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.users.id"),
        nullable=True,
    )
    last_login:  Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at:  Mapped[datetime]       = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at:  Mapped[datetime]       = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at:  Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
```

### 2.3 Crear backend/app/models/company.py

```python
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import UUID, Boolean, DateTime, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"
    __table_args__ = {"schema": "users"}

    id:         Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rut:        Mapped[str]        = mapped_column(String(20), unique=True, nullable=False)
    name:       Mapped[str]        = mapped_column(String(255), nullable=False)
    trade_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    activity:   Mapped[str | None] = mapped_column(String(255), nullable=True)
    address:    Mapped[str | None] = mapped_column(Text, nullable=True)
    city:       Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone:      Mapped[str | None] = mapped_column(String(50), nullable=True)
    email:      Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo_url:   Mapped[str | None] = mapped_column(Text, nullable=True)
    tax_regime: Mapped[str]        = mapped_column(String(30), nullable=False, default="general")
    ppm_rate:   Mapped[Decimal]    = mapped_column(Numeric(8, 6), nullable=False, default=Decimal("0.028"))
    is_active:  Mapped[bool]       = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime]   = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime]   = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<Company rut={self.rut} name={self.name}>"
```

### 2.4 Actualizar backend/app/core/security.py

Agregar jerarquía de roles y actualizar get_current_user para registrar last_login.
Corregir el import incorrecto (`app.models.user` → `app.models.users`):

```python
# Agregar después de los imports existentes:

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


# Reemplazar get_current_user existente:
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    from app.models.users import User  # CORREGIDO: users (plural)
    from datetime import datetime, timezone

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
```

### 2.5 Extender backend/app/repositories/user_repository.py

Agregar métodos nuevos SIN modificar los existentes:

```python
# Agregar al final de la clase UserRepository:

def list_by_company(
    self,
    company_id: str,
    include_inactive: bool = False,
    skip: int = 0,
    limit: int = 50,
) -> list[User]:
    """Lista usuarios de una empresa específica. Solo contador y viewer."""
    q = (
        self.db.query(User)
        .filter(
            User.company_id == company_id,
            User.role.in_(["contador", "viewer"]),
            User.deleted_at.is_(None),
        )
    )
    if not include_inactive:
        q = q.filter(User.is_active == True)
    return q.order_by(User.role, User.full_name).offset(skip).limit(limit).all()

def create_with_company(
    self,
    data: 'UserCreate',
    company_id: str,
    created_by_id: str,
) -> User:
    """Crea un usuario asignándole empresa y auditoría de creación."""
    user = User(
        email=data.email,
        full_name=data.full_name,
        role=data.role,
        is_active=data.is_active,
        hashed_password=hash_password(data.password),
        company_id=company_id,
        created_by=created_by_id,
    )
    self.db.add(user)
    self.db.commit()
    self.db.refresh(user)
    return user

def toggle_active(self, user: User, activate: bool) -> User:
    """Activa o desactiva un usuario."""
    from datetime import datetime, timezone
    user.is_active  = activate
    user.updated_at = datetime.now(timezone.utc)
    self.db.commit()
    self.db.refresh(user)
    return user

def reset_password(self, user: User, new_password: str) -> User:
    """Resetea la contraseña de un usuario."""
    from datetime import datetime, timezone
    user.hashed_password = hash_password(new_password)
    user.updated_at      = datetime.now(timezone.utc)
    self.db.commit()
    self.db.refresh(user)
    return user
```

### 2.6 Crear backend/app/routers/user_management.py

Router NUEVO separado del router `/users` existente.
Prefijo `/user-management` para no colisionar:

```python
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
```

### 2.7 Registrar el router nuevo en backend/app/routers/__init__.py

Agregar al final del archivo existente (SIN modificar los imports actuales):

```python
from app.routers import user_management   # agregar este import

# Agregar esta línea al final de los include_router:
api_router.include_router(user_management.router)
```

---

# PARTE 3 — FRONTEND
## @developer-frontend

### 3.1 Crear frontend/src/pages/admin/UserManagementPage.tsx

Página completa con tabla de usuarios y modales. Solo visible para rol `admin`.

**Llamadas a la API:**
```typescript
// USAR ESTOS ENDPOINTS (no /users/ que es el existente):
GET    /api/v1/user-management/usuarios
POST   /api/v1/user-management/usuarios
PUT    /api/v1/user-management/usuarios/{id}
POST   /api/v1/user-management/usuarios/{id}/resetear-contrasena
POST   /api/v1/user-management/usuarios/{id}/activar
POST   /api/v1/user-management/usuarios/{id}/desactivar
```

**Roles disponibles en el select de creación/edición:**
```typescript
// Solo estos dos — NUNCA mostrar admin ni superadmin
const ROLES_GESTIONABLES = [
  { value: 'contador', label: 'Contador' },
  { value: 'viewer',   label: 'Observador' },
];
```

**Tabla de usuarios — columnas:**
- Nombre completo
- Email
- Rol (badge: contador=azul, viewer=gris)
- Estado (activo=verde dot, inactivo=rojo dot)
- Último acceso (fecha DD/MM/YYYY HH:MM o "Nunca")
- Acciones: Editar | Resetear contraseña | Activar/Desactivar

**Modal de creación:**
- Nombre completo (input)
- Email (input email)
- Rol (select: solo Contador | Observador)
- Contraseña (input opcional con placeholder "Dejar vacío para generar automáticamente")

**Modal de contraseña temporal** (mostrar después de crear o resetear):
```tsx
const PasswordModal = ({ password, onClose }: { password: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mb-4">
        <h3 className="font-bold text-yellow-800 text-base mb-1">
          ⚠️ Contraseña temporal — solo se muestra una vez
        </h3>
        <p className="text-yellow-700 text-xs mb-3">
          Copie y comparta por un canal seguro (no por email).
        </p>
        <div className="bg-white border border-yellow-300 rounded-lg p-3 font-mono text-lg text-center tracking-widest">
          {password}
        </div>
      </div>
      <button
        onClick={() => { navigator.clipboard.writeText(password); }}
        className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium mb-2 transition-colors"
      >
        📋 Copiar contraseña
      </button>
      <button
        onClick={onClose}
        className="w-full py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Cerrar (ya copié la contraseña)
      </button>
    </div>
  </div>
);
```

### 3.2 Agregar ruta y menú

```typescript
// En App.tsx o router.tsx:
<Route path="/admin/usuarios" element={<UserManagementPage />} />

// En Sidebar — solo para admin:
{(role === 'admin' || role === 'superadmin') && (
  <NavLink to="/admin/usuarios">
    👥 Usuarios
  </NavLink>
)}
```

---

# PARTE 4 — REVISIÓN FINAL
## @technical-reviewer

Verificar antes del deploy:

### Seguridad
- [ ] Admin NO puede crear usuarios con role 'admin' ni 'superadmin'
- [ ] `_validate_can_manage` se llama antes de cualquier operación de escritura
- [ ] `_validate_same_company` se llama en update, reset, activar, desactivar
- [ ] No se puede desactivar la propia cuenta (verificar user_id === current_user.id)
- [ ] La contraseña temporal se devuelve en la respuesta pero NO se almacena en texto plano
- [ ] El campo `company_id` se toma de `current_user.company_id`, nunca del body

### Consistencia de datos
- [ ] El schema Pydantic usa `admin|contador|viewer|superadmin` (no manager|accountant)
- [ ] El modelo SQLAlchemy tiene el mismo CHECK constraint actualizado
- [ ] Todos los usuarios existentes tienen `company_id` asignado (verificar con la query del paso 1.1)
- [ ] El import en `security.py` usa `app.models.users` (plural, no singular)

### Compatibilidad
- [ ] El router existente `/users` sigue funcionando sin cambios
- [ ] El nuevo router `/user-management` no colisiona con rutas existentes
- [ ] El método `list_by_company` no afecta el método `list` existente

---

## COMMIT FINAL
```bash
git add .
git commit -m "feat: multi-tenant user management — roles en español, company_id"
git push origin main
```

## VERIFICACIÓN POST-DEPLOY en Neon SQL Editor
```sql
-- Confirmar que todos los usuarios tienen company_id
SELECT COUNT(*) AS sin_empresa
FROM users.users
WHERE company_id IS NULL AND deleted_at IS NULL;
-- Debe devolver 0

-- Confirmar roles válidos
SELECT DISTINCT role FROM users.users;
-- Debe mostrar solo: admin, contador, viewer (y superadmin si se creó)
```
