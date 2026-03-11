-- ============================================================
-- ERP FINANCIERO — SEED DATA: CONSULTORÍA ESTRATÉGICA
-- Empresa: Innova Consulting Group SpA
-- 15 usuarios | datos 12 meses 2025 | sector servicios
-- Ejecutar: psql -U erp_user -d erp_db -f seed_consultora.sql
-- ============================================================

BEGIN;

-- ============================================================
-- 0. LIMPIAR DATOS ANTERIORES
-- ============================================================
DELETE FROM financial.bsc_snapshots;
DELETE FROM taxes.ppm_payments;
DELETE FROM taxes.tax_results;
DELETE FROM taxes.tax_config;
DELETE FROM inventory.stock_movements;
DELETE FROM inventory.products;
DELETE FROM commerce.invoice_items;
DELETE FROM commerce.invoices;
DELETE FROM commerce.customers;
DELETE FROM commerce.vendors;
DELETE FROM accounting.journal_lines;
DELETE FROM accounting.journal_entries;
DELETE FROM accounting.accounts;
DELETE FROM accounting.periods;
DELETE FROM users.users;

-- ============================================================
-- 1. USUARIOS — 15 PERFILES (contraseña: Consul2025!)
-- Hash bcrypt cost=12 de "Consul2025!"
-- ============================================================
INSERT INTO users.users (id, email, full_name, hashed_password, role, is_active) VALUES

-- ── DIRECCIÓN (admin — acceso total)
('U0000000-0000-0000-0000-000000000001',
 'ceo@innovaconsulting.cl',
 'Rodrigo Alvarado — CEO / Socio Director',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJdB8n7dKlJ8EvQ5CrMa4/ky',
 'admin', true),

('U0000000-0000-0000-0000-000000000002',
 'cfo@innovaconsulting.cl',
 'Marcela Ibáñez — CFO / Directora Financiera',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJdB8n7dKlJ8EvQ5CrMa4/ky',
 'admin', true),

('U0000000-0000-0000-0000-000000000003',
 'socio.ops@innovaconsulting.cl',
 'Fernando Castillo — Socio de Operaciones',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJdB8n7dKlJ8EvQ5CrMa4/ky',
 'admin', true),

-- ── CONTABILIDAD Y FINANZAS (contador — GET+POST+PUT)
('U0000000-0000-0000-0000-000000000004',
 'contador.jefe@innovaconsulting.cl',
 'Patricia Morales — Contadora Jefe',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJdB8n7dKlJ8EvQ5CrMa4/ky',
 'contador', true),

('U0000000-0000-0000-0000-000000000005',
 'contador.junior@innovaconsulting.cl',
 'Diego Núñez — Contador Junior',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJdB8n7dKlJ8EvQ5CrMa4/ky',
 'contador', true),

('U0000000-0000-0000-0000-000000000006',
 'tesoreria@innovaconsulting.cl',
 'Camila Vargas — Tesorería',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJdB8n7dKlJ8EvQ5CrMa4/ky',
 'contador', true),

-- ── GERENCIA DE PROYECTOS (viewer — solo lectura)
('U0000000-0000-0000-0000-000000000007',
 'gerente.digital@innovaconsulting.cl',
 'Andrea Soto — Gerente Área Digital',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJdB8n7dKlJ8EvQ5CrMa4/ky',
 'viewer', true),

('U0000000-0000-0000-0000-000000000008',
 'gerente.estrategia@innovaconsulting.cl',
 'Tomás Herrera — Gerente Estrategia',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJdB8n7dKlJ8EvQ5CrMa4/ky',
 'viewer', true),

('U0000000-0000-0000-0000-000000000009',
 'gerente.rrhh@innovaconsulting.cl',
 'Valentina Pizarro — Gerente RRHH',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJdB8n7dKlJ8EvQ5CrMa4/ky',
 'viewer', true),

-- ── CONSULTORES SENIOR (viewer)
('U0000000-0000-0000-0000-000000000010',
 'consultor.sr1@innovaconsulting.cl',
 'Sebastián Muñoz — Consultor Senior Digital',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJdB8n7dKlJ8EvQ5CrMa4/ky',
 'viewer', true),

('U0000000-0000-0000-0000-000000000011',
 'consultor.sr2@innovaconsulting.cl',
 'Daniela Ramos — Consultora Senior Estrategia',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJdB8n7dKlJ8EvQ5CrMa4/ky',
 'viewer', true),

('U0000000-0000-0000-0000-000000000012',
 'consultor.sr3@innovaconsulting.cl',
 'Nicolás Espinoza — Consultor Senior Finanzas',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJdB8n7dKlJ8EvQ5CrMa4/ky',
 'viewer', true),

-- ── ADMINISTRACIÓN (contador — gestión de facturas y clientes)
('U0000000-0000-0000-0000-000000000013',
 'admin.comercial@innovaconsulting.cl',
 'Javiera Reyes — Administración Comercial',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJdB8n7dKlJ8EvQ5CrMa4/ky',
 'contador', true),

-- ── CONTROL DE GESTIÓN (admin)
('U0000000-0000-0000-0000-000000000014',
 'control.gestion@innovaconsulting.cl',
 'Roberto Figueroa — Control de Gestión',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJdB8n7dKlJ8EvQ5CrMa4/ky',
 'admin', true),

-- ── AUDITOR EXTERNO (viewer)
('U0000000-0000-0000-0000-000000000015',
 'auditor@pwc-chile.cl',
 'Isabel Contreras — Auditora PwC Chile',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJdB8n7dKlJ8EvQ5CrMa4/ky',
 'viewer', true);

-- ============================================================
-- 2. PERÍODOS CONTABLES 2025
-- ============================================================
INSERT INTO accounting.periods (id, name, start_date, end_date, is_closed) VALUES
('P0000001-0000-0000-0000-000000000001', 'Enero 2025',     '2025-01-01','2025-01-31', true),
('P0000001-0000-0000-0000-000000000002', 'Febrero 2025',   '2025-02-01','2025-02-28', true),
('P0000001-0000-0000-0000-000000000003', 'Marzo 2025',     '2025-03-01','2025-03-31', true),
('P0000001-0000-0000-0000-000000000004', 'Abril 2025',     '2025-04-01','2025-04-30', true),
('P0000001-0000-0000-0000-000000000005', 'Mayo 2025',      '2025-05-01','2025-05-31', true),
('P0000001-0000-0000-0000-000000000006', 'Junio 2025',     '2025-06-01','2025-06-30', true),
('P0000001-0000-0000-0000-000000000007', 'Julio 2025',     '2025-07-01','2025-07-31', true),
('P0000001-0000-0000-0000-000000000008', 'Agosto 2025',    '2025-08-01','2025-08-31', true),
('P0000001-0000-0000-0000-000000000009', 'Septiembre 2025','2025-09-01','2025-09-30', true),
('P0000001-0000-0000-0000-000000000010', 'Octubre 2025',   '2025-10-01','2025-10-31', true),
('P0000001-0000-0000-0000-000000000011', 'Noviembre 2025', '2025-11-01','2025-11-30', false),
('P0000001-0000-0000-0000-000000000012', 'Diciembre 2025', '2025-12-01','2025-12-31', false);

-- ============================================================
-- 3. PLAN DE CUENTAS — CONSULTORA
-- ============================================================
INSERT INTO accounting.accounts (id, code, name, type, subtype, netsuite_category, is_active) VALUES
-- ACTIVOS CORRIENTES
('A0000001-0000-0000-0000-000000000001','1-1-001','Caja y Bancos (BCI Cta Cte)',        'asset','current_asset','Asset',true),
('A0000001-0000-0000-0000-000000000002','1-1-002','Cuentas por Cobrar Clientes',        'asset','current_asset','Asset',true),
('A0000001-0000-0000-0000-000000000003','1-1-003','Honorarios por Cobrar',              'asset','current_asset','Asset',true),
('A0000001-0000-0000-0000-000000000004','1-1-004','IVA Crédito Fiscal',                 'asset','current_asset','Asset',true),
('A0000001-0000-0000-0000-000000000005','1-1-005','PPM Pagado Anticipado',              'asset','current_asset','Asset',true),
('A0000001-0000-0000-0000-000000000006','1-1-006','Gastos Anticipados',                 'asset','current_asset','Asset',true),
-- ACTIVOS NO CORRIENTES
('A0000001-0000-0000-0000-000000000010','1-2-001','Equipos Computación',               'asset','fixed_asset','Asset',true),
('A0000001-0000-0000-0000-000000000011','1-2-002','Mobiliario y Equipo Oficina',       'asset','fixed_asset','Asset',true),
('A0000001-0000-0000-0000-000000000012','1-2-003','Software y Licencias',              'asset','fixed_asset','Asset',true),
('A0000001-0000-0000-0000-000000000013','1-2-099','Depreciación Acumulada',            'asset','fixed_asset','Asset',true),
-- PASIVOS CORRIENTES
('A0000001-0000-0000-0000-000000000020','2-1-001','Cuentas por Pagar Proveedores',     'liability','current_liability','Liability',true),
('A0000001-0000-0000-0000-000000000021','2-1-002','IVA Débito Fiscal',                 'liability','current_liability','Liability',true),
('A0000001-0000-0000-0000-000000000022','2-1-003','PPM por Pagar (SII)',               'liability','current_liability','Liability',true),
('A0000001-0000-0000-0000-000000000023','2-1-004','Remuneraciones por Pagar',          'liability','current_liability','Liability',true),
('A0000001-0000-0000-0000-000000000024','2-1-005','Provisión Vacaciones',              'liability','current_liability','Liability',true),
('A0000001-0000-0000-0000-000000000025','2-1-006','Retenciones Honorarios (10%)',      'liability','current_liability','Liability',true),
-- PASIVOS NO CORRIENTES
('A0000001-0000-0000-0000-000000000030','2-2-001','Préstamo Bancario LP (BCI)',        'liability','long_term_liability','Liability',true),
-- PATRIMONIO
('A0000001-0000-0000-0000-000000000040','3-1-001','Capital Pagado',                    'equity','capital','Equity',true),
('A0000001-0000-0000-0000-000000000041','3-1-002','Utilidades Acumuladas Ejercicios Ant','equity','retained_earnings','Equity',true),
('A0000001-0000-0000-0000-000000000042','3-1-003','Utilidad del Ejercicio',            'equity','net_income','Equity',true),
-- INGRESOS
('A0000001-0000-0000-0000-000000000050','4-1-001','Honorarios Consultoría Estratégica','income','operating_income','Income',true),
('A0000001-0000-0000-0000-000000000051','4-1-002','Honorarios Consultoría Digital',    'income','operating_income','Income',true),
('A0000001-0000-0000-0000-000000000052','4-1-003','Honorarios Capacitación y Talleres','income','operating_income','Income',true),
('A0000001-0000-0000-0000-000000000053','4-1-004','Servicios de Outsourcing CFO',      'income','operating_income','Income',true),
('A0000001-0000-0000-0000-000000000054','4-2-001','Otros Ingresos No Operacionales',  'income','other_income','Income',true),
-- COSTOS DIRECTOS
('A0000001-0000-0000-0000-000000000060','5-1-001','Honorarios Consultores Externos',   'expense','cost_of_goods','Expense',true),
('A0000001-0000-0000-0000-000000000061','5-1-002','Viáticos y Gastos de Terreno',      'expense','cost_of_goods','Expense',true),
('A0000001-0000-0000-0000-000000000062','5-1-003','Software y Herramientas de Proyecto','expense','cost_of_goods','Expense',true),
-- GASTOS OPERATIVOS
('A0000001-0000-0000-0000-000000000070','6-1-001','Remuneraciones Planta',             'expense','operating_expense','Expense',true),
('A0000001-0000-0000-0000-000000000071','6-1-002','Arriendo Oficinas (Providencia)',   'expense','operating_expense','Expense',true),
('A0000001-0000-0000-0000-000000000072','6-1-003','Servicios Básicos y Telecom',       'expense','operating_expense','Expense',true),
('A0000001-0000-0000-0000-000000000073','6-1-004','Marketing y Desarrollo Negocios',   'expense','operating_expense','Expense',true),
('A0000001-0000-0000-0000-000000000074','6-1-005','Seguros y Garantías',               'expense','operating_expense','Expense',true),
('A0000001-0000-0000-0000-000000000075','6-1-006','Depreciación del Ejercicio',        'expense','operating_expense','Expense',true),
('A0000001-0000-0000-0000-000000000076','6-1-007','Capacitación y Desarrollo Equipo', 'expense','operating_expense','Expense',true),
('A0000001-0000-0000-0000-000000000080','6-2-001','Gastos Financieros (Intereses)',    'expense','financial_expense','Expense',true),
('A0000001-0000-0000-0000-000000000081','6-3-001','Impuesto a la Renta 1ª Categoría', 'expense','tax_expense','Expense',true);

-- ============================================================
-- 4. CLIENTES — 10 empresas reales del sector
-- ============================================================
INSERT INTO commerce.customers
  (id, rut, name, email, phone, address, payment_days, credit_limit) VALUES

('C0000001-0000-0000-0000-000000000001',
 '76.100.200-3','Grupo Empresas Falabella S.A.',
 'proveedores@falabella.cl','+56 2 2380 2000',
 'Av. El Conquistador del Monte 925, Huechuraba', 30, 80000000),

('C0000001-0000-0000-0000-000000000002',
 '76.200.300-4','Banco Bice S.A.',
 'adq.servicios@bice.cl','+56 2 2692 2000',
 'Teatinos 220, Santiago Centro', 30, 60000000),

('C0000001-0000-0000-0000-000000000003',
 '76.300.400-5','Clínica Bupa Santa María',
 'compras@bupachile.cl','+56 2 2461 2000',
 'Av. Santa María 0500, Providencia', 45, 40000000),

('C0000001-0000-0000-0000-000000000004',
 '76.400.500-6','Viña Concha y Toro S.A.',
 'finanzas@conchaytoro.cl','+56 2 2476 5000',
 'Av. Nueva Tajamar 481, Las Condes', 30, 35000000),

('C0000001-0000-0000-0000-000000000005',
 '76.500.600-7','CMPC Tissue S.A.',
 'pagos@cmpc.cl','+56 2 2441 2000',
 'Av. El Golf 150, Las Condes', 60, 100000000),

('C0000001-0000-0000-0000-000000000006',
 '76.600.700-8','AFP Provida S.A.',
 'contratos@provida.cl','+56 2 2351 8000',
 'Av. Pedro de Valdivia 100, Providencia', 30, 50000000),

('C0000001-0000-0000-0000-000000000007',
 '76.700.800-9','Codelco División Andina',
 'contratos.andina@codelco.cl','+56 34 247 0000',
 'Av. Parque Antonio Rabat 6500, Vitacura', 60, 150000000),

('C0000001-0000-0000-0000-000000000008',
 '76.800.900-0','Latam Airlines Group S.A.',
 'prov.servicios@latam.com','+56 2 2565 1234',
 'Av. Américo Vespucio Sur 901, Santiago', 30, 70000000),

('C0000001-0000-0000-0000-000000000009',
 '76.900.100-1','Ministerio de Hacienda',
 'adq@hacienda.gob.cl','+56 2 2828 2000',
 'Teatinos 120, Santiago', 60, 200000000),

('C0000001-0000-0000-0000-000000000010',
 '76.050.060-2','Consorcio Financiero S.A.',
 'contratos@consorcio.cl','+56 2 2750 7000',
 'Isidora Goyenechea 3000, Las Condes', 45, 55000000);

-- ============================================================
-- 5. PROVEEDORES
-- ============================================================
INSERT INTO commerce.vendors
  (id, rut, name, email, phone, address, payment_days, credit_limit) VALUES

('V0000001-0000-0000-0000-000000000001',
 '76.011.111-1','Consultores Independientes Pool SpA',
 'pagos@cipool.cl','+56 9 8111 2222',
 'Av. Vicuña Mackenna 4860, La Florida', 30, 20000000),

('V0000001-0000-0000-0000-000000000002',
 '96.522.550-K','Microsoft Chile Ltda.',
 'cuentas@microsoft.cl','+56 2 2339 0000',
 'Isidora Goyenechea 2800, Las Condes', 30, 50000000),

('V0000001-0000-0000-0000-000000000003',
 '76.033.333-3','Propiedades Providencia SpA',
 'arriendo@provspá.cl','+56 2 2333 4444',
 'Av. Providencia 2594, Providencia', 30, 5000000),

('V0000001-0000-0000-0000-000000000004',
 '96.510.905-6','Entel Empresas S.A.',
 'facturacion@entel.cl','+56 2 2360 1000',
 'Av. Andrés Bello 2687, Las Condes', 30, 3000000),

('V0000001-0000-0000-0000-000000000005',
 '76.055.555-5','HubSpot Chile (Agencia)',
 'billing@hubspot.cl','+56 9 9555 6666',
 'Av. Apoquindo 4001, Las Condes', 30, 8000000);

-- ============================================================
-- 6. SERVICIOS (catálogo de la consultora — sin stock físico)
-- ============================================================
INSERT INTO inventory.products
  (id, sku, name, description, category, unit_cost, sale_price,
   stock_quantity, reorder_point, valuation_method) VALUES

('S0000001-0000-0000-0000-000000000001',
 'CON-EST-001','Consultoría Estratégica (día consultor)',
 'Jornada completa de consultor senior en estrategia corporativa',
 'Estrategia', 280000, 650000, 0, 0, 'PP'),

('S0000001-0000-0000-0000-000000000002',
 'CON-DIG-001','Consultoría Digital (día consultor)',
 'Jornada de transformación digital, UX, datos o agilidad',
 'Digital', 250000, 580000, 0, 0, 'PP'),

('S0000001-0000-0000-0000-000000000003',
 'CON-FIN-001','Outsourcing CFO (mes)',
 'Dirección financiera externalizada — reuniones, reportes y KPIs',
 'Finanzas', 800000, 1800000, 0, 0, 'PP'),

('S0000001-0000-0000-0000-000000000004',
 'CAP-TAL-001','Taller Estrategia (grupo hasta 20 personas)',
 'Taller ejecutivo de 1 día — facilitación y materiales incluidos',
 'Capacitación', 350000, 900000, 0, 0, 'PP'),

('S0000001-0000-0000-0000-000000000005',
 'CAP-PRO-001','Programa de Liderazgo (8 sesiones)',
 'Programa completo liderazgo transformacional — 8 sesiones bimensuales',
 'Capacitación', 1200000, 3200000, 0, 0, 'PP'),

('S0000001-0000-0000-0000-000000000006',
 'CON-PYM-001','Diagnóstico Empresarial PyME',
 'Diagnóstico integral financiero + operacional para PyMEs',
 'Estrategia', 180000, 420000, 0, 0, 'PP'),

('S0000001-0000-0000-0000-000000000007',
 'CON-GOB-001','Consultoría Sector Público (día)',
 'Consultoría para organismos públicos — licitaciones y ChileCompra',
 'Sector Público', 260000, 520000, 0, 0, 'PP');

-- ============================================================
-- 7. CONFIGURACIÓN PPM
-- ============================================================
INSERT INTO taxes.tax_config
  (id, company_rut, company_name, tax_regime, ppm_rate, tax_year, is_active) VALUES
('T0000001-0000-0000-0000-000000000001',
 '76.987.654-3','Innova Consulting Group SpA',
 'general', 0.028, 2025, true);
-- tasa 2.8% = impuesto 1ª cat 2024 / ingresos 2024

-- ============================================================
-- 8. FACTURAS — 12 MESES 2025
-- Honorarios neto + IVA 19% = total
-- Ingresos mensuales que crecen de ~$42M a ~$95M (año de expansión)
-- ============================================================

-- ── ENERO ($42M total / $35.3M neto) ──────────────────────
INSERT INTO commerce.invoices
  (id, invoice_number, type, invoice_date, due_date, customer_id,
   subtotal, tax_amount, total, status) VALUES
('F0000001-0000-0000-0001-000000000001','HON-2025-0001','sale','2025-01-10','2025-02-09',
 'C0000001-0000-0000-0000-000000000006', 12605042,2394958,15000000,'paid'),
('F0000001-0000-0000-0001-000000000002','HON-2025-0002','sale','2025-01-17','2025-02-16',
 'C0000001-0000-0000-0000-000000000002', 10084034,1915966,12000000,'paid'),
('F0000001-0000-0000-0001-000000000003','HON-2025-0003','sale','2025-01-24','2025-02-23',
 'C0000001-0000-0000-0000-000000000003',  8403361,1596639,10000000,'paid'),
('F0000001-0000-0000-0001-000000000004','HON-2025-0004','sale','2025-01-29','2025-02-28',
 'C0000001-0000-0000-0000-000000000008',  4201681, 798319, 5000000,'paid');

-- ── FEBRERO ($48M total / $40.3M neto) ─────────────────────
INSERT INTO commerce.invoices
  (id, invoice_number, type, invoice_date, due_date, customer_id,
   subtotal, tax_amount, total, status) VALUES
('F0000001-0000-0000-0002-000000000001','HON-2025-0005','sale','2025-02-07','2025-03-09',
 'C0000001-0000-0000-0000-000000000001', 16806723,3193277,20000000,'paid'),
('F0000001-0000-0000-0002-000000000002','HON-2025-0006','sale','2025-02-14','2025-03-16',
 'C0000001-0000-0000-0000-000000000005', 12605042,2394958,15000000,'paid'),
('F0000001-0000-0000-0002-000000000003','HON-2025-0007','sale','2025-02-21','2025-03-23',
 'C0000001-0000-0000-0000-000000000007',  8403361,1596639,10000000,'paid'),
('F0000001-0000-0000-0002-000000000004','HON-2025-0008','sale','2025-02-27','2025-03-29',
 'C0000001-0000-0000-0000-000000000010',  2521008, 478992, 3000000,'paid');

-- ── MARZO ($55M total / $46.2M neto) ───────────────────────
INSERT INTO commerce.invoices
  (id, invoice_number, type, invoice_date, due_date, customer_id,
   subtotal, tax_amount, total, status) VALUES
('F0000001-0000-0000-0003-000000000001','HON-2025-0009','sale','2025-03-05','2025-04-04',
 'C0000001-0000-0000-0000-000000000007', 21008403,3991597,25000000,'paid'),
('F0000001-0000-0000-0003-000000000002','HON-2025-0010','sale','2025-03-12','2025-04-11',
 'C0000001-0000-0000-0000-000000000009', 12605042,2394958,15000000,'paid'),
('F0000001-0000-0000-0003-000000000003','HON-2025-0011','sale','2025-03-19','2025-04-18',
 'C0000001-0000-0000-0000-000000000001',  8403361,1596639,10000000,'paid'),
('F0000001-0000-0000-0003-000000000004','HON-2025-0012','sale','2025-03-26','2025-04-25',
 'C0000001-0000-0000-0000-000000000004',  4201681, 798319, 5000000,'paid');

-- ── ABRIL ($60M total / $50.4M neto) ───────────────────────
INSERT INTO commerce.invoices
  (id, invoice_number, type, invoice_date, due_date, customer_id,
   subtotal, tax_amount, total, status) VALUES
('F0000001-0000-0000-0004-000000000001','HON-2025-0013','sale','2025-04-04','2025-05-04',
 'C0000001-0000-0000-0000-000000000005', 25210084,4789916,30000000,'paid'),
('F0000001-0000-0000-0004-000000000002','HON-2025-0014','sale','2025-04-11','2025-05-11',
 'C0000001-0000-0000-0000-000000000007', 12605042,2394958,15000000,'paid'),
('F0000001-0000-0000-0004-000000000003','HON-2025-0015','sale','2025-04-23','2025-05-23',
 'C0000001-0000-0000-0000-000000000006',  8403361,1596639,10000000,'paid'),
('F0000001-0000-0000-0004-000000000004','HON-2025-0016','sale','2025-04-28','2025-05-28',
 'C0000001-0000-0000-0000-000000000009',  4201681, 798319, 5000000,'paid');

-- ── MAYO ($65M total / $54.6M neto) ────────────────────────
INSERT INTO commerce.invoices
  (id, invoice_number, type, invoice_date, due_date, customer_id,
   subtotal, tax_amount, total, status) VALUES
('F0000001-0000-0000-0005-000000000001','HON-2025-0017','sale','2025-05-06','2025-06-05',
 'C0000001-0000-0000-0000-000000000009', 25210084,4789916,30000000,'paid'),
('F0000001-0000-0000-0005-000000000002','HON-2025-0018','sale','2025-05-14','2025-06-13',
 'C0000001-0000-0000-0000-000000000007', 16806723,3193277,20000000,'paid'),
('F0000001-0000-0000-0005-000000000003','HON-2025-0019','sale','2025-05-22','2025-06-21',
 'C0000001-0000-0000-0000-000000000001',  8403361,1596639,10000000,'paid'),
('F0000001-0000-0000-0005-000000000004','HON-2025-0020','sale','2025-05-29','2025-06-28',
 'C0000001-0000-0000-0000-000000000010',  4201681, 798319, 5000000,'paid');

-- ── JUNIO ($72M total / $60.5M neto) — primer salto ────────
INSERT INTO commerce.invoices
  (id, invoice_number, type, invoice_date, due_date, customer_id,
   subtotal, tax_amount, total, status) VALUES
('F0000001-0000-0000-0006-000000000001','HON-2025-0021','sale','2025-06-03','2025-07-03',
 'C0000001-0000-0000-0000-000000000009', 33613445,6386555,40000000,'paid'),
('F0000001-0000-0000-0006-000000000002','HON-2025-0022','sale','2025-06-10','2025-07-10',
 'C0000001-0000-0000-0000-000000000005', 12605042,2394958,15000000,'paid'),
('F0000001-0000-0000-0006-000000000003','HON-2025-0023','sale','2025-06-18','2025-07-18',
 'C0000001-0000-0000-0000-000000000007',  8403361,1596639,10000000,'paid'),
('F0000001-0000-0000-0006-000000000004','HON-2025-0024','sale','2025-06-26','2025-07-26',
 'C0000001-0000-0000-0000-000000000004',  5882353,1117647, 7000000,'paid');

-- ── JULIO ($78M total / $65.5M neto) ───────────────────────
INSERT INTO commerce.invoices
  (id, invoice_number, type, invoice_date, due_date, customer_id,
   subtotal, tax_amount, total, status) VALUES
('F0000001-0000-0000-0007-000000000001','HON-2025-0025','sale','2025-07-07','2025-08-06',
 'C0000001-0000-0000-0000-000000000007', 33613445,6386555,40000000,'paid'),
('F0000001-0000-0000-0007-000000000002','HON-2025-0026','sale','2025-07-14','2025-08-13',
 'C0000001-0000-0000-0000-000000000009', 16806723,3193277,20000000,'paid'),
('F0000001-0000-0000-0007-000000000003','HON-2025-0027','sale','2025-07-22','2025-08-21',
 'C0000001-0000-0000-0000-000000000001',  8403361,1596639,10000000,'paid'),
('F0000001-0000-0000-0007-000000000004','HON-2025-0028','sale','2025-07-29','2025-08-28',
 'C0000001-0000-0000-0000-000000000003',  6722689,1277311, 8000000,'paid');

-- ── AGOSTO ($82M total / $68.9M neto) ──────────────────────
INSERT INTO commerce.invoices
  (id, invoice_number, type, invoice_date, due_date, customer_id,
   subtotal, tax_amount, total, status) VALUES
('F0000001-0000-0000-0008-000000000001','HON-2025-0029','sale','2025-08-05','2025-09-04',
 'C0000001-0000-0000-0000-000000000007', 37815126,7184874,45000000,'paid'),
('F0000001-0000-0000-0008-000000000002','HON-2025-0030','sale','2025-08-12','2025-09-11',
 'C0000001-0000-0000-0000-000000000005', 16806723,3193277,20000000,'paid'),
('F0000001-0000-0000-0008-000000000003','HON-2025-0031','sale','2025-08-20','2025-09-19',
 'C0000001-0000-0000-0000-000000000009', 10084034,1915966,12000000,'paid'),
('F0000001-0000-0000-0008-000000000004','HON-2025-0032','sale','2025-08-27','2025-09-26',
 'C0000001-0000-0000-0000-000000000006',  4201681, 798319, 5000000,'paid');

-- ── SEPTIEMBRE ($88M total / $73.9M neto) ──────────────────
INSERT INTO commerce.invoices
  (id, invoice_number, type, invoice_date, due_date, customer_id,
   subtotal, tax_amount, total, status) VALUES
('F0000001-0000-0000-0009-000000000001','HON-2025-0033','sale','2025-09-03','2025-10-03',
 'C0000001-0000-0000-0000-000000000007', 42016807,7983193,50000000,'paid'),
('F0000001-0000-0000-0009-000000000002','HON-2025-0034','sale','2025-09-10','2025-10-10',
 'C0000001-0000-0000-0000-000000000009', 16806723,3193277,20000000,'paid'),
('F0000001-0000-0000-0009-000000000003','HON-2025-0035','sale','2025-09-18','2025-10-18',
 'C0000001-0000-0000-0000-000000000005', 10084034,1915966,12000000,'paid'),
('F0000001-0000-0000-0009-000000000004','HON-2025-0036','sale','2025-09-25','2025-10-25',
 'C0000001-0000-0000-0000-000000000001',  5042017, 957983, 6000000,'paid');

-- ── OCTUBRE ($95M total / $79.8M neto) — mes récord ────────
INSERT INTO commerce.invoices
  (id, invoice_number, type, invoice_date, due_date, customer_id,
   subtotal, tax_amount, total, status) VALUES
('F0000001-0000-0000-0010-000000000001','HON-2025-0037','sale','2025-10-07','2025-11-06',
 'C0000001-0000-0000-0000-000000000007', 50420168,9579832,60000000,'paid'),
('F0000001-0000-0000-0010-000000000002','HON-2025-0038','sale','2025-10-14','2025-11-13',
 'C0000001-0000-0000-0000-000000000009', 16806723,3193277,20000000,'paid'),
('F0000001-0000-0000-0010-000000000003','HON-2025-0039','sale','2025-10-21','2025-11-20',
 'C0000001-0000-0000-0000-000000000005',  8403361,1596639,10000000,'paid'),
('F0000001-0000-0000-0010-000000000004','HON-2025-0040','sale','2025-10-28','2025-11-27',
 'C0000001-0000-0000-0000-000000000001',  4201681, 798319, 5000000,'paid');

-- ── NOVIEMBRE ($90M total / $75.6M neto) — emitidas ────────
INSERT INTO commerce.invoices
  (id, invoice_number, type, invoice_date, due_date, customer_id,
   subtotal, tax_amount, total, status) VALUES
('F0000001-0000-0000-0011-000000000001','HON-2025-0041','sale','2025-11-05','2025-12-05',
 'C0000001-0000-0000-0000-000000000007', 42016807,7983193,50000000,'issued'),
('F0000001-0000-0000-0011-000000000002','HON-2025-0042','sale','2025-11-12','2025-12-12',
 'C0000001-0000-0000-0000-000000000009', 16806723,3193277,20000000,'issued'),
('F0000001-0000-0000-0011-000000000003','HON-2025-0043','sale','2025-11-20','2025-12-20',
 'C0000001-0000-0000-0000-000000000005', 10084034,1915966,12000000,'issued'),
('F0000001-0000-0000-0011-000000000004','HON-2025-0044','sale','2025-11-27','2026-01-10',
 'C0000001-0000-0000-0000-000000000001',  6722689,1277311, 8000000,'issued');

-- ── DICIEMBRE — 2 borradores + 1 nota de crédito ───────────
INSERT INTO commerce.invoices
  (id, invoice_number, type, invoice_date, due_date, customer_id,
   subtotal, tax_amount, total, status) VALUES
('F0000001-0000-0000-0012-000000000001','HON-2025-0045','sale','2025-12-03','2026-01-02',
 'C0000001-0000-0000-0000-000000000007', 42016807,7983193,50000000,'draft'),
('F0000001-0000-0000-0012-000000000002','HON-2025-0046','sale','2025-12-10','2026-01-09',
 'C0000001-0000-0000-0000-000000000009', 16806723,3193277,20000000,'draft'),
('F0000001-0000-0000-0012-000000000003','NC-2025-0001','credit_note','2025-12-15',null,
 'C0000001-0000-0000-0000-000000000003', -2521008,-478992,-3000000,'issued');

-- ============================================================
-- 9. ASIENTOS CONTABLES — meses clave
-- ============================================================

-- ENERO — Ventas
INSERT INTO accounting.journal_entries
  (id, entry_number, entry_date, description, source, period_id, is_posted) VALUES
('J0000001-0000-0000-0001-000000000001','AST-2025-0001','2025-01-31',
 'Reconocimiento ingresos honorarios enero 2025','manual',
 'P0000001-0000-0000-0000-000000000001', true);

INSERT INTO accounting.journal_lines
  (journal_entry_id, account_id, debit, credit, description) VALUES
('J0000001-0000-0000-0001-000000000001','A0000001-0000-0000-0000-000000000002',42000000,0,       'CxC clientes enero'),
('J0000001-0000-0000-0001-000000000001','A0000001-0000-0000-0000-000000000050',0,        28571429,'Honorarios consultoría estratégica'),
('J0000001-0000-0000-0001-000000000001','A0000001-0000-0000-0000-000000000051',0,         5882353,'Honorarios consultoría digital'),
('J0000001-0000-0000-0001-000000000001','A0000001-0000-0000-0000-000000000052',0,         1008403,'Honorarios capacitación'),
('J0000001-0000-0000-0001-000000000001','A0000001-0000-0000-0000-000000000021',0,         6537815,'IVA débito fiscal enero');

-- ENERO — Gastos
INSERT INTO accounting.journal_entries
  (id, entry_number, entry_date, description, source, period_id, is_posted) VALUES
('J0000001-0000-0000-0001-000000000002','AST-2025-0002','2025-01-31',
 'Gastos operativos enero 2025','manual',
 'P0000001-0000-0000-0000-000000000001', true);

INSERT INTO accounting.journal_lines
  (journal_entry_id, account_id, debit, credit, description) VALUES
('J0000001-0000-0000-0001-000000000002','A0000001-0000-0000-0000-000000000070',9800000, 0,       'Remuneraciones planta enero (8 personas)'),
('J0000001-0000-0000-0001-000000000002','A0000001-0000-0000-0000-000000000060',5200000, 0,       'Honorarios consultores externos proyecto Codelco'),
('J0000001-0000-0000-0001-000000000002','A0000001-0000-0000-0000-000000000071',2800000, 0,       'Arriendo oficinas Providencia enero'),
('J0000001-0000-0000-0001-000000000002','A0000001-0000-0000-0000-000000000072', 420000, 0,       'Internet + telefonía + nube enero'),
('J0000001-0000-0000-0001-000000000002','A0000001-0000-0000-0000-000000000075', 380000, 0,       'Depreciación equipos enero'),
('J0000001-0000-0000-0001-000000000002','A0000001-0000-0000-0000-000000000001',0,       18600000,'Pago gastos desde cuenta corriente');

-- JUNIO — Mes del primer salto de crecimiento
INSERT INTO accounting.journal_entries
  (id, entry_number, entry_date, description, source, period_id, is_posted) VALUES
('J0000001-0000-0000-0006-000000000001','AST-2025-0101','2025-06-30',
 'Reconocimiento ingresos honorarios junio 2025','manual',
 'P0000001-0000-0000-0000-000000000006', true);

INSERT INTO accounting.journal_lines
  (journal_entry_id, account_id, debit, credit, description) VALUES
('J0000001-0000-0000-0006-000000000001','A0000001-0000-0000-0000-000000000002',72000000,0,       'CxC clientes junio'),
('J0000001-0000-0000-0006-000000000001','A0000001-0000-0000-0000-000000000050',0,        39495798,'Honorarios estrategia + sector público junio'),
('J0000001-0000-0000-0006-000000000001','A0000001-0000-0000-0000-000000000051',0,        12605042,'Honorarios digital junio'),
('J0000001-0000-0000-0006-000000000001','A0000001-0000-0000-0000-000000000053',0,         8403361,'Outsourcing CFO 3 clientes junio'),
('J0000001-0000-0000-0006-000000000001','A0000001-0000-0000-0000-000000000021',0,        11495799,'IVA débito fiscal junio');

-- OCTUBRE — Mes récord
INSERT INTO accounting.journal_entries
  (id, entry_number, entry_date, description, source, period_id, is_posted) VALUES
('J0000001-0000-0000-0010-000000000001','AST-2025-0181','2025-10-31',
 'Reconocimiento ingresos honorarios octubre 2025 — RÉCORD','manual',
 'P0000001-0000-0000-0000-000000000010', true);

INSERT INTO accounting.journal_lines
  (journal_entry_id, account_id, debit, credit, description) VALUES
('J0000001-0000-0000-0010-000000000001','A0000001-0000-0000-0000-000000000002',95000000,0,       'CxC clientes octubre'),
('J0000001-0000-0000-0010-000000000001','A0000001-0000-0000-0000-000000000050',0,        46218487,'Honorarios estrategia octubre'),
('J0000001-0000-0000-0010-000000000001','A0000001-0000-0000-0000-000000000051',0,        14705882,'Honorarios digital octubre'),
('J0000001-0000-0000-0010-000000000001','A0000001-0000-0000-0000-000000000053',0,        18907563,'Outsourcing CFO 8 clientes octubre'),
('J0000001-0000-0000-0010-000000000001','A0000001-0000-0000-0000-000000000021',0,        15168068,'IVA débito fiscal octubre');

-- NOVIEMBRE — Asiento BORRADOR para demostrar flujo de aprobación
INSERT INTO accounting.journal_entries
  (id, entry_number, entry_date, description, source, period_id, is_posted) VALUES
('J0000001-0000-0000-0011-000000000001','AST-2025-0221','2025-11-30',
 'BORRADOR: Cierre provisorio noviembre 2025 — pendiente aprobación CFO','manual',
 'P0000001-0000-0000-0000-000000000011', false);

INSERT INTO accounting.journal_lines
  (journal_entry_id, account_id, debit, credit, description) VALUES
('J0000001-0000-0000-0011-000000000001','A0000001-0000-0000-0000-000000000002',90000000,0,       'CxC provisorio noviembre'),
('J0000001-0000-0000-0011-000000000001','A0000001-0000-0000-0000-000000000050',0,        50420168,'Honorarios estrategia noviembre (est.)'),
('J0000001-0000-0000-0011-000000000001','A0000001-0000-0000-0000-000000000051',0,        14285714,'Honorarios digital noviembre (est.)'),
('J0000001-0000-0000-0011-000000000001','A0000001-0000-0000-0000-000000000053',0,        10924370,'Outsourcing CFO noviembre (est.)'),
('J0000001-0000-0000-0011-000000000001','A0000001-0000-0000-0000-000000000021',0,        14369748,'IVA débito provisorio noviembre');

-- ============================================================
-- 10. PPM — 10 MESES PAGADOS
-- Base: ingresos brutos de cada mes (facturación total con IVA)
-- Tasa: 2.8%
-- ============================================================
INSERT INTO taxes.ppm_payments
  (id, period_month, period_year, gross_income, ppm_rate, ppm_amount,
   is_suspended, paid_at) VALUES
('PP000001-0000-0000-0000-000000000001', 1,2025, 42000000,0.028,1176000,false,'2025-02-12 10:00:00'),
('PP000001-0000-0000-0000-000000000002', 2,2025, 48000000,0.028,1344000,false,'2025-03-12 10:00:00'),
('PP000001-0000-0000-0000-000000000003', 3,2025, 55000000,0.028,1540000,false,'2025-04-12 10:00:00'),
('PP000001-0000-0000-0000-000000000004', 4,2025, 60000000,0.028,1680000,false,'2025-05-12 10:00:00'),
('PP000001-0000-0000-0000-000000000005', 5,2025, 65000000,0.028,1820000,false,'2025-06-12 10:00:00'),
('PP000001-0000-0000-0000-000000000006', 6,2025, 72000000,0.028,2016000,false,'2025-07-12 10:00:00'),
('PP000001-0000-0000-0000-000000000007', 7,2025, 78000000,0.028,2184000,false,'2025-08-12 10:00:00'),
('PP000001-0000-0000-0000-000000000008', 8,2025, 82000000,0.028,2296000,false,'2025-09-12 10:00:00'),
('PP000001-0000-0000-0000-000000000009', 9,2025, 88000000,0.028,2464000,false,'2025-10-12 10:00:00'),
('PP000001-0000-0000-0000-000000000010',10,2025, 95000000,0.028,2660000,false,'2025-11-12 10:00:00');

-- ============================================================
-- 11. RESULTADO TRIBUTARIO 2024 (para cálculo de tasa PPM)
-- ============================================================
INSERT INTO taxes.tax_results
  (id, tax_year, gross_income, net_income, tax_base,
   first_category_tax, accumulated_loss) VALUES
('TR000001-0000-0000-0000-000000000001',
 2024, 680000000, 147000000, 147000000, 37044000, 0);
-- tasa efectiva PPM 2025 = 37.044.000 / 680.000.000 ≈ 5.45% → tope 5% → se usa 2.8% pactada

COMMIT;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
SELECT '=== RESUMEN DE CARGA ===' AS info;
SELECT 'Usuarios'    AS tabla, COUNT(*) AS registros FROM users.users
UNION ALL
SELECT 'Períodos',   COUNT(*) FROM accounting.periods
UNION ALL
SELECT 'Cuentas',    COUNT(*) FROM accounting.accounts
UNION ALL
SELECT 'Clientes',   COUNT(*) FROM commerce.customers
UNION ALL
SELECT 'Proveedores',COUNT(*) FROM commerce.vendors
UNION ALL
SELECT 'Servicios',  COUNT(*) FROM inventory.products
UNION ALL
SELECT 'Facturas',   COUNT(*) FROM commerce.invoices
UNION ALL
SELECT 'Asientos',   COUNT(*) FROM accounting.journal_entries
UNION ALL
SELECT 'Líneas cont.',COUNT(*) FROM accounting.journal_lines
UNION ALL
SELECT 'PPM pagados',COUNT(*) FROM taxes.ppm_payments;

SELECT '' AS separador;
SELECT '=== CREDENCIALES ===' AS info;
SELECT
  email,
  full_name,
  role,
  'Consul2025!' AS password
FROM users.users
ORDER BY
  CASE role WHEN 'admin' THEN 1 WHEN 'contador' THEN 2 ELSE 3 END,
  email;
