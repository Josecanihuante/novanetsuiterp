"""V006 - Create taxes schema: tax_config, ppm_payments, tax_results

Revision ID: v006
Revises: v005
Create Date: 2026-03-10

-- ROLLBACK:
-- DROP TABLE IF EXISTS taxes.tax_results CASCADE;
-- DROP TABLE IF EXISTS taxes.ppm_payments CASCADE;
-- DROP TABLE IF EXISTS taxes.tax_config CASCADE;
-- DROP SCHEMA IF EXISTS taxes;
"""
from alembic import op


revision = 'v006'
down_revision = 'v005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS taxes")

    # ----- tax_config -----
    op.execute("""
        CREATE TABLE IF NOT EXISTS taxes.tax_config (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_rut   VARCHAR(12) NOT NULL,
            company_name  VARCHAR(255) NOT NULL,
            tax_regime    VARCHAR(20) NOT NULL
                              CONSTRAINT chk_tc_regime CHECK (tax_regime IN ('general','pro_pyme','presunta')),
            ppm_rate      NUMERIC(8,4),
            tax_year      INT NOT NULL,
            is_active     BOOLEAN NOT NULL DEFAULT true,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at    TIMESTAMPTZ
        )
    """)
    op.execute("""
        CREATE TRIGGER trigger_tax_config_updated_at
            BEFORE UPDATE ON taxes.tax_config
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    """)

    # ----- ppm_payments -----
    op.execute("""
        CREATE TABLE IF NOT EXISTS taxes.ppm_payments (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            period_month        INT NOT NULL CONSTRAINT chk_ppm_month CHECK (period_month BETWEEN 1 AND 12),
            period_year         INT NOT NULL,
            gross_income        NUMERIC(18,2) NOT NULL,
            ppm_rate            NUMERIC(8,4) NOT NULL,
            ppm_amount          NUMERIC(18,2) NOT NULL,
            is_suspended        BOOLEAN NOT NULL DEFAULT false,
            suspension_reason   TEXT,
            paid_at             TIMESTAMPTZ,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at          TIMESTAMPTZ,
            CONSTRAINT uq_ppm_period UNIQUE (period_month, period_year)
        )
    """)
    op.execute("""
        CREATE TRIGGER trigger_ppm_payments_updated_at
            BEFORE UPDATE ON taxes.ppm_payments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    """)

    # ----- tax_results -----
    op.execute("""
        CREATE TABLE IF NOT EXISTS taxes.tax_results (
            id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tax_year              INT UNIQUE NOT NULL,
            gross_income          NUMERIC(18,2),
            net_income            NUMERIC(18,2),
            tax_base              NUMERIC(18,2),
            first_category_tax    NUMERIC(18,2),
            accumulated_loss      NUMERIC(18,2) NOT NULL DEFAULT 0,
            created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at            TIMESTAMPTZ
        )
    """)
    op.execute("""
        CREATE TRIGGER trigger_tax_results_updated_at
            BEFORE UPDATE ON taxes.tax_results
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    """)


def downgrade() -> None:
    for tbl in ['tax_results', 'ppm_payments', 'tax_config']:
        op.execute(f"DROP TRIGGER IF EXISTS trigger_{tbl}_updated_at ON taxes.{tbl}")
    op.execute("DROP TABLE IF EXISTS taxes.tax_results  CASCADE")
    op.execute("DROP TABLE IF EXISTS taxes.ppm_payments CASCADE")
    op.execute("DROP TABLE IF EXISTS taxes.tax_config   CASCADE")
    op.execute("DROP SCHEMA IF EXISTS taxes")
