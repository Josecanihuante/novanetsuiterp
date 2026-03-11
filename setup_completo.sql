-- ============================================================
-- ERP FINANCIERO — SETUP COMPLETO + SEED DATA
-- Crea schemas, tablas y carga datos de Innova Consulting Group
-- Ejecutar: docker exec -it erp_postgres psql -U erp_user -d erp_db -f /setup_completo.sql
-- ============================================================

-- ── SCHEMAS ──────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS accounting;
CREATE SCHEMA IF NOT EXISTS commerce;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS financial;
CREATE SCHEMA IF NOT EXISTS taxes;

-- ── EXTENSIONES ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── TABLAS ───────────────────────────────────────────────────

-- users.users
CREATE TABLE IF NOT EXISTS users.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    hashed_password TEXT NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'viewer'
                    CHECK (role IN ('admin','contador','viewer')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- accounting.periods
CREATE TABLE IF NOT EXISTS accounting.periods (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    is_closed   BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- accounting.accounts
CREATE TABLE IF NOT EXISTS accounting.accounts (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code               VARCHAR(20) UNIQUE NOT NULL,
    name               VARCHAR(255) NOT NULL,
    type               VARCHAR(50) NOT NULL
                       CHECK (type IN ('asset','liability','equity','income','expense')),
    subtype            VARCHAR(100),
    netsuite_category  VARCHAR(100),
    is_active          BOOLEAN NOT NULL DEFAULT true,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- accounting.journal_entries
CREATE TABLE IF NOT EXISTS accounting.journal_entries (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number  VARCHAR(50) UNIQUE NOT NULL,
    entry_date    DATE NOT NULL,
    description   TEXT,
    source        VARCHAR(50) DEFAULT 'manual',
    period_id     UUID REFERENCES accounting.periods(id),
    is_posted     BOOLEAN NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- accounting.journal_lines
CREATE TABLE IF NOT EXISTS accounting.journal_lines (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES accounting.journal_entries(id) ON DELETE CASCADE,
    account_id       UUID NOT NULL REFERENCES accounting.accounts(id),
    debit            NUMERIC(18,2) NOT NULL DEFAULT 0,
    credit           NUMERIC(18,2) NOT NULL DEFAULT 0,
    description      TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- commerce.customers
CREATE TABLE IF NOT EXISTS commerce.customers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut           VARCHAR(20) UNIQUE NOT NULL,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255),
    phone         VARCHAR(50),
    address       TEXT,
    payment_days  INT DEFAULT 30,
    credit_limit  NUMERIC(18,2) DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- commerce.vendors
CREATE TABLE IF NOT EXISTS commerce.vendors (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut           VARCHAR(20) UNIQUE NOT NULL,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255),
    phone         VARCHAR(50),
    address       TEXT,
    payment_days  INT DEFAULT 30,
    credit_limit  NUMERIC(18,2) DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- commerce.invoices
CREATE TABLE IF NOT EXISTS commerce.invoices (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    type           VARCHAR(30) NOT NULL DEFAULT 'sale'
                   CHECK (type IN ('sale','purchase','credit_note','debit_note')),
    invoice_date   DATE NOT NULL,
    due_date       DATE,
    customer_id    UUID REFERENCES commerce.customers(id),
    vendor_id      UUID REFERENCES commerce.vendors(id),
    subtotal       NUMERIC(18,2) NOT NULL DEFAULT 0,
    tax_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
    total          NUMERIC(18,2) NOT NULL DEFAULT 0,
    status         VARCHAR(30) NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','issued','paid','cancelled','overdue')),
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- commerce.invoice_items
CREATE TABLE IF NOT EXISTS commerce.invoice_items (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id     UUID NOT NULL REFERENCES commerce.invoices(id) ON DELETE CASCADE,
    product_id     UUID,
    description    TEXT,
    quantity       NUMERIC(18,4) NOT NULL DEFAULT 1,
    unit_price     NUMERIC(18,2) NOT NULL DEFAULT 0,
    discount       NUMERIC(5,2) NOT NULL DEFAULT 0,
    subtotal       NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- inventory.products
CREATE TABLE IF NOT EXISTS inventory.products (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku               VARCHAR(50) UNIQUE NOT NULL,
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    category          VARCHAR(100),
    unit_cost         NUMERIC(18,2) NOT NULL DEFAULT 0,
    sale_price        NUMERIC(18,2) NOT NULL DEFAULT 0,
    stock_quantity    NUMERIC(18,4) NOT NULL DEFAULT 0,
    reorder_point     NUMERIC(18,4) NOT NULL DEFAULT 0,
    valuation_method  VARCHAR(20) DEFAULT 'PP'
                      CHECK (valuation_method IN ('PP','PEPS','UEPS')),
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- inventory.stock_movements
CREATE TABLE IF NOT EXISTS inventory.stock_movements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL REFERENCES inventory.products(id),
    movement_type   VARCHAR(20) NOT NULL CHECK (movement_type IN ('in','out','adjustment')),
    quantity        NUMERIC(18,4) NOT NULL,
    unit_cost       NUMERIC(18,2),
    reference       VARCHAR(100),
    movement_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- taxes.tax_config
CREATE TABLE IF NOT EXISTS taxes.tax_config (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_rut   VARCHAR(20) NOT NULL,
    company_name  VARCHAR(255) NOT NULL,
    tax_regime    VARCHAR(30) NOT NULL DEFAULT 'general'
                  CHECK (tax_regime IN ('general','pro_pyme','micro_empresa')),
    ppm_rate      NUMERIC(8,6) NOT NULL DEFAULT 0.025,
    tax_year      INT NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- taxes.tax_results
CREATE TABLE IF NOT EXISTS taxes.tax_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_year            INT NOT NULL,
    gross_income        NUMERIC(18,2) NOT NULL DEFAULT 0,
    net_income          NUMERIC(18,2) NOT NULL DEFAULT 0,
    tax_base            NUMERIC(18,2) NOT NULL DEFAULT 0,
    first_category_tax  NUMERIC(18,2) NOT NULL DEFAULT 0,
    accumulated_loss    NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- taxes.ppm_payments
CREATE TABLE IF NOT EXISTS taxes.ppm_payments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_month   INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year    INT NOT NULL,
    gross_income   NUMERIC(18,2) NOT NULL DEFAULT 0,
    ppm_rate       NUMERIC(8,6) NOT NULL DEFAULT 0,
    ppm_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
    is_suspended   BOOLEAN NOT NULL DEFAULT false,
    paid_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (period_month, period_year)
);

-- financial.bsc_snapshots
CREATE TABLE IF NOT EXISTS financial.bsc_snapshots (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id      UUID REFERENCES accounting.periods(id),
    snapshot_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    metrics        JSONB NOT NULL DEFAULT '{}',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ÍNDICES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_journal_entries_period ON accounting.journal_entries(period_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry   ON accounting.journal_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON accounting.journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer     ON commerce.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date         ON commerce.invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status       ON commerce.invoices(status);
CREATE INDEX IF NOT EXISTS idx_stock_product         ON inventory.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_ppm_period            ON taxes.ppm_payments(period_year, period_month);

-- ============================================================
-- SEED DATA — INNOVA CONSULTING GROUP SpA
-- ============================================================

-- ── USUARIOS (contraseña: Consul2025!) ───────────────────────
-- Hash bcrypt generado con passlib cost=12
-- Si el login falla, ver instrucciones al final del archivo

TRUNCATE users.users CASCADE;

INSERT INTO users.users (id, email, full_name, hashed_password, role) VALUES

-- ADMIN (4)
('00000001-0000-0000-0000-000000000001','ceo@innovaconsulting.cl',
 'Rodrigo Alvarado — CEO / Socio Director',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW','admin'),

('00000001-0000-0000-0000-000000000002','cfo@innovaconsulting.cl',
 'Marcela Ibáñez — CFO / Directora Financiera',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW','admin'),

('00000001-0000-0000-0000-000000000003','socio.ops@innovaconsulting.cl',
 'Fernando Castillo — Socio de Operaciones',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW','admin'),

('00000001-0000-0000-0000-000000000004','control.gestion@innovaconsulting.cl',
 'Roberto Figueroa — Control de Gestión',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW','admin'),

-- CONTADOR (4)
('00000001-0000-0000-0000-000000000005','contador.jefe@innovaconsulting.cl',
 'Patricia Morales — Contadora Jefe',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW','contador'),

('00000001-0000-0000-0000-000000000006','contador.junior@innovaconsulting.cl',
 'Diego Núñez — Contador Junior',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW','contador'),

('00000001-0000-0000-0000-000000000007','tesoreria@innovaconsulting.cl',
 'Camila Vargas — Tesorería',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW','contador'),

('00000001-0000-0000-0000-000000000008','admin.comercial@innovaconsulting.cl',
 'Javiera Reyes — Administración Comercial',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW','contador'),

-- VIEWER (7)
('00000001-0000-0000-0000-000000000009','gerente.digital@innovaconsulting.cl',
 'Andrea Soto — Gerente Área Digital',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW','viewer'),

('00000001-0000-0000-0000-000000000010','gerente.estrategia@innovaconsulting.cl',
 'Tomás Herrera — Gerente Estrategia',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW','viewer'),

('00000001-0000-0000-0000-000000000011','gerente.rrhh@innovaconsulting.cl',
 'Valentina Pizarro — Gerente RRHH',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW','viewer'),

('00000001-0000-0000-0000-000000000012','consultor.sr1@innovaconsulting.cl',
 'Sebastián Muñoz — Consultor Senior Digital',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW','viewer'),

('00000001-0000-0000-0000-000000000013','consultor.sr2@innovaconsulting.cl',
 'Daniela Ramos — Consultora Senior Estrategia',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW','viewer'),

('00000001-0000-0000-0000-000000000014','consultor.sr3@innovaconsulting.cl',
 'Nicolás Espinoza — Consultor Senior Finanzas',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW','viewer'),

('00000001-0000-0000-0000-000000000015','auditor@pwc-chile.cl',
 'Isabel Contreras — Auditora PwC Chile',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW','viewer');

-- ── PERÍODOS ─────────────────────────────────────────────────
INSERT INTO accounting.periods (id, name, start_date, end_date, is_closed) VALUES
('00000002-0000-0000-0000-000000000001','Enero 2025',     '2025-01-01','2025-01-31',true),
('00000002-0000-0000-0000-000000000002','Febrero 2025',   '2025-02-01','2025-02-28',true),
('00000002-0000-0000-0000-000000000003','Marzo 2025',     '2025-03-01','2025-03-31',true),
('00000002-0000-0000-0000-000000000004','Abril 2025',     '2025-04-01','2025-04-30',true),
('00000002-0000-0000-0000-000000000005','Mayo 2025',      '2025-05-01','2025-05-31',true),
('00000002-0000-0000-0000-000000000006','Junio 2025',     '2025-06-01','2025-06-30',true),
('00000002-0000-0000-0000-000000000007','Julio 2025',     '2025-07-01','2025-07-31',true),
('00000002-0000-0000-0000-000000000008','Agosto 2025',    '2025-08-01','2025-08-31',true),
('00000002-0000-0000-0000-000000000009','Septiembre 2025','2025-09-01','2025-09-30',true),
('00000002-0000-0000-0000-000000000010','Octubre 2025',   '2025-10-01','2025-10-31',true),
('00000002-0000-0000-0000-000000000011','Noviembre 2025', '2025-11-01','2025-11-30',false),
('00000002-0000-0000-0000-000000000012','Diciembre 2025', '2025-12-01','2025-12-31',false);

-- ── PLAN DE CUENTAS ───────────────────────────────────────────
INSERT INTO accounting.accounts (id, code, name, type, subtype, netsuite_category) VALUES
('00000003-0000-0000-0000-000000000001','1-1-001','Caja y Bancos (BCI Cta Cte)',           'asset',    'current_asset',        'Asset'),
('00000003-0000-0000-0000-000000000002','1-1-002','Cuentas por Cobrar Clientes',            'asset',    'current_asset',        'Asset'),
('00000003-0000-0000-0000-000000000003','1-1-003','Honorarios por Cobrar',                  'asset',    'current_asset',        'Asset'),
('00000003-0000-0000-0000-000000000004','1-1-004','IVA Crédito Fiscal',                     'asset',    'current_asset',        'Asset'),
('00000003-0000-0000-0000-000000000005','1-1-005','PPM Pagado Anticipado',                  'asset',    'current_asset',        'Asset'),
('00000003-0000-0000-0000-000000000006','1-1-006','Gastos Anticipados',                     'asset',    'current_asset',        'Asset'),
('00000003-0000-0000-0000-000000000010','1-2-001','Equipos Computación',                    'asset',    'fixed_asset',          'Asset'),
('00000003-0000-0000-0000-000000000011','1-2-002','Mobiliario y Equipo Oficina',            'asset',    'fixed_asset',          'Asset'),
('00000003-0000-0000-0000-000000000012','1-2-003','Software y Licencias',                   'asset',    'fixed_asset',          'Asset'),
('00000003-0000-0000-0000-000000000013','1-2-099','Depreciación Acumulada',                 'asset',    'fixed_asset',          'Asset'),
('00000003-0000-0000-0000-000000000020','2-1-001','Cuentas por Pagar Proveedores',          'liability','current_liability',    'Liability'),
('00000003-0000-0000-0000-000000000021','2-1-002','IVA Débito Fiscal',                      'liability','current_liability',    'Liability'),
('00000003-0000-0000-0000-000000000022','2-1-003','PPM por Pagar (SII)',                    'liability','current_liability',    'Liability'),
('00000003-0000-0000-0000-000000000023','2-1-004','Remuneraciones por Pagar',               'liability','current_liability',    'Liability'),
('00000003-0000-0000-0000-000000000024','2-1-005','Provisión Vacaciones',                   'liability','current_liability',    'Liability'),
('00000003-0000-0000-0000-000000000025','2-1-006','Retenciones Honorarios (10%)',           'liability','current_liability',    'Liability'),
('00000003-0000-0000-0000-000000000030','2-2-001','Préstamo Bancario LP (BCI)',             'liability','long_term_liability',  'Liability'),
('00000003-0000-0000-0000-000000000040','3-1-001','Capital Pagado',                         'equity',   'capital',              'Equity'),
('00000003-0000-0000-0000-000000000041','3-1-002','Utilidades Acumuladas Ejercicios Ant.',  'equity',   'retained_earnings',    'Equity'),
('00000003-0000-0000-0000-000000000042','3-1-003','Utilidad del Ejercicio',                 'equity',   'net_income',           'Equity'),
('00000003-0000-0000-0000-000000000050','4-1-001','Honorarios Consultoría Estratégica',     'income',   'operating_income',     'Income'),
('00000003-0000-0000-0000-000000000051','4-1-002','Honorarios Consultoría Digital',         'income',   'operating_income',     'Income'),
('00000003-0000-0000-0000-000000000052','4-1-003','Honorarios Capacitación y Talleres',     'income',   'operating_income',     'Income'),
('00000003-0000-0000-0000-000000000053','4-1-004','Servicios Outsourcing CFO',              'income',   'operating_income',     'Income'),
('00000003-0000-0000-0000-000000000054','4-2-001','Otros Ingresos No Operacionales',        'income',   'other_income',         'Income'),
('00000003-0000-0000-0000-000000000060','5-1-001','Honorarios Consultores Externos',        'expense',  'cost_of_goods',        'Expense'),
('00000003-0000-0000-0000-000000000061','5-1-002','Viáticos y Gastos de Terreno',           'expense',  'cost_of_goods',        'Expense'),
('00000003-0000-0000-0000-000000000062','5-1-003','Software y Herramientas de Proyecto',    'expense',  'cost_of_goods',        'Expense'),
('00000003-0000-0000-0000-000000000070','6-1-001','Remuneraciones Planta',                  'expense',  'operating_expense',    'Expense'),
('00000003-0000-0000-0000-000000000071','6-1-002','Arriendo Oficinas (Providencia)',        'expense',  'operating_expense',    'Expense'),
('00000003-0000-0000-0000-000000000072','6-1-003','Servicios Básicos y Telecom',            'expense',  'operating_expense',    'Expense'),
('00000003-0000-0000-0000-000000000073','6-1-004','Marketing y Desarrollo Negocios',        'expense',  'operating_expense',    'Expense'),
('00000003-0000-0000-0000-000000000074','6-1-005','Seguros y Garantías',                    'expense',  'operating_expense',    'Expense'),
('00000003-0000-0000-0000-000000000075','6-1-006','Depreciación del Ejercicio',             'expense',  'operating_expense',    'Expense'),
('00000003-0000-0000-0000-000000000076','6-1-007','Capacitación y Desarrollo Equipo',       'expense',  'operating_expense',    'Expense'),
('00000003-0000-0000-0000-000000000080','6-2-001','Gastos Financieros (Intereses)',         'expense',  'financial_expense',    'Expense'),
('00000003-0000-0000-0000-000000000081','6-3-001','Impuesto a la Renta 1ª Categoría',      'expense',  'tax_expense',          'Expense');

-- ── CLIENTES ─────────────────────────────────────────────────
INSERT INTO commerce.customers (id, rut, name, email, phone, address, payment_days, credit_limit) VALUES
('00000004-0000-0000-0000-000000000001','76.100.200-3','Grupo Empresas Falabella S.A.',  'proveedores@falabella.cl', '+56 2 2380 2000','Av. El Conquistador del Monte 925, Huechuraba',30, 80000000),
('00000004-0000-0000-0000-000000000002','76.200.300-4','Banco Bice S.A.',                'adq.servicios@bice.cl',   '+56 2 2692 2000','Teatinos 220, Santiago Centro',               30, 60000000),
('00000004-0000-0000-0000-000000000003','76.300.400-5','Clínica Bupa Santa María',       'compras@bupachile.cl',    '+56 2 2461 2000','Av. Santa María 0500, Providencia',           45, 40000000),
('00000004-0000-0000-0000-000000000004','76.400.500-6','Viña Concha y Toro S.A.',        'finanzas@conchaytoro.cl', '+56 2 2476 5000','Av. Nueva Tajamar 481, Las Condes',           30, 35000000),
('00000004-0000-0000-0000-000000000005','76.500.600-7','CMPC Tissue S.A.',               'pagos@cmpc.cl',           '+56 2 2441 2000','Av. El Golf 150, Las Condes',                 60,100000000),
('00000004-0000-0000-0000-000000000006','76.600.700-8','AFP Provida S.A.',               'contratos@provida.cl',    '+56 2 2351 8000','Av. Pedro de Valdivia 100, Providencia',      30, 50000000),
('00000004-0000-0000-0000-000000000007','76.700.800-9','Codelco División Andina',        'contratos.andina@codelco.cl','+56 34 247 0000','Av. Parque Antonio Rabat 6500, Vitacura', 60,150000000),
('00000004-0000-0000-0000-000000000008','76.800.900-0','Latam Airlines Group S.A.',      'prov.servicios@latam.com','+56 2 2565 1234','Av. Américo Vespucio Sur 901, Santiago',      30, 70000000),
('00000004-0000-0000-0000-000000000009','76.900.100-1','Ministerio de Hacienda',         'adq@hacienda.gob.cl',     '+56 2 2828 2000','Teatinos 120, Santiago',                      60,200000000),
('00000004-0000-0000-0000-000000000010','76.050.060-2','Consorcio Financiero S.A.',      'contratos@consorcio.cl',  '+56 2 2750 7000','Isidora Goyenechea 3000, Las Condes',         45, 55000000);

-- ── PROVEEDORES ───────────────────────────────────────────────
INSERT INTO commerce.vendors (id, rut, name, email, phone, address, payment_days, credit_limit) VALUES
('00000005-0000-0000-0000-000000000001','76.011.111-1','Consultores Independientes Pool SpA','pagos@cipool.cl',      '+56 9 8111 2222','Av. Vicuña Mackenna 4860, La Florida',30,20000000),
('00000005-0000-0000-0000-000000000002','96.522.550-K','Microsoft Chile Ltda.',             'cuentas@microsoft.cl', '+56 2 2339 0000','Isidora Goyenechea 2800, Las Condes',30,50000000),
('00000005-0000-0000-0000-000000000003','76.033.333-3','Propiedades Providencia SpA',       'arriendo@prov.cl',     '+56 2 2333 4444','Av. Providencia 2594, Providencia',  30, 5000000),
('00000005-0000-0000-0000-000000000004','96.510.905-6','Entel Empresas S.A.',               'facturacion@entel.cl', '+56 2 2360 1000','Av. Andrés Bello 2687, Las Condes',  30, 3000000),
('00000005-0000-0000-0000-000000000005','76.055.555-5','HubSpot Chile (Agencia)',            'billing@hubspot.cl',   '+56 9 9555 6666','Av. Apoquindo 4001, Las Condes',     30, 8000000);

-- ── SERVICIOS (catálogo) ──────────────────────────────────────
INSERT INTO inventory.products (id, sku, name, description, category, unit_cost, sale_price, stock_quantity, reorder_point, valuation_method) VALUES
('00000006-0000-0000-0000-000000000001','CON-EST-001','Consultoría Estratégica (día)','Jornada completa consultor senior estrategia','Estrategia',280000,650000,0,0,'PP'),
('00000006-0000-0000-0000-000000000002','CON-DIG-001','Consultoría Digital (día)',    'Jornada transformación digital / datos / agilidad','Digital',250000,580000,0,0,'PP'),
('00000006-0000-0000-0000-000000000003','CON-FIN-001','Outsourcing CFO (mes)',        'Dirección financiera externalizada mensual','Finanzas',800000,1800000,0,0,'PP'),
('00000006-0000-0000-0000-000000000004','CAP-TAL-001','Taller Estrategia (grupo)',    'Taller ejecutivo 1 día hasta 20 personas','Capacitación',350000,900000,0,0,'PP'),
('00000006-0000-0000-0000-000000000005','CAP-PRO-001','Programa Liderazgo (8 ses.)','Liderazgo transformacional — 8 sesiones','Capacitación',1200000,3200000,0,0,'PP'),
('00000006-0000-0000-0000-000000000006','CON-PYM-001','Diagnóstico Empresarial PyME','Diagnóstico integral financiero + operacional','Estrategia',180000,420000,0,0,'PP'),
('00000006-0000-0000-0000-000000000007','CON-GOB-001','Consultoría Sector Público',  'Organismos públicos — licitaciones ChileCompra','Sector Público',260000,520000,0,0,'PP');

-- ── FACTURAS — 12 MESES ────────────────────────────────────────
INSERT INTO commerce.invoices (id, invoice_number, type, invoice_date, due_date, customer_id, subtotal, tax_amount, total, status) VALUES
-- ENERO ($42M)
('00000007-0000-0000-0001-000000000001','HON-2025-0001','sale','2025-01-10','2025-02-09','00000004-0000-0000-0000-000000000006',12605042,2394958,15000000,'paid'),
('00000007-0000-0000-0001-000000000002','HON-2025-0002','sale','2025-01-17','2025-02-16','00000004-0000-0000-0000-000000000002',10084034,1915966,12000000,'paid'),
('00000007-0000-0000-0001-000000000003','HON-2025-0003','sale','2025-01-24','2025-02-23','00000004-0000-0000-0000-000000000003', 8403361,1596639,10000000,'paid'),
('00000007-0000-0000-0001-000000000004','HON-2025-0004','sale','2025-01-29','2025-02-28','00000004-0000-0000-0000-000000000008', 4201681, 798319, 5000000,'paid'),
-- FEBRERO ($48M)
('00000007-0000-0000-0002-000000000001','HON-2025-0005','sale','2025-02-07','2025-03-09','00000004-0000-0000-0000-000000000001',16806723,3193277,20000000,'paid'),
('00000007-0000-0000-0002-000000000002','HON-2025-0006','sale','2025-02-14','2025-03-16','00000004-0000-0000-0000-000000000005',12605042,2394958,15000000,'paid'),
('00000007-0000-0000-0002-000000000003','HON-2025-0007','sale','2025-02-21','2025-03-23','00000004-0000-0000-0000-000000000007', 8403361,1596639,10000000,'paid'),
('00000007-0000-0000-0002-000000000004','HON-2025-0008','sale','2025-02-27','2025-03-29','00000004-0000-0000-0000-000000000010', 2521008, 478992, 3000000,'paid'),
-- MARZO ($55M)
('00000007-0000-0000-0003-000000000001','HON-2025-0009','sale','2025-03-05','2025-04-04','00000004-0000-0000-0000-000000000007',21008403,3991597,25000000,'paid'),
('00000007-0000-0000-0003-000000000002','HON-2025-0010','sale','2025-03-12','2025-04-11','00000004-0000-0000-0000-000000000009',12605042,2394958,15000000,'paid'),
('00000007-0000-0000-0003-000000000003','HON-2025-0011','sale','2025-03-19','2025-04-18','00000004-0000-0000-0000-000000000001', 8403361,1596639,10000000,'paid'),
('00000007-0000-0000-0003-000000000004','HON-2025-0012','sale','2025-03-26','2025-04-25','00000004-0000-0000-0000-000000000004', 4201681, 798319, 5000000,'paid'),
-- ABRIL ($60M)
('00000007-0000-0000-0004-000000000001','HON-2025-0013','sale','2025-04-04','2025-05-04','00000004-0000-0000-0000-000000000005',25210084,4789916,30000000,'paid'),
('00000007-0000-0000-0004-000000000002','HON-2025-0014','sale','2025-04-11','2025-05-11','00000004-0000-0000-0000-000000000007',12605042,2394958,15000000,'paid'),
('00000007-0000-0000-0004-000000000003','HON-2025-0015','sale','2025-04-23','2025-05-23','00000004-0000-0000-0000-000000000006', 8403361,1596639,10000000,'paid'),
('00000007-0000-0000-0004-000000000004','HON-2025-0016','sale','2025-04-28','2025-05-28','00000004-0000-0000-0000-000000000009', 4201681, 798319, 5000000,'paid'),
-- MAYO ($65M)
('00000007-0000-0000-0005-000000000001','HON-2025-0017','sale','2025-05-06','2025-06-05','00000004-0000-0000-0000-000000000009',25210084,4789916,30000000,'paid'),
('00000007-0000-0000-0005-000000000002','HON-2025-0018','sale','2025-05-14','2025-06-13','00000004-0000-0000-0000-000000000007',16806723,3193277,20000000,'paid'),
('00000007-0000-0000-0005-000000000003','HON-2025-0019','sale','2025-05-22','2025-06-21','00000004-0000-0000-0000-000000000001', 8403361,1596639,10000000,'paid'),
('00000007-0000-0000-0005-000000000004','HON-2025-0020','sale','2025-05-29','2025-06-28','00000004-0000-0000-0000-000000000010', 4201681, 798319, 5000000,'paid'),
-- JUNIO ($72M)
('00000007-0000-0000-0006-000000000001','HON-2025-0021','sale','2025-06-03','2025-07-03','00000004-0000-0000-0000-000000000009',33613445,6386555,40000000,'paid'),
('00000007-0000-0000-0006-000000000002','HON-2025-0022','sale','2025-06-10','2025-07-10','00000004-0000-0000-0000-000000000005',12605042,2394958,15000000,'paid'),
('00000007-0000-0000-0006-000000000003','HON-2025-0023','sale','2025-06-18','2025-07-18','00000004-0000-0000-0000-000000000007', 8403361,1596639,10000000,'paid'),
('00000007-0000-0000-0006-000000000004','HON-2025-0024','sale','2025-06-26','2025-07-26','00000004-0000-0000-0000-000000000004', 5882353,1117647, 7000000,'paid'),
-- JULIO ($78M)
('00000007-0000-0000-0007-000000000001','HON-2025-0025','sale','2025-07-07','2025-08-06','00000004-0000-0000-0000-000000000007',33613445,6386555,40000000,'paid'),
('00000007-0000-0000-0007-000000000002','HON-2025-0026','sale','2025-07-14','2025-08-13','00000004-0000-0000-0000-000000000009',16806723,3193277,20000000,'paid'),
('00000007-0000-0000-0007-000000000003','HON-2025-0027','sale','2025-07-22','2025-08-21','00000004-0000-0000-0000-000000000001', 8403361,1596639,10000000,'paid'),
('00000007-0000-0000-0007-000000000004','HON-2025-0028','sale','2025-07-29','2025-08-28','00000004-0000-0000-0000-000000000003', 6722689,1277311, 8000000,'paid'),
-- AGOSTO ($82M)
('00000007-0000-0000-0008-000000000001','HON-2025-0029','sale','2025-08-05','2025-09-04','00000004-0000-0000-0000-000000000007',37815126,7184874,45000000,'paid'),
('00000007-0000-0000-0008-000000000002','HON-2025-0030','sale','2025-08-12','2025-09-11','00000004-0000-0000-0000-000000000005',16806723,3193277,20000000,'paid'),
('00000007-0000-0000-0008-000000000003','HON-2025-0031','sale','2025-08-20','2025-09-19','00000004-0000-0000-0000-000000000009',10084034,1915966,12000000,'paid'),
('00000007-0000-0000-0008-000000000004','HON-2025-0032','sale','2025-08-27','2025-09-26','00000004-0000-0000-0000-000000000006', 4201681, 798319, 5000000,'paid'),
-- SEPTIEMBRE ($88M)
('00000007-0000-0000-0009-000000000001','HON-2025-0033','sale','2025-09-03','2025-10-03','00000004-0000-0000-0000-000000000007',42016807,7983193,50000000,'paid'),
('00000007-0000-0000-0009-000000000002','HON-2025-0034','sale','2025-09-10','2025-10-10','00000004-0000-0000-0000-000000000009',16806723,3193277,20000000,'paid'),
('00000007-0000-0000-0009-000000000003','HON-2025-0035','sale','2025-09-18','2025-10-18','00000004-0000-0000-0000-000000000005',10084034,1915966,12000000,'paid'),
('00000007-0000-0000-0009-000000000004','HON-2025-0036','sale','2025-09-25','2025-10-25','00000004-0000-0000-0000-000000000001', 5042017, 957983, 6000000,'paid'),
-- OCTUBRE ($95M — mes récord)
('00000007-0000-0000-0010-000000000001','HON-2025-0037','sale','2025-10-07','2025-11-06','00000004-0000-0000-0000-000000000007',50420168,9579832,60000000,'paid'),
('00000007-0000-0000-0010-000000000002','HON-2025-0038','sale','2025-10-14','2025-11-13','00000004-0000-0000-0000-000000000009',16806723,3193277,20000000,'paid'),
('00000007-0000-0000-0010-000000000003','HON-2025-0039','sale','2025-10-21','2025-11-20','00000004-0000-0000-0000-000000000005', 8403361,1596639,10000000,'paid'),
('00000007-0000-0000-0010-000000000004','HON-2025-0040','sale','2025-10-28','2025-11-27','00000004-0000-0000-0000-000000000001', 4201681, 798319, 5000000,'paid'),
-- NOVIEMBRE ($90M — emitidas, pendientes de pago)
('00000007-0000-0000-0011-000000000001','HON-2025-0041','sale','2025-11-05','2025-12-05','00000004-0000-0000-0000-000000000007',42016807,7983193,50000000,'issued'),
('00000007-0000-0000-0011-000000000002','HON-2025-0042','sale','2025-11-12','2025-12-12','00000004-0000-0000-0000-000000000009',16806723,3193277,20000000,'issued'),
('00000007-0000-0000-0011-000000000003','HON-2025-0043','sale','2025-11-20','2025-12-20','00000004-0000-0000-0000-000000000005',10084034,1915966,12000000,'issued'),
('00000007-0000-0000-0011-000000000004','HON-2025-0044','sale','2025-11-27','2026-01-10','00000004-0000-0000-0000-000000000001', 6722689,1277311, 8000000,'issued'),
-- DICIEMBRE (2 borradores + 1 nota de crédito)
('00000007-0000-0000-0012-000000000001','HON-2025-0045','sale',       '2025-12-03','2026-01-02','00000004-0000-0000-0000-000000000007',42016807,7983193, 50000000,'draft'),
('00000007-0000-0000-0012-000000000002','HON-2025-0046','sale',       '2025-12-10','2026-01-09','00000004-0000-0000-0000-000000000009',16806723,3193277, 20000000,'draft'),
('00000007-0000-0000-0012-000000000003','NC-2025-0001', 'credit_note','2025-12-15', null,       '00000004-0000-0000-0000-000000000003',-2521008,-478992,-3000000,'issued');

-- ── ASIENTOS CONTABLES ─────────────────────────────────────────
INSERT INTO accounting.journal_entries (id, entry_number, entry_date, description, source, period_id, is_posted) VALUES
('00000008-0000-0000-0000-000000000001','AST-2025-0001','2025-01-31','Reconocimiento ingresos enero 2025',        'manual','00000002-0000-0000-0000-000000000001',true),
('00000008-0000-0000-0000-000000000002','AST-2025-0002','2025-01-31','Gastos operativos enero 2025',              'manual','00000002-0000-0000-0000-000000000001',true),
('00000008-0000-0000-0000-000000000003','AST-2025-0101','2025-06-30','Reconocimiento ingresos junio 2025',        'manual','00000002-0000-0000-0000-000000000006',true),
('00000008-0000-0000-0000-000000000004','AST-2025-0181','2025-10-31','Ingresos octubre 2025 — mes récord',        'manual','00000002-0000-0000-0000-000000000010',true),
('00000008-0000-0000-0000-000000000005','AST-2025-0221','2025-11-30','BORRADOR: Cierre provisorio noviembre 2025','manual','00000002-0000-0000-0000-000000000011',false);

INSERT INTO accounting.journal_lines (journal_entry_id, account_id, debit, credit, description) VALUES
-- Enero — ingresos
('00000008-0000-0000-0000-000000000001','00000003-0000-0000-0000-000000000002',42000000,0,       'CxC clientes enero'),
('00000008-0000-0000-0000-000000000001','00000003-0000-0000-0000-000000000050',0,        28571429,'Honorarios consultoría estratégica ene'),
('00000008-0000-0000-0000-000000000001','00000003-0000-0000-0000-000000000051',0,         5882353,'Honorarios consultoría digital ene'),
('00000008-0000-0000-0000-000000000001','00000003-0000-0000-0000-000000000052',0,         1008403,'Honorarios capacitación ene'),
('00000008-0000-0000-0000-000000000001','00000003-0000-0000-0000-000000000021',0,         6537815,'IVA débito fiscal enero'),
-- Enero — gastos
('00000008-0000-0000-0000-000000000002','00000003-0000-0000-0000-000000000070',9800000, 0,       'Remuneraciones planta enero'),
('00000008-0000-0000-0000-000000000002','00000003-0000-0000-0000-000000000060',5200000, 0,       'Honorarios consultores externos Codelco'),
('00000008-0000-0000-0000-000000000002','00000003-0000-0000-0000-000000000071',2800000, 0,       'Arriendo oficinas Providencia enero'),
('00000008-0000-0000-0000-000000000002','00000003-0000-0000-0000-000000000072', 420000, 0,       'Internet + telefonía + nube enero'),
('00000008-0000-0000-0000-000000000002','00000003-0000-0000-0000-000000000075', 380000, 0,       'Depreciación equipos enero'),
('00000008-0000-0000-0000-000000000002','00000003-0000-0000-0000-000000000001',0,       18600000,'Pago gastos desde cuenta corriente'),
-- Junio — ingresos
('00000008-0000-0000-0000-000000000003','00000003-0000-0000-0000-000000000002',72000000,0,       'CxC clientes junio'),
('00000008-0000-0000-0000-000000000003','00000003-0000-0000-0000-000000000050',0,        39495798,'Honorarios estrategia + sector público jun'),
('00000008-0000-0000-0000-000000000003','00000003-0000-0000-0000-000000000051',0,        12605042,'Honorarios digital junio'),
('00000008-0000-0000-0000-000000000003','00000003-0000-0000-0000-000000000053',0,         8403361,'Outsourcing CFO 3 clientes junio'),
('00000008-0000-0000-0000-000000000003','00000003-0000-0000-0000-000000000021',0,        11495799,'IVA débito fiscal junio'),
-- Octubre — ingresos récord
('00000008-0000-0000-0000-000000000004','00000003-0000-0000-0000-000000000002',95000000,0,       'CxC clientes octubre'),
('00000008-0000-0000-0000-000000000004','00000003-0000-0000-0000-000000000050',0,        46218487,'Honorarios estrategia octubre'),
('00000008-0000-0000-0000-000000000004','00000003-0000-0000-0000-000000000051',0,        14705882,'Honorarios digital octubre'),
('00000008-0000-0000-0000-000000000004','00000003-0000-0000-0000-000000000053',0,        18907563,'Outsourcing CFO 8 clientes octubre'),
('00000008-0000-0000-0000-000000000004','00000003-0000-0000-0000-000000000021',0,        15168068,'IVA débito fiscal octubre'),
-- Noviembre — BORRADOR (is_posted = false)
('00000008-0000-0000-0000-000000000005','00000003-0000-0000-0000-000000000002',90000000,0,       'CxC provisorio noviembre'),
('00000008-0000-0000-0000-000000000005','00000003-0000-0000-0000-000000000050',0,        50420168,'Honorarios estrategia nov (est.)'),
('00000008-0000-0000-0000-000000000005','00000003-0000-0000-0000-000000000051',0,        14285714,'Honorarios digital nov (est.)'),
('00000008-0000-0000-0000-000000000005','00000003-0000-0000-0000-000000000053',0,        10924370,'Outsourcing CFO nov (est.)'),
('00000008-0000-0000-0000-000000000005','00000003-0000-0000-0000-000000000021',0,        14369748,'IVA débito provisorio noviembre');

-- ── PPM — CONFIGURACIÓN ───────────────────────────────────────
INSERT INTO taxes.tax_config (id, company_rut, company_name, tax_regime, ppm_rate, tax_year) VALUES
('00000009-0000-0000-0000-000000000001','76.987.654-3','Innova Consulting Group SpA','general',0.028,2025);

-- ── PPM — 10 MESES PAGADOS ─────────────────────────────────────
INSERT INTO taxes.ppm_payments (id, period_month, period_year, gross_income, ppm_rate, ppm_amount, is_suspended, paid_at) VALUES
('00000010-0000-0000-0000-000000000001', 1,2025, 42000000,0.028,1176000,false,'2025-02-12 10:00:00'),
('00000010-0000-0000-0000-000000000002', 2,2025, 48000000,0.028,1344000,false,'2025-03-12 10:00:00'),
('00000010-0000-0000-0000-000000000003', 3,2025, 55000000,0.028,1540000,false,'2025-04-12 10:00:00'),
('00000010-0000-0000-0000-000000000004', 4,2025, 60000000,0.028,1680000,false,'2025-05-12 10:00:00'),
('00000010-0000-0000-0000-000000000005', 5,2025, 65000000,0.028,1820000,false,'2025-06-12 10:00:00'),
('00000010-0000-0000-0000-000000000006', 6,2025, 72000000,0.028,2016000,false,'2025-07-12 10:00:00'),
('00000010-0000-0000-0000-000000000007', 7,2025, 78000000,0.028,2184000,false,'2025-08-12 10:00:00'),
('00000010-0000-0000-0000-000000000008', 8,2025, 82000000,0.028,2296000,false,'2025-09-12 10:00:00'),
('00000010-0000-0000-0000-000000000009', 9,2025, 88000000,0.028,2464000,false,'2025-10-12 10:00:00'),
('00000010-0000-0000-0000-000000000010',10,2025, 95000000,0.028,2660000,false,'2025-11-12 10:00:00');

-- ── RESULTADO TRIBUTARIO 2024 ─────────────────────────────────
INSERT INTO taxes.tax_results (id, tax_year, gross_income, net_income, tax_base, first_category_tax, accumulated_loss) VALUES
('00000011-0000-0000-0000-000000000001',2024,680000000,147000000,147000000,37044000,0);

-- ── VERIFICACIÓN ──────────────────────────────────────────────
SELECT '=============================' AS resultado;
SELECT '  CARGA COMPLETADA CON ÉXITO' AS resultado;
SELECT '=============================' AS resultado;

SELECT tabla, registros FROM (
  SELECT 'usuarios'      AS tabla, COUNT(*)::int AS registros FROM users.users
  UNION ALL SELECT 'períodos',     COUNT(*)::int FROM accounting.periods
  UNION ALL SELECT 'cuentas',      COUNT(*)::int FROM accounting.accounts
  UNION ALL SELECT 'clientes',     COUNT(*)::int FROM commerce.customers
  UNION ALL SELECT 'proveedores',  COUNT(*)::int FROM commerce.vendors
  UNION ALL SELECT 'servicios',    COUNT(*)::int FROM inventory.products
  UNION ALL SELECT 'facturas',     COUNT(*)::int FROM commerce.invoices
  UNION ALL SELECT 'asientos',     COUNT(*)::int FROM accounting.journal_entries
  UNION ALL SELECT 'líneas_cont.', COUNT(*)::int FROM accounting.journal_lines
  UNION ALL SELECT 'ppm_pagados',  COUNT(*)::int FROM taxes.ppm_payments
) t ORDER BY tabla;

SELECT '' AS separador;
SELECT '  CREDENCIALES: contraseña Consul2025!' AS info;
SELECT email, role FROM users.users ORDER BY role, email;
