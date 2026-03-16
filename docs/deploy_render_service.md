# Skill: deploy_render_service
# Uso: @devops-render — genera todo lo necesario para desplegar en Render
# Invocar con: "usa la skill deploy_render_service para preparar el despliegue"
# ============================================================

## INSTRUCCIONES PARA EL AGENTE

Genera o verifica los siguientes archivos para garantizar un despliegue
exitoso en Render.com con base de datos en Neon.

## Archivo 1 — backend/render.yaml
```yaml
services:
  - type: web
    name: erp-financiero-api
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        sync: false          # Se carga desde el dashboard de Render (no desde código)
      - key: SECRET_KEY
        sync: false
      - key: DEBUG
        value: "false"
      - key: ALLOWED_ORIGINS
        value: "https://novaerp-cuck6c0ur-josecanihuantes-projects.vercel.app"
    autoDeploy: true
    plan: free
```

## Archivo 2 — backend/Dockerfile (opcional, para deploy containerizado)
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Instalar dependencias del sistema para psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# $PORT es inyectado por Render en runtime
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

## Archivo 3 — backend/app/db/session.py (SSL Neon obligatorio)
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# SSL requerido por Neon
connect_args = {}
if "neon.tech" in settings.DATABASE_URL or "neondb" in settings.DATABASE_URL:
    connect_args = {"sslmode": "require"}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,      # Reconectar si la conexión murió
    pool_size=5,             # Máximo 5 conexiones (Neon free limit)
    max_overflow=10,
    pool_recycle=300,        # Reciclar conexiones cada 5 min
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## Archivo 4 — backend/app/main.py (health check + CORS)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    docs_url="/docs" if settings.DEBUG else None,  # Ocultar docs en producción
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
async def health_check():
    """Endpoint público para Render health checks"""
    return {"status": "ok", "service": settings.APP_NAME}

# Incluir routers aquí
```

## Archivo 5 — env_template.txt (lista de variables requeridas)
```
# Copiar en Render → Settings → Environment Variables
# NUNCA commitear este archivo con valores reales

DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
SECRET_KEY=GENERAR_CON_python_-c_import_secrets_print_secrets.token_hex_32
DEBUG=false
ALLOWED_ORIGINS=https://novaerp-cuck6c0ur-josecanihuantes-projects.vercel.app
```

## Checklist de verificación pre-deploy

Antes de hacer push, verificar:

[ ] render.yaml existe en backend/
[ ] requirements.txt incluye psycopg2-binary
[ ] /health endpoint responde {"status":"ok"}
[ ] DATABASE_URL en Render incluye ?sslmode=require
[ ] SECRET_KEY tiene al menos 32 caracteres
[ ] ALLOWED_ORIGINS incluye la URL exacta de Vercel
[ ] Alembic migrations están al día (alembic upgrade head)
[ ] No hay archivos .env commiteados

## Comandos de verificación post-deploy

```bash
# Verificar que el backend está vivo
curl https://erp-financiero-api.onrender.com/health

# Verificar que los docs cargan (solo en DEBUG=true)
curl https://erp-financiero-api.onrender.com/docs

# Verificar que los endpoints protegidos requieren auth
curl -s -o /dev/null -w "%{http_code}" \
  https://erp-financiero-api.onrender.com/api/v1/invoices/
# Debe responder 401
```

## Rollback procedure

Si el deploy falla en Render:
1. Ir a Render dashboard → tu servicio → Deploys
2. Buscar el último deploy exitoso
3. Clic en los 3 puntos → "Redeploy"
4. Verificar /health tras el rollback

Si el problema es la BD:
1. Ir a Neon dashboard → Branches
2. Crear un branch desde el último estado estable
3. Actualizar DATABASE_URL en Render con la nueva connection string
