-- ============================================================
-- PARTE 2 — Schema SII para DTEs
-- Ejecutar en Neon SQL Editor (una sola vez)
-- ============================================================

CREATE SCHEMA IF NOT EXISTS sii;

-- ── Tipos de DTE soportados ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sii.document_types (
    id          SMALLINT PRIMARY KEY,
    code        SMALLINT UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO sii.document_types (id, code, name, description) VALUES
(1,  33, 'Factura Afecta',          'Factura electrónica con IVA'),
(2,  34, 'Factura Exenta',          'Factura electrónica sin IVA'),
(3,  39, 'Boleta Afecta',           'Boleta electrónica con IVA'),
(4,  41, 'Boleta Exenta',           'Boleta electrónica sin IVA'),
(5,  56, 'Nota de Débito',          'Nota de débito electrónica'),
(6,  61, 'Nota de Crédito',         'Nota de crédito electrónica')
ON CONFLICT (id) DO NOTHING;

-- ── Folios CAF por tipo de documento ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sii.caf_folios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type   SMALLINT NOT NULL REFERENCES sii.document_types(code),
    folio_desde     INTEGER NOT NULL,
    folio_hasta     INTEGER NOT NULL,
    folio_actual    INTEGER NOT NULL,
    caf_xml         TEXT NOT NULL,        -- XML del CAF entregado por SII (no exponer en GETs)
    fecha_vencimiento DATE,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_range CHECK (folio_desde <= folio_actual AND folio_actual <= folio_hasta)
);

-- ── DTEs emitidos ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sii.dte_emitidos (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id            UUID REFERENCES commerce.invoices(id),
    document_type         SMALLINT NOT NULL REFERENCES sii.document_types(code),
    folio                 INTEGER NOT NULL,
    fecha_emision         DATE NOT NULL,
    rut_receptor          VARCHAR(20) NOT NULL,
    razon_social_receptor VARCHAR(255) NOT NULL,
    monto_neto            NUMERIC(18,0) NOT NULL DEFAULT 0,
    monto_iva             NUMERIC(18,0) NOT NULL DEFAULT 0,
    monto_total           NUMERIC(18,0) NOT NULL DEFAULT 0,
    xml_firmado           TEXT,           -- XML completo firmado (disponible con certificado)
    track_id              VARCHAR(50),    -- ID de seguimiento en SII
    estado_sii            VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE'
                          CHECK (estado_sii IN (
                              'PENDIENTE',          -- generado, aún no enviado
                              'ENVIADO',            -- enviado al SII
                              'ACEPTADO',           -- aceptado por SII
                              'ACEPTADO_REPAROS',   -- aceptado con observaciones
                              'RECHAZADO',          -- rechazado por SII
                              'ANULADO'             -- anulado internamente
                          )),
    error_mensaje         TEXT,           -- mensaje de error si fue rechazado
    pdf_url               TEXT,           -- URL del PDF almacenado
    ambiente              VARCHAR(20) NOT NULL DEFAULT 'CERTIFICACION',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (document_type, folio, ambiente)
);

-- ── Índices ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_dte_invoice    ON sii.dte_emitidos(invoice_id);
CREATE INDEX IF NOT EXISTS idx_dte_estado     ON sii.dte_emitidos(estado_sii);
CREATE INDEX IF NOT EXISTS idx_dte_receptor   ON sii.dte_emitidos(rut_receptor);
CREATE INDEX IF NOT EXISTS idx_dte_fecha      ON sii.dte_emitidos(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_caf_type       ON sii.caf_folios(document_type);
