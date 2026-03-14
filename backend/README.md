# ERP Financiero — Base de Datos

## Stack
- **PostgreSQL 16** vía Docker
- **Alembic** para migraciones versionadas
- **SQLAlchemy** como ORM

---

## Levantar la base de datos

```bash
# Desde la raíz del proyecto (erp-financiero/)
docker-compose up -d

# Verificar que PostgreSQL está listo
docker-compose ps
```

**Acceso PgAdmin:** http://localhost:5050  
- Email: `admin@erp.local`  
- Password: `admin123`

**Conexión directa:** `postgresql://erp_user:erp_pass@localhost:5432/erp_db`

---

## Ejecutar migraciones

```bash
cd backend

# Crear .env desde el ejemplo
cp .env.example .env

# Instalar dependencias
pip install -r requirements.txt

# Aplicar todas las migraciones
alembic upgrade head

# Ver el estado actual
alembic current

# Revertir la última migración
alembic downgrade -1
```

---

## Esquemas de la base de datos

| Schema | Propósito |
|---|---|
| `users` | Autenticación y roles |
| `accounting` | Períodos, plan de cuentas, asientos contables |
| `commerce` | Clientes, proveedores, facturas |
| `inventory` | Productos, stock, movimientos |
| `taxes` | Configuración PPM, pagos, resultados tributarios |
| `financial` | Snapshots del BSC (34 métricas) |

---

## Convenciones

- **PK:** UUID con `gen_random_uuid()`
- **Todas las tablas:** `id, created_at, updated_at, deleted_at`
- **Soft delete:** via `deleted_at` nullable
- **Trigger `updated_at`:** automático en cada tabla
- **Nombres:** `snake_case`, tablas en plural
- **FK:** siempre con índice explícito

---

## Migraciones disponibles

| Versión | Descripción |
|---|---|
| V001 | Extensiones `uuid-ossp` y `pgcrypto` |
| V002 | Schema `users` — tabla users |
| V003 | Schema `accounting` — periods, accounts, journal_entries, journal_lines |
| V004 | Schema `commerce` — customers, vendors, invoices, invoice_items |
| V005 | Schema `inventory` — products, stock_movements |
| V006 | Schema `taxes` — tax_config, ppm_payments, tax_results |
| V007 | Schema `financial` — bsc_snapshots |
