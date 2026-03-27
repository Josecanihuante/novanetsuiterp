# Skill: create_fastapi_endpoint
# Uso: @developer-backend — genera un módulo FastAPI completo
# Invocar con: "usa la skill create_fastapi_endpoint para crear el módulo [nombre]"
# ============================================================

## INSTRUCCIONES PARA EL AGENTE

Cuando se invoque esta skill, genera los siguientes 5 archivos para el módulo indicado.
Reemplaza [MODULE] con el nombre del módulo (ej: expenses, employees, contracts).
Reemplaza [SCHEMA] con el schema PostgreSQL correspondiente (ej: accounting, commerce).

## Archivos a generar

### 1. backend/app/models/[module].py
```python
from sqlalchemy import Column, String, Boolean, Numeric, Date, ForeignKey, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.db.base import Base

class [Module](Base):
    __tablename__ = "[module]s"
    __table_args__ = {"schema": "[schema]"}

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # --- campos específicos del módulo aquí ---
    is_active  = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMPTZ, nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, nullable=False, server_default=func.now(), onupdate=func.now())
```

### 2. backend/app/schemas/[module].py
```python
from pydantic import BaseModel, UUID4, Field
from typing import Optional
from datetime import datetime

class [Module]Base(BaseModel):
    # campos comunes a create y response
    pass

class [Module]Create([Module]Base):
    # campos requeridos para crear
    pass

class [Module]Update(BaseModel):
    # todos opcionales para PATCH
    pass

class [Module]Response([Module]Base):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

### 3. backend/app/services/[module]_service.py
```python
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.[module] import [Module]
from app.schemas.[module] import [Module]Create, [Module]Update
from app.models.users import User

def get_all(db: Session, skip: int = 0, limit: int = 100) -> list[[Module]]:
    return db.query([Module]).filter([Module].is_active == True).offset(skip).limit(limit).all()

def get_by_id(db: Session, item_id: str) -> [Module]:
    item = db.query([Module]).filter([Module].id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="[Module] not found")
    return item

def create(db: Session, data: [Module]Create, current_user: User) -> [Module]:
    # Solo admin y contador pueden crear
    if current_user.role == "viewer":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    try:
        item = [Module](**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

def update(db: Session, item_id: str, data: [Module]Update, current_user: User) -> [Module]:
    if current_user.role == "viewer":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    item = get_by_id(db, item_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    try:
        db.commit()
        db.refresh(item)
        return item
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

def delete(db: Session, item_id: str, current_user: User) -> dict:
    # Solo admin puede eliminar
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    item = get_by_id(db, item_id)
    item.is_active = False  # Soft delete
    db.commit()
    return {"message": "[Module] deleted successfully"}
```

### 4. backend/app/routers/[module]s.py
```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.schemas.[module] import [Module]Create, [Module]Update, [Module]Response
from app.services import [module]_service

router = APIRouter(prefix="/[module]s", tags=["[Module]s"])

@router.get("/", response_model=List[[Module]Response])
def list_[module]s(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return [module]_service.get_all(db, skip, limit)

@router.get("/{item_id}", response_model=[Module]Response)
def get_[module](
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return [module]_service.get_by_id(db, item_id)

@router.post("/", response_model=[Module]Response, status_code=201)
def create_[module](
    data: [Module]Create,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return [module]_service.create(db, data, current_user)

@router.put("/{item_id}", response_model=[Module]Response)
def update_[module](
    item_id: str,
    data: [Module]Update,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return [module]_service.update(db, item_id, data, current_user)

@router.delete("/{item_id}", status_code=200)
def delete_[module](
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return [module]_service.delete(db, item_id, current_user)
```

### 5. backend/tests/test_[module]s.py
```python
import pytest
from httpx import AsyncClient

# Fixtures de autenticación definidas en conftest.py
# admin_token, contador_token, viewer_token

@pytest.mark.asyncio
async def test_list_[module]s_as_admin(client: AsyncClient, admin_token: str):
    r = await client.get("/api/v1/[module]s/", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)

@pytest.mark.asyncio
async def test_list_[module]s_unauthorized(client: AsyncClient):
    r = await client.get("/api/v1/[module]s/")
    assert r.status_code == 401

@pytest.mark.asyncio
async def test_create_[module]_as_viewer_should_return_403(client: AsyncClient, viewer_token: str):
    r = await client.post(
        "/api/v1/[module]s/",
        json={},  # completar con campos requeridos
        headers={"Authorization": f"Bearer {viewer_token}"}
    )
    assert r.status_code == 403

@pytest.mark.asyncio
async def test_delete_[module]_as_contador_should_return_403(client: AsyncClient, contador_token: str, [module]_id: str):
    r = await client.delete(
        f"/api/v1/[module]s/{[module]_id}",
        headers={"Authorization": f"Bearer {contador_token}"}
    )
    assert r.status_code == 403
```

## Paso final — registrar el router en main.py
```python
from app.routers import [module]s
app.include_router([module]s.router, prefix="/api/v1")
```

## Alembic — generar migración
```bash
cd backend
alembic revision --autogenerate -m "add_[module]s_table"
alembic upgrade head
```
