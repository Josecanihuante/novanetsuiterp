# 📋 CONTEXT.md — ERP Financiero
> Este archivo es el contexto maestro del proyecto. Todos los agentes deben leerlo antes de ejecutar cualquier tarea.

---

## 🎯 Descripción del Proyecto

Sistema ERP Financiero web local con:
- **Balance Scorecard** con 34 métricas financieras en 6 perspectivas
- **4 Estados Financieros** con análisis vertical y horizontal
- **Importación Excel NetSuite Oracle**
- **Módulo contable completo** (asientos, facturas, clientes, inventario)
- **Cálculo PPM mensual** según legislación tributaria chilena (Art. 84 LIR)

---

## ⚙️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS + Recharts + Zustand |
| Backend | Python 3.12 + FastAPI + SQLAlchemy + Alembic + Pydantic v2 |
| Base de Datos | PostgreSQL 16 |
| Autenticación | JWT + OAuth2 (python-jose + passlib bcrypt) |
| Parser Excel | openpyxl |
| Tests Backend | pytest + httpx + pytest-asyncio |
| Tests Frontend | Vitest + React Testing Library + Playwright |
| Ejecución | App web local — Frontend: localhost:3000 / API: localhost:8000 |

---

## 📁 Estructura de Directorios

```
erp-financiero/
├── CONTEXT.md                  ← Este archivo
├── docker-compose.yml
├── README.md
├── docs/
│   └── ERP_Arquitectura_Maestro.docx
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/v1/
│   │   │   ├── auth.py
│   │   │   ├── accounts.py
│   │   │   ├── journal.py
│   │   │   ├── financial.py
│   │   │   ├── bsc.py
│   │   │   ├── invoices.py
│   │   │   ├── customers.py
│   │   │   ├── inventory.py
│   │   │   ├── import_netsuite.py
│   │   │   └── taxes.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── bsc_service.py
│   │   │   ├── financial_service.py
│   │   │   ├── ppm_service.py
│   │   │   └── netsuite_service.py
│   │   └── repositories/
│   ├── alembic/
│   ├── tests/
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/ui/
    │   ├── components/charts/
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── BSC.tsx
    │   │   ├── FinancialStatements.tsx
    │   │   ├── Journal.tsx
    │   │   ├── Invoices.tsx
    │   │   ├── Customers.tsx
    │   │   ├── Inventory.tsx
    │   │   ├── Import.tsx
    │   │   └── PPM.tsx
    │   ├── hooks/
    │   ├── services/
    │   ├── store/
    │   └── utils/
    ├── package.json
    └── vite.config.ts
```

---

## 🗄️ Modelo de Base de Datos

### Schemas PostgreSQL
- `accounting` → accounts, journal_entries, journal_lines, periods
- `financial` → financial_statements, fs_lines, bsc_snapshots
- `commerce` → invoices, invoice_items, customers, vendors
- `inventory` → products, stock_movements, warehouses
- `taxes` → ppm_payments, tax_config, tax_results
- `users` → users, roles, permissions

### Convenciones
- PKs: UUID v4 (`gen_random_uuid()`)
- Todas las tablas tienen: `id, created_at, updated_at, deleted_at`
- Soft delete obligatorio
- Nombres en snake_case, tablas en plural
- FK siempre con índice

---

## 📊 BSC — 34 Métricas Financieras

### Perspectiva 1: Rentabilidad (14 métricas)
| Métrica | Fórmula |
|---|---|
| Utilidad Bruta | Ingresos - Costo de Ventas |
| Margen Bruto | Utilidad Bruta / Ingresos × 100 |
| EBITDA | EBIT + Depreciación + Amortización |
| Margen EBITDA | EBITDA / Ingresos × 100 |
| EBIT | Utilidad Bruta - Gastos Operativos |
| Margen Operativo | EBIT / Ingresos × 100 |
| EBT | EBIT - Gastos Financieros |
| Utilidad Neta | EBT - Impuesto a la Renta |
| Margen Neto | Utilidad Neta / Ingresos × 100 |
| ROI | (Ganancia - Inversión) / Inversión × 100 |
| ROA | Utilidad Neta / Activos Totales × 100 |
| ROE | Utilidad Neta / Patrimonio × 100 |
| ROIC | NOPAT / Capital Invertido × 100 |
| Contribución Marginal | Ingresos - Costos Variables |

### Perspectiva 2: Liquidez y Capital de Trabajo (7 métricas)
| Métrica | Fórmula |
|---|---|
| Capital de Trabajo | Activo Corriente - Pasivo Corriente |
| Capital de Trabajo Óptimo | Definido por política interna |
| Razón Corriente | Activo Corriente / Pasivo Corriente |
| Prueba Ácida | (Activo Corriente - Inventario) / Pasivo Corriente |
| Solvencia Corto Plazo | Efectivo / Pasivo Corriente × 100 |
| Flujo de Caja Operativo | Del EFE — sección operaciones |
| Free Cash Flow | FCO - Capex |

### Perspectiva 3: Endeudamiento y Riesgo (7 métricas)
| Métrica | Fórmula |
|---|---|
| Estructura de Financiamiento | Deuda Total / (Deuda + Patrimonio) × 100 |
| Deuda / Patrimonio | Pasivo Total / Patrimonio |
| Deuda / Activos | Pasivo Total / Activo Total × 100 |
| Deuda / EBITDA | Deuda Financiera Neta / EBITDA |
| Cobertura de Intereses | EBIT / Gastos por Intereses |
| Leverage Financiero | Activo Total / Patrimonio |
| Z de Altman | 1.2×WC/A + 1.4×RE/A + 3.3×EBIT/A + 0.6×MktCap/L + 1.0×S/A |

### Perspectiva 4: Eficiencia Operativa (5 métricas)
| Métrica | Fórmula |
|---|---|
| Rotación de Activo Total | Ingresos / Activos Totales |
| Rotación de Capital de Trabajo | Ingresos / Capital de Trabajo |
| Ventas por Empleado | Ingresos / N° Empleados |
| Gasto Operativo sobre Ventas | Gastos Operativos / Ingresos × 100 |
| Gasto Operativo Promedio Diario | Gastos Operativos / Días del Período |

### Perspectiva 5: Gestión del Ciclo de Efectivo (4 métricas)
| Métrica | Fórmula |
|---|---|
| Días Rot. Cuentas por Cobrar | Cuentas por Cobrar / (Ingresos / 360) |
| Días Rot. Inventario | Inventario / (CMV / 360) |
| Días Rot. Proveedores | Cuentas por Pagar / (CMV / 360) |
| Días del Ciclo de Efectivo | Días CxC + Días Inventario - Días Proveedores |

### Perspectiva 6: Análisis Estratégico (5 métricas)
| Métrica | Fórmula |
|---|---|
| Punto de Equilibrio | Costos Fijos / Margen de Contribución Unitario |
| Cobertura del Punto de Equilibrio | Ventas Reales / Ventas en PE × 100 |
| ROI DuPont | Margen Neto × Rotación de Activos × Leverage |
| EVA | NOPAT - (WACC × Capital Invertido) |
| Crecimiento de Ventas | (Ventas Período - Ventas Anterior) / Ventas Anterior × 100 |

---

## 📑 Estados Financieros

| Estado | Análisis Vertical | Análisis Horizontal |
|---|---|---|
| Estado de Resultados | Sí (% sobre Ingresos) | Sí (vs período anterior) |
| Balance General | Sí (% sobre Activo Total) | Sí (variación abs. y %) |
| Estado de Flujos de Efectivo | No aplica | Sí (vs período anterior) |
| Estado de Origen y Aplicación de Fondos | No aplica | No aplica |

---

## 📥 Importación NetSuite Oracle

Columnas esperadas del Excel:
`Account | Account Name | Type | Date | Document Number | Name | Memo | Debit | Credit | Amount | Currency | Subsidiary | Department | Class`

Tipos NetSuite → Plan de Cuentas interno:
- `Income` → `income`
- `Expense` → `expense`
- `Asset` → `asset`
- `Liability` → `liability`
- `Equity` → `equity`

---

## 🇨🇱 PPM Chile — Art. 84 LIR

```
PPM del Mes = Ingresos Brutos del Mes × Tasa PPM

Tasa PPM:
- Sin historia tributaria: 1% (provisional SII)
- Régimen General: Impuesto 1ª Cat. año anterior / Ingresos Brutos año anterior
  → Si tasa calculada > 5%: se aplica tope del 5%
- Régimen Pro-Pyme (Art. 14 ter): tasa fija 0.25%
- Suspensión: evaluar pérdida tributaria acumulada (Art. 90 LIR)

Ingresos Brutos = Ventas + Servicios + Otros Ingresos del mes (sin IVA)
```

Output requerido:
- Monto PPM a pagar
- Detalle del cálculo paso a paso
- Histórico mensual del año tributario
- Resumen para F-29
- Proyección meses restantes
- Alerta de suspensión si corresponde

---

## 🔐 Seguridad

- JWT con refresh tokens (python-jose + passlib bcrypt cost factor 12)
- RBAC: roles `admin`, `contador`, `viewer`
- Secrets solo en `.env` — nunca en git
- SQLAlchemy ORM — nunca SQL dinámico concatenado
- CORS restringido a localhost:3000
- Excel upload: solo `.xlsx`, máximo 50MB

---

## 🌐 API REST — Prefijo `/api/v1/`

| Módulo | Endpoints |
|---|---|
| Auth | `/auth/login` `/auth/refresh` `/auth/logout` |
| BSC | `/bsc/metrics` `/bsc/snapshot` |
| Financiero | `/financial/income-statement` `/financial/balance-sheet` `/financial/cash-flow` `/financial/source-use` |
| Cuentas | `/accounts` `/accounts/{id}` `/accounts/tree` |
| Asientos | `/journal/entries` `/journal/entries/{id}` `/journal/entries/{id}/post` |
| Importación | `/import/netsuite/preview` `/import/netsuite/confirm` |
| Facturas | `/invoices` `/invoices/{id}` |
| Clientes | `/customers` `/customers/{id}` |
| Inventario | `/products` `/stock/movements` |
| PPM Chile | `/taxes/ppm/calculate` `/taxes/ppm/history` `/taxes/ppm/config` |

---

---

# 🤖 PROMPTS PARA AGENTES ANTIGRAVITY
> Copia y pega cada bloque en el chat de Antigravity en el orden indicado.
> Espera que cada agente termine antes de invocar al siguiente.

---

## PROMPT 1 — @experto-bases-datos

```
@experto-bases-datos

Lee el archivo CONTEXT.md en la raíz del proyecto. Con base en ese contexto ejecuta en orden:

1. Crea `docker-compose.yml` en la raíz con PostgreSQL 16 (puerto 5432, usuario: erp_user, contraseña: erp_pass, base: erp_db) y PgAdmin 4 (puerto 5050).

2. Crea `backend/alembic.ini` y `backend/alembic/env.py` configurados para conectar con la BD del docker-compose.

3. Crea las migraciones Alembic en `backend/alembic/versions/`:
   - V001: extensiones uuid-ossp y pgcrypto
   - V002: schema users + tabla users (id UUID PK, email UNIQUE, full_name, hashed_password, role CHECK IN admin/contador/viewer, is_active, created_at, updated_at, deleted_at)
   - V003: schema accounting + tablas periods, accounts (con columna netsuite_category para mapeo NetSuite), journal_entries (source CHECK IN manual/invoice/import_netsuite/system), journal_lines
   - V004: schema commerce + tablas customers, vendors, invoices (type CHECK IN sale/purchase/credit_note/debit_note), invoice_items
   - V005: schema inventory + tablas products (valuation_method CHECK IN PEPS/PP), stock_movements
   - V006: schema taxes + tablas tax_config (tax_regime CHECK IN general/pro_pyme/presunta), ppm_payments, tax_results
   - V007: schema financial + tabla bsc_snapshots

4. En cada migración incluye:
   - Trigger updated_at automático en todas las tablas
   - Índices en todas las FK y columnas de búsqueda frecuente
   - Comentario con el SQL de rollback (DOWN)
   - Constraint UNIQUE en: accounts.code, invoices.invoice_number, products.sku, (ppm_payments.period_month + period_year)

Usa UUID como PK en todas las tablas. NOT NULL en todos los campos obligatorios. ON DELETE RESTRICT en todas las FK por defecto.
```

---

## PROMPT 2 — @developer-backend

```
@developer-backend

Lee el archivo CONTEXT.md en la raíz del proyecto. Las migraciones ya existen en backend/alembic/. Construye el backend FastAPI completo:

1. Crea `backend/requirements.txt` con: fastapi, uvicorn[standard], sqlalchemy, alembic, psycopg2-binary, pydantic[email], pydantic-settings, python-jose[cryptography], passlib[bcrypt], openpyxl, python-multipart, pytest, httpx, pytest-asyncio

2. Crea `backend/.env.example`: DATABASE_URL, SECRET_KEY, ALGORITHM=HS256, ACCESS_TOKEN_EXPIRE_MINUTES=480, REFRESH_TOKEN_EXPIRE_DAYS=7

3. Crea `backend/app/core/`: config.py (Settings con pydantic-settings), database.py (engine + SessionLocal + get_db dependency), security.py (hash_password, verify_password, create_access_token, verify_token, get_current_user)

4. Crea los modelos SQLAlchemy en `backend/app/models/` mapeando exactamente las tablas de las migraciones.

5. Crea schemas Pydantic v2 en `backend/app/schemas/` con clases Base/Create/Update/Response por entidad.

6. Crea repositorios en `backend/app/repositories/` con CRUD usando SQLAlchemy (sin SQL dinámico).

7. Crea los servicios:

   `bsc_service.py`: Implementa función para cada una de las 34 métricas del CONTEXT.md. Cada función recibe un dict con los datos del período y retorna el valor numérico o None si no se puede calcular (división por cero, datos faltantes). Agrupa las métricas en las 6 perspectivas.

   `financial_service.py`: Genera los 4 estados financieros desde journal_lines agrupados por account.type y subtype. Estado de Resultados con análisis vertical (cada línea / ingresos_netos × 100) y horizontal (variación abs. y % vs período anterior). Balance General con análisis vertical (cada línea / activo_total × 100) y horizontal. EFE con análisis horizontal. EOAF sin análisis adicional.

   `ppm_service.py`: Calcula PPM según Art. 84 LIR. Soporta los 3 regímenes (general, pro_pyme, presunta). Para régimen general: tasa = impuesto_1cat_año_anterior / ingresos_brutos_año_anterior, con tope 5%. Para pro_pyme: tasa fija 0.25%. Sin historia: tasa 1%. Evalúa suspensión por pérdida acumulada (Art. 90). Genera proyección de meses restantes. Genera resumen F-29.

   `netsuite_service.py`: Parsea Excel con openpyxl. Valida columnas requeridas (Account, Account Name, Type, Date, Document Number, Name, Memo, Debit, Credit, Amount, Currency, Subsidiary, Department, Class). Mapea Type de NetSuite al tipo de cuenta interno. Convierte Date de MM/DD/YYYY a date de Python. Retorna {valid_rows: [...], errors: [{row: N, column: X, message: Y}]} para el preview. En la confirmación, inserta los asientos en journal_entries y journal_lines.

8. Crea routers en `backend/app/api/v1/` con todos los endpoints del CONTEXT.md. JWT obligatorio en todos excepto /auth/login. RBAC: admin puede todo, contador puede crear/editar, viewer solo GET.

9. Crea `backend/app/main.py` con CORS restringido a localhost:3000, todos los routers incluidos, manejo global de errores que retorna {success: false, error: {code, message}} sin stacktrace.

10. Crea los tests en `backend/tests/`:
    - `test_bsc_service.py`: test por cada métrica con valores conocidos + test de división por cero
    - `test_ppm_service.py`: test por cada régimen + tope 5% + suspensión
    - `test_financial_service.py`: test de consistencia (Activos = Pasivos + Patrimonio)
    - `test_netsuite_service.py`: test con fixtures de Excel válido e inválido
```

---

## PROMPT 3 — @developer-frontend

```
@developer-frontend

Lee el archivo CONTEXT.md en la raíz del proyecto. El backend ya está construido. Construye el frontend React completo con diseño profesional financiero.

Paleta de colores del sistema de diseño:
- primary: #1E3A5F (azul marino — titulos, sidebar, headers)
- secondary: #2E86AB (azul medio — acciones secundarias)
- success: #27AE60 (verde — valores positivos, métricas en rango)
- danger: #E74C3C (rojo — valores negativos, alertas críticas)
- warning: #E67E22 (naranja — métricas en zona de alerta)
- surface: #F8FAFC (fondo general)
- card: #FFFFFF (fondo de tarjetas)

1. Inicializa con Vite + React 18 + TypeScript. Instala: tailwindcss, axios, zustand, recharts, react-router-dom v6, react-hook-form, @hookform/resolvers, zod, @tanstack/react-query, lucide-react, date-fns, xlsx.

2. Crea los componentes base en `src/components/ui/`:
   - Button, Input, Select, DatePicker (con labels accesibles y aria-describedby para errores)
   - Card, Badge, Modal, Tooltip
   - KPICard: muestra nombre, valor formateado, unidad, variación % con flecha y color (verde positivo / rojo negativo), semáforo lateral (verde/amarillo/rojo según rangos)
   - DataTable: columnas configurables, sort, búsqueda, paginación, export CSV
   - FinancialTable: filas con indent para jerarquía, columnas fijas Concepto + Monto + % Vertical + Δ Horizontal + Δ% Horizontal, totales en negrita
   - Skeleton, FileDropzone, ProgressBar

3. Crea `src/components/charts/`:
   - LineChartWrapper (evolución temporal de métricas)
   - BarChartWrapper (comparativos de períodos)
   - GaugeChart (métricas con rango óptimo, usando Recharts RadialBarChart)
   - WaterfallChart (para visualizar el Estado de Resultados en cascada)

4. Crea el Layout principal con Sidebar fijo a la izquierda (ancho 260px) con navegación:
   Dashboard | Balance Scorecard (6 sub-items) | Estados Financieros (4 sub-items) | Contabilidad | Facturación | Clientes | Inventario | Importar NetSuite | PPM Chile | Configuración
   Header superior con: nombre de empresa, período seleccionado, usuario logueado, botón logout.

5. Crea las páginas:

   `Dashboard.tsx`: 8 KPICards en grid 4×2 (Ingresos, Margen Neto, EBITDA, Razón Corriente, Deuda/EBITDA, FCO, Crecimiento Ventas, EVA). Bajo los KPIs: gráfico de línea con ingresos y utilidad neta de los últimos 12 meses. Selector de período mes/año en el header.

   `BSC.tsx`: Tabs con las 6 perspectivas. En cada tab: grid de KPICards para las métricas de esa perspectiva. Al hacer clic en un KPICard abre un panel lateral (drawer) con el detalle: fórmula, evolución histórica en LineChart, y la tabla de los últimos 12 valores mensuales.

   `FinancialStatements.tsx`: 4 tabs (ER, BG, EFE, EOAF). Selector de período y período de comparación. Toggle "Ver análisis vertical" y "Ver análisis horizontal". Usa FinancialTable con la jerarquía de cuentas. En el ER incluye WaterfallChart visual. Botón exportar a Excel.

   `Journal.tsx`: DataTable de asientos con columnas: número, fecha, glosa, estado (borrador/contabilizado), total débito, total crédito. Formulario de nuevo asiento: líneas dinámicas con selector de cuenta, débito/crédito, descripción. Indicador en tiempo real de balance (diferencia débito-crédito, debe ser 0 para guardar). Botón "Contabilizar" cambia estado a posted.

   `Invoices.tsx`: DataTable de facturas. Formulario: seleccionar cliente, fecha, vencimiento, líneas de productos (SKU + descripción + cantidad + precio + descuento + subtotal). Cálculo automático de subtotal, IVA 19%, total. Preview antes de emitir. Estado: borrador / emitida / pagada / anulada.

   `Customers.tsx`: DataTable de clientes con RUT, nombre, email, condición de pago, crédito disponible. Formulario de creación/edición. Ficha de cliente con tab de historial de facturas y saldo pendiente.

   `Inventory.tsx`: DataTable de productos con SKU, nombre, stock actual, costo, precio venta, punto de reorden. Alerta visual (Badge rojo) si stock < punto de reorden. Gráfico de movimientos de stock para el producto seleccionado.

   `Import.tsx`: FileDropzone para .xlsx. Al cargar: muestra preview de primeras 20 filas con columnas mapeadas a las del sistema. Tabla de errores de validación (fila, columna, motivo). Si hay errores críticos: botón "Confirmar" deshabilitado con tooltip explicativo. Si no hay errores: botón "Confirmar importación" activo con ProgressBar durante el proceso. Resultado: resumen de asientos importados.

   `PPM.tsx`: Selector de mes y año tributario. Panel de configuración: régimen tributario (general/pro_pyme/presunta), tasa PPM, RUT empresa. Cálculo en tiempo real que muestra: base imponible (ingresos del mes), tasa aplicada, monto PPM destacado en grande con color azul marino. Tabla de detalle del cálculo paso a paso. Tabla histórica del año con columnas: mes, ingresos, tasa, PPM calculado, estado (pagado/pendiente), acumulado. BarChart de PPM mensual. Alerta roja prominente si corresponde evaluar suspensión (Art. 90). Botón "Exportar resumen F-29".

6. Crea `src/services/api.ts`: cliente axios con baseURL http://localhost:8000/api/v1, interceptor que adjunta Authorization Bearer desde Zustand store, interceptor de respuesta que en 401 limpia el token y redirige a /login.

7. Crea los hooks con React Query en `src/hooks/`: useBSCMetrics, useFinancialStatement, usePPMCalculation, useJournalEntries, useInvoices, useCustomers, useProducts. Cada hook maneja loading, error y data.

8. Crea `src/store/authStore.ts` con Zustand: token, user, login(), logout().

9. Crea la página de Login con formulario (email + contraseña), validación con zod, manejo de error 401 con mensaje "Credenciales incorrectas", redirección al Dashboard tras login exitoso.

10. Garantiza accesibilidad: todos los inputs con label, contraste mínimo 4.5:1, focus-visible en todos los elementos interactivos, aria-live para actualizaciones de datos, tamaño mínimo 44×44px en botones.
```

---

## PROMPT 4 — @quality-assurance

```
@quality-assurance

Lee el archivo CONTEXT.md en la raíz del proyecto. El sistema ya está construido. Ejecuta la auditoría de calidad completa:

1. Verifica que `backend/tests/test_bsc_service.py` tiene tests para las 34 métricas. Por cada métrica que falte, créala con:
   - Valores numéricos conocidos que verifican el resultado exacto
   - Test de denominador = 0 (debe retornar None, nunca ZeroDivisionError)
   - Test con valores negativos donde la fórmula lo permite

2. Verifica `backend/tests/test_financial_service.py` incluye:
   - Test de ecuación contable: suma(activos) == suma(pasivos) + suma(patrimonio)
   - Test de análisis vertical: cada línea del ER / ingresos_netos da el porcentaje correcto
   - Test de análisis horizontal: variación absoluta y % calculados correctamente

3. Verifica `backend/tests/test_ppm_service.py` cubre:
   - Régimen general con tasa < 5%: resultado correcto
   - Régimen general con tasa calculada > 5%: aplica tope del 5%
   - Régimen pro_pyme: usa exactamente 0.25%
   - Sin historia (primera vez): usa 1%
   - Con pérdida tributaria acumulada: retorna is_suspended=True

4. Crea `backend/tests/test_netsuite_service.py` con fixture de Excel en memoria (openpyxl) que incluya 5 filas válidas, 1 con Amount no numérico, 1 con Date en formato incorrecto. Verifica: 5 entradas válidas y 2 errores en el resultado del preview.

5. Crea `frontend/src/utils/formatters.test.ts`:
   - formatCLP(1234567) → "$ 1.234.567" (separador de miles con punto, sin decimales)
   - formatPercent(0.1234) → "12.34%"
   - formatRatio(2.5) → "2.50x"
   - getVariationColor(positive) → 'success', getVariationColor(negative) → 'danger'

6. Crea `frontend/e2e/auth.spec.ts`: login exitoso redirige al dashboard; login con credenciales incorrectas muestra mensaje de error; logout limpia la sesión.

7. Crea `frontend/e2e/bsc.spec.ts`: login → navegar a BSC → verificar 6 tabs presentes → cambiar de tab → verificar que KPICards muestran valores → cambiar período.

8. Crea `frontend/e2e/ppm.spec.ts`: login → navegar a PPM → seleccionar mes/año → verificar que aparece monto calculado → verificar tabla histórica.

9. Crea `frontend/e2e/import.spec.ts`: login → navegar a Importar → cargar Excel de prueba → verificar preview → verificar tabla de errores → confirmar importación.

10. Genera `docs/QA_Report.md` con: cobertura de tests por módulo, lista de todos los casos creados, issues encontrados con severidad (Crítico/Alto/Medio/Bajo), recomendación Go/No-Go para primer release.

Verifica además que ningún endpoint retorna stacktrace en producción: los errores deben ser {"success": false, "error": {"code": "...", "message": "..."}}.
```

---

## PROMPT 5 — @arquitecto-software
> Ejecutar al final como revisión de cierre.

```
@arquitecto-software

Lee el archivo CONTEXT.md en la raíz del proyecto. El sistema fue construido por los demás agentes. Ejecuta la revisión de arquitectura de cierre:

1. Ejecuta /review-arquitectura sobre la estructura completa del proyecto.

2. Verifica separación de capas en backend:
   - Routers: solo reciben request, validan con Pydantic, llaman a servicios, retornan response
   - Servicios: contienen toda la lógica de negocio, llaman a repositorios
   - Repositorios: solo acceden a la BD, no contienen lógica de negocio

3. Verifica ausencia de acoplamientos incorrectos entre módulos:
   - bsc_service.py no importa desde invoice o inventory directamente
   - ppm_service.py no importa desde commerce directamente
   - Toda comunicación entre módulos es a través de la BD o servicios compartidos

4. Crea `docs/ADR-001-stack.md`, `docs/ADR-002-database.md`, `docs/ADR-003-migrations.md` en formato estándar ADR.

5. Crea `docs/ARCHITECTURE.md` con diagrama C4 en Mermaid que refleje la arquitectura real construida.

6. Crea `docs/TECH_DEBT.md` con cualquier deuda técnica identificada: ítem, impacto, sprint recomendado para resolverlo.

7. Verifica que `README.md` en la raíz tiene instrucciones completas de setup: requisitos previos (Docker, Node, Python), clonar repo, docker-compose up, configurar .env, alembic upgrade head, correr backend y frontend, acceso a la app.

8. Genera reporte final de arquitectura con recomendación Go/No-Go técnica para el primer release.
```

---

## ⚡ Orden de Ejecución

```
PROMPT 1        PROMPT 2        PROMPT 3        PROMPT 4        PROMPT 5
   BD         →  Backend      →  Frontend     →     QA        →  Arquitecto
Migraciones      FastAPI          React SPA       Tests suite    Revisión final
Docker           34 métricas      BSC UI          QA Report      ADRs + README
Schema           PPM Chile        PPM UI          Go/No-Go       Go/No-Go técnico
                 NetSuite         Import UI
```

> **Tip de Antigravity:** Puedes abrir múltiples ventanas de agente en paralelo. El Prompt 1 y Prompt 2 pueden correr en paralelo si el agente BD ya generó las migraciones. El Prompt 3 puede correr en paralelo con el Prompt 2 desde que exista la especificación de la API.
