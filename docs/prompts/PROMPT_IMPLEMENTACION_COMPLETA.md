# PROMPT MAESTRO — ERP Financiero
# Configuración de agentes + implementación completa del proyecto
# ============================================================
# INSTRUCCIONES DE USO:
# 1. Abrir Antigravity IDE — chat NUEVO
# 2. Ejecutar las fases EN ORDEN — no pasar a la siguiente sin que la anterior esté completa
# 3. Cada fase tiene su agente asignado — activarlo con @nombre antes de pegar el prompt
# ============================================================

---

# FASE 0 — CONTEXTO GLOBAL (leer antes de cualquier fase)

## Proyecto
ERP Financiero para Innova Consulting Group SpA (RUT 76.987.654-3)
Repositorio: Josecanihuante/novaerp (GitHub)

## Stack completo
- Backend: FastAPI 0.111+ / Python 3.12
- Base de datos: PostgreSQL 16 en Neon (sslmode=require obligatorio)
- ORM: SQLAlchemy 2.0 + Alembic
- Schemas Pydantic: v2 (model_dump, from_attributes=True)
- Auth: JWT python-jose + passlib bcrypt cost=12
- Frontend: React 18 + TypeScript + Tailwind CSS + Vite
- HTTP client: Axios via src/services/api.ts
- Charts: Recharts
- Deploy backend: Render.com — uvicorn app.main:app --host 0.0.0.0 --port $PORT
- Deploy frontend: Vercel — VITE_API_URL=https://erp-financiero-api.onrender.com/api/v1
- CI/CD: GitHub Actions (.github/workflows/)

## Roles del sistema
| Rol      | GET | POST | PUT | DELETE | Post asientos |
|----------|-----|------|-----|--------|---------------|
| admin    | ✅  | ✅   | ✅  | ✅     | ✅            |
| contador | ✅  | ✅   | ✅  | ❌ 403 | ❌ 403        |
| viewer   | ✅  | ❌   | ❌  | ❌ 403 | ❌ 403        |

## Credenciales de prueba
- admin:    ceo@innovaconsulting.cl / Consul2025!
- contador: contador.jefe@innovaconsulting.cl / Consul2025!
- viewer:   auditor@pwc-chile.cl / Consul2025!

## Schemas PostgreSQL existentes
- users       → users.users
- accounting  → periods, accounts, journal_entries, journal_lines
- commerce    → customers, vendors, invoices, invoice_items
- inventory   → products, stock_movements
- taxes       → tax_config, ppm_payments, tax_results
- financial   → bsc_snapshots

## Patrón obligatorio para todo módulo nuevo
router → service → schema (Pydantic) → model (SQLAlchemy)
Los permisos de rol se validan SIEMPRE en el service layer, nunca en el router.

---

# FASE 1 — AUDITORÍA INICIAL
# Agente: @arquitecto-software
# Objetivo: mapear qué existe vs qué debe existir según la documentación

@arquitecto-software

Lee la documentación completa del proyecto en docs/ y el código existente en backend/ y frontend/.

Genera un reporte de auditoría con el siguiente formato:

## REPORTE DE AUDITORÍA — ERP Financiero

### Backend — Estado actual
Para cada módulo (accounting, commerce, inventory, taxes, financial, users):
- [ ] Router existe en app/routers/
- [ ] Service existe en app/services/
- [ ] Schema Pydantic existe en app/schemas/
- [ ] Model SQLAlchemy existe en app/models/
- [ ] Tests existen en tests/

### Frontend — Estado actual
Para cada dominio (auth, dashboard, accounting, commerce, inventory, taxes, financial):
- [ ] Página existe en src/pages/
- [ ] Hook existe en src/hooks/
- [ ] Service existe en src/services/
- [ ] Componentes específicos existen en src/components/

### Base de datos — Estado actual
- [ ] Todos los schemas PostgreSQL están creados
- [ ] Todas las tablas documentadas existen
- [ ] Las migraciones Alembic están al día (alembic current vs alembic heads)

### Deploy — Estado actual
- [ ] backend/render.yaml existe y es correcto
- [ ] backend/app/db/session.py tiene SSL para Neon
- [ ] backend/app/main.py tiene /health endpoint y CORS configurado
- [ ] .github/workflows/ci.yml existe
- [ ] .github/workflows/security.yml existe
- [ ] .github/workflows/release.yml existe

### LISTA DE GAPS (archivos faltantes)
Listar cada archivo que falta con su ruta exacta.
NO implementar nada todavía — solo auditar y reportar.

---

# FASE 2 — BASE DE DATOS
# Agente: @base-de-datos
# Objetivo: asegurar que todos los schemas y tablas existen en Neon

@base-de-datos

Basándote en el reporte de auditoría de la Fase 1, verifica y completa la estructura de la base de datos.

## Tarea 1 — Verificar modelos SQLAlchemy
Revisar que existen los siguientes archivos en backend/app/models/:
- users.py      → tabla users.users
- accounting.py → tablas accounting.periods, accounts, journal_entries, journal_lines
- commerce.py   → tablas commerce.customers, vendors, invoices, invoice_items
- inventory.py  → tablas inventory.products, stock_movements
- taxes.py      → tablas taxes.tax_config, ppm_payments, tax_results
- financial.py  → tabla financial.bsc_snapshots

Para cada archivo faltante, crearlo siguiendo estas reglas:
- UUID primary key: id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
- Siempre incluir: created_at, updated_at (TIMESTAMPTZ), is_active (Boolean)
- Montos: NUMERIC(18,2) — nunca float
- Enums: VARCHAR + CHECK constraint
- FK: siempre con índice correspondiente
- Schema explícito: __table_args__ = {"schema": "[schema_name]"}

## Tarea 2 — Verificar backend/app/db/base.py
Debe importar todos los modelos para que Alembic los detecte:
```python
from app.models.users import User
from app.models.accounting import Period, Account, JournalEntry, JournalLine
from app.models.commerce import Customer, Vendor, Invoice, InvoiceItem
from app.models.inventory import Product, StockMovement
from app.models.taxes import TaxConfig, PpmPayment, TaxResult
from app.models.financial import BscSnapshot
```

## Tarea 3 — Migración Alembic
Si algún modelo fue creado o modificado:
```bash
cd backend
alembic revision --autogenerate -m "2026_03_15_complete_all_schemas"
alembic upgrade head
```

Verificar que la migración tiene tanto upgrade() como downgrade() implementados.

---

# FASE 3 — BACKEND
# Agente: @developer-backend
# Objetivo: implementar todos los routers, services y schemas faltantes

@developer-backend

Basándote en el reporte de auditoría de la Fase 1, implementa todos los archivos faltantes del backend.

## Estructura requerida por módulo
Cada módulo debe tener exactamente estos 4 archivos + tests:

### backend/app/schemas/[module].py
```python
from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime

class [Module]Base(BaseModel):
    # campos del modelo

class [Module]Create([Module]Base):
    pass

class [Module]Update(BaseModel):
    # todos opcionales

class [Module]Response([Module]Base):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
```

### backend/app/services/[module]_service.py
- get_all(db, skip, limit) → sin restricción de rol
- get_by_id(db, id) → sin restricción de rol, 404 si no existe
- create(db, data, current_user) → viewer=403
- update(db, id, data, current_user) → viewer=403
- delete(db, id, current_user) → solo admin, soft delete (is_active=False)

### backend/app/routers/[module]s.py
- GET    /api/v1/[module]s/         → list
- GET    /api/v1/[module]s/{id}     → get by id
- POST   /api/v1/[module]s/         → create (status_code=201)
- PUT    /api/v1/[module]s/{id}     → update
- DELETE /api/v1/[module]s/{id}     → delete

Todos los endpoints usan:
- db: Session = Depends(get_db)
- current_user: User = Depends(get_current_user)

## Módulos a implementar (si faltan)
1. users        → /api/v1/users/
2. periods      → /api/v1/periods/
3. accounts     → /api/v1/accounts/
4. journal-entries → /api/v1/journal-entries/ (con endpoint especial POST /{id}/post para admin)
5. customers    → /api/v1/customers/
6. vendors      → /api/v1/vendors/
7. invoices     → /api/v1/invoices/
8. products     → /api/v1/products/
9. ppm-payments → /api/v1/ppm-payments/
10. tax-results → /api/v1/tax-results/
11. bsc-snapshots → /api/v1/bsc-snapshots/

## backend/app/main.py — verificar que incluye
```python
# CORS
app.add_middleware(CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ERP Financiero API"}

# Routers — uno por módulo
app.include_router(users.router, prefix="/api/v1")
app.include_router(accounts.router, prefix="/api/v1")
# ... todos los routers
```

## backend/app/core/config.py — verificar
```python
class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    DEBUG: bool = False
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://novaerp-cuck6c0ur-josecanihuantes-projects.vercel.app",
    ]
    class Config:
        env_file = ".env"
```

---

# FASE 4 — FRONTEND
# Agente: @developer-frontend
# Objetivo: implementar todas las páginas, hooks y servicios faltantes

@developer-frontend

Basándote en el reporte de auditoría de la Fase 1, implementa todos los archivos faltantes del frontend.

## frontend/src/services/api.ts — base (verificar)
```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor JWT — agregar token a cada request
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor de respuesta — redirigir al login si 401
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Estructura requerida por dominio
Para cada dominio, implementar:

### src/services/[domain].ts
```typescript
import { apiClient } from './api';

export const get[Domain]s = () => apiClient.get('/[domain]s/');
export const get[Domain]ById = (id: string) => apiClient.get(`/[domain]s/${id}`);
export const create[Domain] = (data: any) => apiClient.post('/[domain]s/', data);
export const update[Domain] = (id: string, data: any) => apiClient.put(`/[domain]s/${id}`, data);
export const delete[Domain] = (id: string) => apiClient.delete(`/[domain]s/${id}`);
```

### src/hooks/use[Domain].ts
```typescript
import { useState, useEffect } from 'react';
import { get[Domain]s } from '@/services/[domain]';

export const use[Domain]s = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get[Domain]s()
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
};
```

### src/pages/[domain]/[Domain]Page.tsx
Implementar con los 4 estados obligatorios:
```typescript
const { role } = useAuth();
if (loading) return <LoadingSpinner />;
if (error)   return <ErrorMessage message={error} />;
if (!data || data.length === 0) return <EmptyState />;
return (
  <div>
    {role !== 'viewer' && <Button>Crear</Button>}
    {role === 'admin' && <Button variant="danger">Eliminar</Button>}
    <DataTable data={data} />
  </div>
);
```

## Páginas a implementar (si faltan)
1. src/pages/auth/LoginPage.tsx
2. src/pages/dashboard/DashboardPage.tsx      → KPIs: total facturas, PPM del mes, cuentas por cobrar
3. src/pages/accounting/AccountsPage.tsx
4. src/pages/accounting/JournalEntriesPage.tsx
5. src/pages/accounting/PeriodsPage.tsx
6. src/pages/commerce/InvoicesPage.tsx        → con filtros por estado y cliente
7. src/pages/commerce/CustomersPage.tsx
8. src/pages/commerce/VendorsPage.tsx
9. src/pages/inventory/ProductsPage.tsx
10. src/pages/taxes/PpmPaymentsPage.tsx
11. src/pages/taxes/TaxResultsPage.tsx
12. src/pages/financial/BscSnapshotsPage.tsx

## Convenciones chilenas obligatorias
```typescript
// Montos CLP
const formatCLP = (n: number) => `$${n.toLocaleString('es-CL')}`;

// Fechas
const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CL');

// Colores de estado de facturas
const statusColors: Record<string, string> = {
  paid:      'bg-green-100 text-green-800',
  issued:    'bg-blue-100 text-blue-800',
  draft:     'bg-gray-100 text-gray-800',
  overdue:   'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
};
```

---

# FASE 5 — DEPLOY
# Agente: @devops-render
# Objetivo: verificar y completar toda la configuración de despliegue

@devops-render

Verifica y completa los archivos de configuración de deploy.

## backend/render.yaml (crear si no existe)
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
        sync: false
      - key: SECRET_KEY
        sync: false
      - key: DEBUG
        value: "false"
      - key: ALLOWED_ORIGINS
        value: "https://novaerp-cuck6c0ur-josecanihuantes-projects.vercel.app"
    autoDeploy: true
    plan: free
```

## backend/Dockerfile (crear si no existe)
```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

## backend/app/db/session.py (verificar SSL Neon)
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

connect_args = {}
if "neon.tech" in settings.DATABASE_URL or "neondb" in settings.DATABASE_URL:
    connect_args = {"sslmode": "require"}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## frontend/.env.production (crear si no existe)
```
VITE_API_URL=https://erp-financiero-api.onrender.com/api/v1
```

---

# FASE 6 — CI/CD
# Agente: @devops-render
# Objetivo: verificar que los 3 workflows de GitHub Actions existen y son correctos

@devops-render

Verifica que existen los siguientes archivos en .github/workflows/:

## .github/workflows/ci.yml
Debe incluir:
- Job backend: PostgreSQL de prueba + migraciones Alembic + pytest + ruff lint
- Job frontend: npm ci + eslint + tsc --noEmit + npm run build
- Job security: safety check + npm audit
- Trigger: push y PR a main

## .github/workflows/security.yml
Debe incluir:
- Gitleaks: detectar secrets en historial
- Bandit: análisis estático Python
- npm audit: vulnerabilidades frontend
- CodeQL: análisis semántico
- Verificación de endpoints protegidos (401 sin token)
- Schedule: lunes 08:00 UTC

## .github/workflows/release.yml
Debe incluir:
- googleapis/release-please-action@v4
- Deploy a Render via webhook (RENDER_DEPLOY_HOOK_URL secret)
- Deploy a Vercel via amondnet/vercel-action@v25
- Trigger: solo al mergear Release PR

Si alguno falta, crearlo según las especificaciones de los archivos ci.yml,
security.yml y release.yml que ya fueron generados para este proyecto.

---

# FASE 7 — QA Y TESTS
# Agente: @qa-y-arquitecto
# Objetivo: generar tests para todos los módulos implementados

@qa-y-arquitecto

Para cada módulo del backend, generar el archivo de tests en backend/tests/test_[module]s.py.

## Estructura de tests por módulo
```python
import pytest
from httpx import AsyncClient

# ── AUTENTICACIÓN ──────────────────────────────
async def test_[module]s_list_without_token_returns_401(client):
    r = await client.get("/api/v1/[module]s/")
    assert r.status_code == 401

# ── HAPPY PATH ─────────────────────────────────
async def test_[module]s_list_as_admin_returns_200(client, admin_token):
    r = await client.get("/api/v1/[module]s/",
        headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)

# ── PERMISOS DE ROL ────────────────────────────
async def test_[module]s_create_as_viewer_returns_403(client, viewer_token):
    r = await client.post("/api/v1/[module]s/",
        json={},
        headers={"Authorization": f"Bearer {viewer_token}"})
    assert r.status_code == 403

async def test_[module]s_delete_as_contador_returns_403(client, contador_token, [module]_id):
    r = await client.delete(f"/api/v1/[module]s/{[module]_id}",
        headers={"Authorization": f"Bearer {contador_token}"})
    assert r.status_code == 403

# ── NOT FOUND ──────────────────────────────────
async def test_[module]s_get_nonexistent_returns_404(client, admin_token):
    r = await client.get("/api/v1/[module]s/00000000-0000-0000-0000-000000000000",
        headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 404
```

## Tests especiales de negocio a incluir
- test_ppm_amount_equals_gross_income_times_rate → ppm_amount == gross_income * 0.028
- test_invoice_total_equals_subtotal_plus_tax → total == subtotal * 1.19
- test_journal_entry_post_as_contador_returns_403
- test_closed_period_rejects_new_journal_entry
- test_viewer_can_read_all_modules → verificar GET en todos los endpoints

## backend/tests/conftest.py (crear si no existe)
Debe incluir fixtures:
- client: AsyncClient con la app FastAPI
- admin_token: token JWT para ceo@innovaconsulting.cl
- contador_token: token JWT para contador.jefe@innovaconsulting.cl
- viewer_token: token JWT para auditor@pwc-chile.cl
- IDs de entidades de prueba para cada módulo

---

# FASE 8 — REVISIÓN FINAL
# Agente: @technical-reviewer
# Objetivo: auditoría completa antes del commit final

@technical-reviewer

Ejecuta el workflow /review-tecnico sobre todos los cambios implementados en las fases 1-7.

Verifica el checklist completo:

### Arquitectura
- [ ] Todos los módulos siguen router→service→schema→model
- [ ] No hay lógica de negocio en los routers
- [ ] Todas las tablas están en el schema PostgreSQL correcto

### Seguridad
- [ ] Todos los endpoints usan Depends(get_current_user)
- [ ] Los permisos de rol están en el service layer
- [ ] No hay credenciales hardcodeadas
- [ ] DATABASE_URL no está en ningún archivo commiteado

### Base de datos
- [ ] Montos usan NUMERIC(18,2)
- [ ] Tablas tienen UUID PK, created_at, updated_at
- [ ] FK tienen índices
- [ ] Migraciones tienen downgrade()

### Tests
- [ ] Cobertura ≥ 60% en código nuevo
- [ ] Tests para 401, 403, 404 en cada endpoint

### Deploy
- [ ] render.yaml correcto
- [ ] SSL Neon configurado
- [ ] /health endpoint funcional

Generar review_report.md con decisión GO / NO-GO / GO con advertencias.

---

# FASE 9 — COMMIT FINAL
# (ejecutar manualmente en PowerShell después de que @technical-reviewer dé GO)

```powershell
cd "C:\Users\usuario\Desktop\Proyecto ERP"
git add .
git commit -m "feat: complete ERP implementation - all modules backend + frontend + deploy"
git push origin main
```

Esto dispara el CI en GitHub Actions automáticamente.
Render hace redeploy automático por autoDeploy: true en render.yaml.
Vercel hace redeploy automático al detectar el push.

---

# NOTAS FINALES

## Si alguna fase falla
- Fase 2 falla (BD): verificar que Neon está activo y DATABASE_URL es correcto
- Fase 3 falla (backend): revisar que requirements.txt tiene todas las dependencias
- Fase 4 falla (frontend): revisar que package.json tiene todas las dependencias
- Fase 6 falla (CI): verificar que los secrets están configurados en GitHub

## Orden estricto
0 → 1 → 2 → 3+4 (paralelo) → 5+6 (paralelo) → 7 → 8 → 9

## Archivos de referencia disponibles en docs/
- ERP_Documentacion_Agentes_v2.docx → documentación completa de agentes
- erp-contexts/agentes/             → prompts de cada agente
- erp-contexts/skills/              → plantillas de código reutilizables
- setup_completo.sql                → seed data completo
