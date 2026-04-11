-- ============================================================
-- PARTE 1 — Contabilización Automática de Facturas
-- Ejecutar en Neon SQL Editor (una sola vez)
-- ============================================================

-- ── Tabla de mapeo de cuentas contables por tipo de factura ──────────────────
CREATE TABLE IF NOT EXISTS accounting.invoice_account_mapping (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mapping_type    VARCHAR(20) NOT NULL
                    CHECK (mapping_type IN ('sale', 'purchase', 'credit_note')),
    -- Cuentas para facturas de VENTA (débito CxC / crédito Ingresos + IVA DF)
    account_receivable_id   UUID REFERENCES accounting.accounts(id),
    account_income_id       UUID REFERENCES accounting.accounts(id),
    account_iva_debito_id   UUID REFERENCES accounting.accounts(id),
    -- Cuentas para facturas de COMPRA (débito Gasto + IVA CF / crédito CxP)
    account_payable_id      UUID REFERENCES accounting.accounts(id),
    account_expense_id      UUID REFERENCES accounting.accounts(id),
    account_iva_credito_id  UUID REFERENCES accounting.accounts(id),
    -- Metadata
    description     VARCHAR(255),
    is_default      BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_by      UUID REFERENCES users.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mapping_type
    ON accounting.invoice_account_mapping(mapping_type, is_active);

-- ── Tabla de facturas recibidas (compras desde SII) ───────────────────────────
CREATE TABLE IF NOT EXISTS commerce.purchase_invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type       SMALLINT NOT NULL DEFAULT 33,
    folio               INTEGER NOT NULL,
    fecha_emision       TIMESTAMPTZ NOT NULL,
    fecha_recepcion     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rut_emisor          VARCHAR(20) NOT NULL,
    razon_social_emisor VARCHAR(255) NOT NULL,
    vendor_id           UUID REFERENCES commerce.vendors(id),
    monto_neto          NUMERIC(18,2) NOT NULL DEFAULT 0,
    monto_iva           NUMERIC(18,2) NOT NULL DEFAULT 0,
    monto_total         NUMERIC(18,2) NOT NULL DEFAULT 0,
    journal_entry_id    UUID REFERENCES accounting.journal_entries(id),
    account_mapping_id  UUID REFERENCES accounting.invoice_account_mapping(id),
    status              VARCHAR(30) NOT NULL DEFAULT 'pendiente'
                        CHECK (status IN ('pendiente','contabilizada','anulada')),
    source              VARCHAR(20) NOT NULL DEFAULT 'sii_import'
                        CHECK (source IN ('sii_import','manual')),
    sii_import_batch_id UUID,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (document_type, folio, rut_emisor)
);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_rut    ON commerce.purchase_invoices(rut_emisor);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_fecha  ON commerce.purchase_invoices(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON commerce.purchase_invoices(status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_vendor ON commerce.purchase_invoices(vendor_id);

-- ── Agregar columnas a commerce.invoices ──────────────────────────────────────
ALTER TABLE commerce.invoices
    ADD COLUMN IF NOT EXISTS journal_entry_id   UUID REFERENCES accounting.journal_entries(id);

ALTER TABLE commerce.invoices
    ADD COLUMN IF NOT EXISTS account_mapping_id UUID REFERENCES accounting.invoice_account_mapping(id);

-- ============================================================
-- PASO MANUAL POST-DEPLOY: insertar mapeos por defecto
-- Ejecutar DESPUÉS de que el backend haya desplegado
-- ============================================================
INSERT INTO accounting.invoice_account_mapping
    (mapping_type, description, is_default,
     account_receivable_id, account_income_id, account_iva_debito_id)
SELECT
    'sale',
    'Mapeo por defecto — Honorarios Consultoría',
    true,
    (SELECT id FROM accounting.accounts WHERE code = '1-1-002'),
    (SELECT id FROM accounting.accounts WHERE code = '4-1-001'),
    (SELECT id FROM accounting.accounts WHERE code = '2-1-002')
WHERE NOT EXISTS (
    SELECT 1 FROM accounting.invoice_account_mapping
    WHERE mapping_type = 'sale' AND is_default = true
);

INSERT INTO accounting.invoice_account_mapping
    (mapping_type, description, is_default,
     account_payable_id, account_expense_id, account_iva_credito_id)
SELECT
    'purchase',
    'Mapeo por defecto — Gastos generales',
    true,
    (SELECT id FROM accounting.accounts WHERE code = '2-1-001'),
    (SELECT id FROM accounting.accounts WHERE code = '5-1-001'),
    (SELECT id FROM accounting.accounts WHERE code = '1-1-004')
WHERE NOT EXISTS (
    SELECT 1 FROM accounting.invoice_account_mapping
    WHERE mapping_type = 'purchase' AND is_default = true
);
