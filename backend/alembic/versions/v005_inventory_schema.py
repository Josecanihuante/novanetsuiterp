"""V005 - Create inventory schema: products, stock_movements

Revision ID: v005
Revises: v004
Create Date: 2026-03-10

-- ROLLBACK:
-- DROP TABLE IF EXISTS inventory.stock_movements CASCADE;
-- DROP TABLE IF EXISTS inventory.products CASCADE;
-- DROP SCHEMA IF EXISTS inventory;
"""
from alembic import op


revision = 'v005'
down_revision = 'v004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS inventory")

    # ----- products -----
    op.execute("""
        CREATE TABLE IF NOT EXISTS inventory.products (
            id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            sku               VARCHAR(50) UNIQUE NOT NULL,
            name              VARCHAR(255) NOT NULL,
            description       TEXT,
            category          VARCHAR(100),
            unit_cost         NUMERIC(18,2),
            sale_price        NUMERIC(18,2),
            stock_quantity    NUMERIC(10,3) NOT NULL DEFAULT 0,
            reorder_point     NUMERIC(10,3) NOT NULL DEFAULT 0,
            valuation_method  VARCHAR(10) NOT NULL DEFAULT 'PP'
                                  CONSTRAINT chk_products_valuation CHECK (valuation_method IN ('PEPS','PP')),
            created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at        TIMESTAMPTZ
        )
    """)
    op.execute("""
        CREATE INDEX idx_products_sku      ON inventory.products(sku);
        CREATE INDEX idx_products_category ON inventory.products(category);
    """)
    op.execute("""
        CREATE TRIGGER trigger_products_updated_at
            BEFORE UPDATE ON inventory.products
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    """)

    # ----- stock_movements -----
    op.execute("""
        CREATE TABLE IF NOT EXISTS inventory.stock_movements (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id      UUID NOT NULL REFERENCES inventory.products(id),
            movement_type   VARCHAR(20) NOT NULL
                                CONSTRAINT chk_sm_type CHECK (movement_type IN ('in','out','adjustment')),
            quantity        NUMERIC(10,3) NOT NULL,
            unit_cost       NUMERIC(18,2),
            reference_id    UUID,
            reference_type  VARCHAR(30),
            movement_date   DATE NOT NULL,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at      TIMESTAMPTZ
        )
    """)
    op.execute("""
        CREATE INDEX idx_stock_movements_product_id    ON inventory.stock_movements(product_id);
        CREATE INDEX idx_stock_movements_movement_date ON inventory.stock_movements(movement_date);
    """)
    op.execute("""
        CREATE TRIGGER trigger_stock_movements_updated_at
            BEFORE UPDATE ON inventory.stock_movements
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trigger_stock_movements_updated_at ON inventory.stock_movements")
    op.execute("DROP TRIGGER IF EXISTS trigger_products_updated_at         ON inventory.products")
    op.execute("DROP TABLE IF EXISTS inventory.stock_movements CASCADE")
    op.execute("DROP TABLE IF EXISTS inventory.products       CASCADE")
    op.execute("DROP SCHEMA IF EXISTS inventory")
