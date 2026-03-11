# BACKEND — Parte 1 de 3: Setup y Core

Proyecto: ERP Financiero. Stack: FastAPI + Python 3.12 + SQLAlchemy + PostgreSQL.

## Crea estos archivos ahora:

### backend/requirements.txt
```
fastapi
uvicorn[standard]
sqlalchemy
alembic
psycopg2-binary
pydantic[email]
pydantic-settings
python-jose[cryptography]
passlib[bcrypt]
openpyxl
python-multipart
pytest
httpx
pytest-asyncio
```

### backend/.env.example
```
DATABASE_URL=postgresql://erp_user:erp_pass@localhost:5432/erp_db
SECRET_KEY=cambia-esto-por-un-secret-seguro-de-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### backend/app/core/config.py
Clase Settings con pydantic-settings que lee todas las variables del .env.

### backend/app/core/database.py
Engine SQLAlchemy + SessionLocal + función get_db como dependency de FastAPI.

### backend/app/core/security.py
Funciones: hash_password(plain), verify_password(plain, hashed), create_access_token(data, expires_delta), verify_token(token), get_current_user(token, db) como dependency.

### backend/app/models/
Un archivo por entidad mapeando las tablas de la BD:
- user.py → tabla users (schema users)
- account.py → tablas accounts, periods (schema accounting)
- journal.py → tablas journal_entries, journal_lines (schema accounting)
- invoice.py → tablas invoices, invoice_items (schema commerce)
- customer.py → tablas customers, vendors (schema commerce)
- product.py → tablas products, stock_movements (schema inventory)
- tax.py → tablas tax_config, ppm_payments, tax_results (schema taxes)

### backend/app/schemas/
Pydantic v2. Por cada entidad: clases Base, Create, Update, Response.

### backend/app/repositories/
CRUD con SQLAlchemy. Sin SQL dinámico concatenado. Un archivo por entidad.

### backend/app/main.py
```python
app = FastAPI(title="ERP Financiero API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], ...)
# incluir todos los routers bajo prefix="/api/v1"
# exception handler global que retorna:
# {"success": false, "error": {"code": "...", "message": "..."}}
# sin stacktrace en ningún caso
```

Cuando termines estos archivos avisa. No hagas aún los servicios ni los routers.
