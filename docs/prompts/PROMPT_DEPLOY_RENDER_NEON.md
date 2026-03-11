# PROMPT — @arquitecto-software + @developer-backend
# Despliegue: FastAPI en Render.com + PostgreSQL en Neon
# Ejecutar en una conversación NUEVA en Antigravity
# ============================================================

## Contexto
- Frontend: React + TypeScript en Vercel
  URL: https://novaerp-cuck6c0ur-josecanihuantes-projects.vercel.app
- Backend: FastAPI + Python 3.12 (sin desplegar)
- Repositorio GitHub: Josecanihuante/novaerp
- Render requiere un archivo render.yaml o configuración manual
- Neon provee PostgreSQL cloud gratuito con SSL obligatorio

## TAREA 1 — Crear `backend/render.yaml`
```yaml
services:
  - type: web
    name: erp-financiero-api
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: SECRET_KEY
        sync: false
      - key: DEBUG
        value: false
      - key: PYTHON_VERSION
        value: 3.12.0
    healthCheckPath: /health
    autoDeploy: true
```

## TAREA 2 — Verificar/crear `backend/app/core/config.py`
```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://erp_user:erp_pass@localhost:5432/erp_db"
    SECRET_KEY: str = "dev-secret-key-cambiar-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    DEBUG: bool = False
    APP_NAME: str = "ERP Financiero"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://novaerp-cuck6c0ur-josecanihuantes-projects.vercel.app",
        "https://*.vercel.app",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

## TAREA 3 — Verificar/actualizar `backend/app/main.py`
Asegurarse que el archivo tiene:
1. CORSMiddleware con settings.ALLOWED_ORIGINS
2. Endpoint /health que retorna {"status": "ok"}
3. Import correcto de settings

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": settings.APP_NAME}

# ... resto de los routers existentes
```

## TAREA 4 — Verificar/actualizar `backend/app/db/session.py`
Neon requiere SSL. El engine debe tener connect_args para SSL:
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

def get_connect_args(url: str) -> dict:
    """Neon y otros Postgres cloud requieren SSL."""
    if any(host in url for host in ["neon.tech", "render.com", "supabase"]):
        return {"sslmode": "require"}
    return {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=get_connect_args(settings.DATABASE_URL),
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## TAREA 5 — Verificar `backend/requirements.txt`
Debe contener exactamente estas dependencias (agregar las que falten):
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

## TAREA 6 — Actualizar `frontend/src/services/api.ts`
Cambiar la baseURL para usar variable de entorno:
```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## TAREA 7 — Crear `frontend/.env.production`
```
VITE_API_URL=https://erp-financiero-api.onrender.com/api/v1
```
NOTA: La URL exacta se conoce después del despliegue en Render.
Dejar el placeholder por ahora — se actualizará en Vercel directamente.

## TAREA 8 — Commit y push
Una vez hechos todos los cambios anteriores:
```bash
git add .
git commit -m "feat: add Render deployment config and Neon SSL support"
git push origin main
```

## RESULTADO ESPERADO
Después del push, el usuario podrá:
1. Ir a render.com y conectar el repo
2. Render detecta render.yaml automáticamente
3. Agregar DATABASE_URL (de Neon) y SECRET_KEY como variables
4. El backend queda en https://erp-financiero-api.onrender.com
5. Actualizar VITE_API_URL en Vercel y hacer redeploy
