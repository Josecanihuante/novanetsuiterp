# PROMPT — @arquitecto-software + @developer-backend
# Despliegue completo: FastAPI en Railway + PostgreSQL en Neon
# Ejecutar en una conversación NUEVA en Antigravity
# ============================================================

## Contexto del proyecto
- Frontend: React + TypeScript desplegado en Vercel
  URL actual: https://novaerp-cuck6c0ur-josecanihuantes-projects.vercel.app
- Backend: FastAPI + Python 3.12 (aún NO desplegado)
- Base de datos: PostgreSQL 16 (actualmente solo en Docker local)
- Repositorio: GitHub (el mismo que conecta con Vercel)

El objetivo es desplegar el backend en Railway y la BD en Neon para que
el frontend en Vercel pueda conectarse y el ERP funcione completamente.

## PASO 1 — Preparar archivos de despliegue en el backend

### 1.1 Crear `backend/Procfile`
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 1.2 Crear `backend/railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### 1.3 Verificar `backend/requirements.txt`
Asegurarse que incluye estas dependencias (agregar si faltan):
```
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
sqlalchemy>=2.0.0
alembic>=1.13.0
psycopg2-binary>=2.9.9
pydantic>=2.0.0
pydantic-settings>=2.0.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.9
httpx>=0.27.0
```

### 1.4 Actualizar `backend/app/core/config.py`
Asegurarse que DATABASE_URL acepta la variable de entorno de Railway/Neon:
```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Base de datos — Railway/Neon proveen DATABASE_URL automáticamente
    DATABASE_URL: str = "postgresql://erp_user:erp_pass@localhost:5432/erp_db"
    
    # JWT
    SECRET_KEY: str = "cambiar-en-produccion-usar-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # CORS — agregar URL de Vercel
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://novaerp-cuck6c0ur-josecanihuantes-projects.vercel.app",
        "https://*.vercel.app",
    ]
    
    # App
    APP_NAME: str = "ERP Financiero"
    DEBUG: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

### 1.5 Verificar CORS en `backend/app/main.py`
El middleware CORSMiddleware debe usar `settings.ALLOWED_ORIGINS`:
```python
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 1.6 Verificar endpoint `/health` en `backend/app/main.py`
Railway lo necesita para saber que el servicio está vivo:
```python
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ERP Financiero API"}
```

### 1.7 Actualizar `backend/app/db/session.py` para SSL con Neon
Neon requiere SSL. Asegurarse que la conexión lo soporte:
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Neon requiere sslmode=require en la URL o como argumento
connect_args = {}
if "neon.tech" in settings.DATABASE_URL or "sslmode" not in settings.DATABASE_URL:
    connect_args = {"sslmode": "require"}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

## PASO 2 — Actualizar el frontend para apuntar al backend en Railway

### 2.1 Crear `frontend/.env.production`
```
VITE_API_URL=https://TU-BACKEND.railway.app/api/v1
```
(La URL exacta de Railway se conoce después del despliegue — dejar placeholder por ahora)

### 2.2 Verificar `frontend/src/services/api.ts`
Debe usar la variable de entorno:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## PASO 3 — Commit y push a GitHub

Una vez hechos los cambios:
```bash
cd "C:\Users\usuario\Desktop\Proyecto ERP"
git add .
git commit -m "feat: add Railway deployment config and Neon SSL support"
git push origin main
```

## PASO 4 — Instrucciones manuales para el usuario

Después de hacer el push, el usuario debe:

1. NEON (base de datos):
   - Ir a https://neon.tech y crear cuenta gratuita
   - New Project → nombre: "erp-financiero" → región: US East
   - Copiar la connection string que se ve así:
     postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require

2. RAILWAY (backend):
   - Ir a https://railway.app y crear cuenta con GitHub
   - New Project → Deploy from GitHub repo
   - Seleccionar el repositorio del ERP
   - En "Root Directory" poner: backend
   - En Variables agregar:
     DATABASE_URL = [pegar la connection string de Neon]
     SECRET_KEY = [generar con: python -c "import secrets; print(secrets.token_hex(32))"]
   - Railway genera automáticamente una URL tipo: https://erp-backend-production.up.railway.app

3. VERCEL (frontend):
   - Ir al proyecto en https://vercel.com
   - Settings → Environment Variables
   - Agregar: VITE_API_URL = https://[tu-url-railway].up.railway.app/api/v1
   - Redeploy

4. SEED DATA en Neon:
   - En Neon dashboard → SQL Editor
   - Pegar y ejecutar el contenido de setup_completo.sql

## RESULTADO ESPERADO
- BD Neon: postgresql://...neon.tech/neondb (cloud, gratuita)
- Backend Railway: https://erp-backend-xxx.up.railway.app (FastAPI)
- Frontend Vercel: https://novaerp-cuck6c0ur-josecanihuantes-projects.vercel.app
- Login: ceo@innovaconsulting.cl / Consul2025!
