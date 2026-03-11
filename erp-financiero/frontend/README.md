# ERP Financiero Local — NovaERP

Sistema completo ERP para gestión financiera y tributos en Chile (PPM, BSC), diseñado con arquitectura moderna CQA, multi-schema multi-tenant ready, y soporte robusto para importación de datos contables de alta densidad.

## Requisitos Previos
- Docker y Docker Compose
- Node.js 20+ (para frontend)
- Python 3.12+ (para backend)
- Git

## Setup en 5 Pasos

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio-url>
cd "Proyecto ERP/erp-financiero"
```

### 2. Levantar Base de Datos
```bash
docker-compose up -d
```
*(Esto lanzará PostgreSQL 16 localmente en el puerto 5432).*

### 3. Setup de Backend
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Linux/Mac
# source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
python scripts/seed.py  # (Opcional) Carga de datos mock si existe un un seeder
uvicorn app.main:app --reload --port 8000
```

### 4. Setup de Frontend
En una terminal nueva:
```bash
cd erp-financiero/frontend
npm install
npm run dev
```

### 5. Acceder a la Aplicación
Abre tu navegador en: [http://localhost:3000](http://localhost:3000)

---

## Entorno Local (Desarrollo)
- **Email:** admin@erp.com
- **Password:** admin123

> [!NOTE]
> Documentación OpenAPI interactiva disponible en [http://localhost:8000/api/docs](http://localhost:8000/api/docs) cuando el backend corre localmente. Encontrarás ahí descritos payload definitions y validaciones de esquema estrictas automáticas al estar construido sobre FastAPI.
