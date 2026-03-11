"""V004 - Create commerce schema: customers, vendors, invoices, invoice_items

Revision ID: v004
Revises: v003
Create Date: 2026-03-10

-- ROLLBACK:
-- DROP TABLE IF EXISTS commerce.invoice_items CASCADE;
-- DROP TABLE IF EXISTS commerce.invoices CASCADE;
-- DROP TABLE IF EXISTS commerce.vendors CASCADE;
-- DROP TABLE IF EXISTS commerce.customers CASCADE;
-- DROP SCHEMA IF EXISTS commerce;
"""
from alembic import op


revision = 'v004'
down_revision = 'v003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS commerce")

    # ----- customers -----
    op.execute("""
        CREATE TABLE IF NOT EXISTS commerce.customers (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            rut           VARCHAR(12) UNIQUE,
            name          VARCHAR(255) NOT NULL,
            email         VARCHAR(255),
            phone         VARCHAR(30),
            address       TEXT,
            payment_days  INT NOT NULL DEFAULT 30,
            credit_limit  NUMERIC(18,2),
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at    TIMESTAMPTZ
        )
    """)
    op.execute("CREATE INDEX idx_customers_rut ON commerce.customers(rut)")
    op.execute("""
        CREATE TRIGGER trigger_customers_updated_at
            BEFORE UPDATE ON commerce.customers
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    """)

    # ----- vendors -----
    op.execute("""
        CREATE TABLE IF NOT EXISTS commerce.vendors (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            rut           VARCHAR(12) UNIQUE,
            name          VARCHAR(255) NOT NULL,
            email         VARCHAR(255),
            phone         VARCHAR(30),
            address       TEXT,
            payment_days  INT NOT NULL DEFAULT 30,
            credit_limit  NUMERIC(18,2),
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at    TIMESTAMPTZ
        )
    """)
    op.execute("CREATE INDEX idx_vendors_rut ON commerce.vendors(rut)")
    op.execute("""
        CREATE TRIGGER trigger_vendors_updated_at
            BEFORE UPDATE ON commerce.vendors
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    """)

    # ----- invoices -----
    op.execute("""
        CREATE TABLE IF NOT EXISTS commerce.invoices (
            id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            invoice_number    VARCHAR(20) UNIQUE NOT NULL,
            type              VARCHAR(20) NOT NULL
                                  CONSTRAINT chk_invoices_type CHECK (type IN ('sale','purchase','credit_note','debit_note')),
            invoice_date      DATE NOT NULL,
            due_date          DATE,
            customer_id       UUID REFERENCES commerce.customers(id),
            vendor_id         UUID REFERENCES commerce.vendors(id),
            subtotal          NUMERIC(18,2),
            tax_amount        NUMERIC(18,2),
            total             NUMERIC(18,2),
            status            VARCHAR(20) NOT NULL DEFAULT 'draft'
                                  CONSTRAINT chk_invoices_status CHECK (status IN ('draft','issued','paid','cancelled')),
            journal_entry_id  UUID REFERENCES accounting.journal_entries(id),
            created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at        TIMESTAMPTZ
        )
    """)
    op.execute("""
        CREATE INDEX idx_invoices_invoice_date ON commerce.invoices(invoice_date);
        CREATE INDEX idx_invoices_customer_id  ON commerce.invoices(customer_id);
        CREATE INDEX idx_invoices_vendor_id    ON commerce.invoices(vendor_id);
        CREATE INDEX idx_invoices_status       ON commerce.invoices(status);
    """)
    op.execute("""
        CREATE TRIGGER trigger_invoices_updated_at
            BEFORE UPDATE ON commerce.invoices
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    """)

    # ----- invoice_items -----
    op.execute("""
        CREATE TABLE IF NOT EXISTS commerce.invoice_items (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            invoice_id  UUID NOT NULL REFERENCES commerce.invoices(id) ON DELETE CASCADE,
            product_id  UUID,
            description TEXT,
            quantity    NUMERIC(10,3) NOT NULL,
            unit_price  NUMERIC(18,2) NOT NULL,
            discount    NUMERIC(5,2) NOT NULL DEFAULT 0,
            subtotal    NUMERIC(18,2) NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at  TIMESTAMPTZ
        )
    """)
    op.execute("CREATE INDEX idx_invoice_items_invoice_id ON commerce.invoice_items(invoice_id)")
    op.execute("""
        CREATE TRIGGER trigger_invoice_items_updated_at
            BEFORE UPDATE ON commerce.invoice_items
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    """)


def downgrade() -> None:
    for tbl in ['invoice_items', 'invoices', 'vendors', 'customers']:
        op.execute(f"DROP TRIGGER IF EXISTS trigger_{tbl}_updated_at ON commerce.{tbl}")
    op.execute("DROP TABLE IF EXISTS commerce.invoice_items CASCADE")
    op.execute("DROP TABLE IF EXISTS commerce.invoices       CASCADE")
    op.execute("DROP TABLE IF EXISTS commerce.vendors        CASCADE")
    op.execute("DROP TABLE IF EXISTS commerce.customers      CASCADE")
    op.execute("DROP SCHEMA IF EXISTS commerce")
