"""V007 - Create financial schema: bsc_snapshots

Revision ID: v007
Revises: v006
Create Date: 2026-03-10

-- ROLLBACK:
-- DROP TABLE IF EXISTS financial.bsc_snapshots CASCADE;
-- DROP SCHEMA IF EXISTS financial;
"""
from alembic import op


revision = 'v007'
down_revision = 'v006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS financial")

    # ----- bsc_snapshots -----
    op.execute("""
        CREATE TABLE IF NOT EXISTS financial.bsc_snapshots (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            period_id       UUID NOT NULL REFERENCES accounting.periods(id),
            metric_name     VARCHAR(100) NOT NULL,
            metric_value    NUMERIC(18,6),
            metric_unit     VARCHAR(20),
            calculated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at      TIMESTAMPTZ,
            CONSTRAINT uq_bsc_snapshot_period_metric UNIQUE (period_id, metric_name)
        )
    """)
    op.execute("""
        CREATE INDEX idx_bsc_snapshots_period_id   ON financial.bsc_snapshots(period_id);
        CREATE INDEX idx_bsc_snapshots_metric_name ON financial.bsc_snapshots(metric_name);
        CREATE INDEX idx_bsc_snapshots_calculated_at ON financial.bsc_snapshots(calculated_at DESC);
    """)
    op.execute("""
        CREATE TRIGGER trigger_bsc_snapshots_updated_at
            BEFORE UPDATE ON financial.bsc_snapshots
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trigger_bsc_snapshots_updated_at ON financial.bsc_snapshots")
    op.execute("DROP TABLE IF EXISTS financial.bsc_snapshots CASCADE")
    op.execute("DROP SCHEMA IF EXISTS financial")
