"""V003 - Create accounting schema: periods, accounts, journal_entries, journal_lines

Revision ID: v003
Revises: v002
Create Date: 2026-03-10

-- ROLLBACK:
-- DROP TABLE IF EXISTS accounting.journal_lines CASCADE;
-- DROP TABLE IF EXISTS accounting.journal_entries CASCADE;
-- DROP TABLE IF EXISTS accounting.accounts CASCADE;
-- DROP TABLE IF EXISTS accounting.periods CASCADE;
-- DROP SCHEMA IF EXISTS accounting;
"""
from alembic import op


revision = 'v003'
down_revision = 'v002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS accounting")

    # ----- periods -----
    op.execute("""
        CREATE TABLE IF NOT EXISTS accounting.periods (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name        VARCHAR(100) NOT NULL,
            start_date  DATE NOT NULL,
            end_date    DATE NOT NULL,
            is_closed   BOOLEAN NOT NULL DEFAULT false,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at  TIMESTAMPTZ,
            CONSTRAINT chk_periods_dates CHECK (end_date >= start_date)
        )
    """)
    op.execute("""
        CREATE TRIGGER trigger_periods_updated_at
            BEFORE UPDATE ON accounting.periods
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    """)

    # ----- accounts -----
    op.execute("""
        CREATE TABLE IF NOT EXISTS accounting.accounts (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code                VARCHAR(20) UNIQUE NOT NULL,
            name                VARCHAR(255) NOT NULL,
            type                VARCHAR(20) NOT NULL
                                    CONSTRAINT chk_accounts_type CHECK (type IN ('asset','liability','equity','income','expense')),
            subtype             VARCHAR(50),
            netsuite_category   VARCHAR(100),
            parent_id           UUID REFERENCES accounting.accounts(id),
            is_active           BOOLEAN NOT NULL DEFAULT true,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at          TIMESTAMPTZ
        )
    """)
    op.execute("""
        CREATE INDEX idx_accounts_netsuite_category ON accounting.accounts(netsuite_category);
        CREATE INDEX idx_accounts_parent_id         ON accounting.accounts(parent_id);
        CREATE INDEX idx_accounts_type              ON accounting.accounts(type);
    """)
    op.execute("""
        CREATE TRIGGER trigger_accounts_updated_at
            BEFORE UPDATE ON accounting.accounts
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    """)

    # ----- journal_entries -----
    op.execute("""
        CREATE TABLE IF NOT EXISTS accounting.journal_entries (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entry_number     VARCHAR(20) UNIQUE NOT NULL,
            entry_date       DATE NOT NULL,
            description      TEXT,
            source           VARCHAR(30) NOT NULL DEFAULT 'manual'
                                 CONSTRAINT chk_je_source CHECK (source IN ('manual','invoice','import_netsuite','system')),
            period_id        UUID REFERENCES accounting.periods(id),
            import_batch_id  UUID,
            is_posted        BOOLEAN NOT NULL DEFAULT false,
            created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at       TIMESTAMPTZ
        )
    """)
    op.execute("""
        CREATE INDEX idx_journal_entries_entry_date ON accounting.journal_entries(entry_date);
        CREATE INDEX idx_journal_entries_period_id  ON accounting.journal_entries(period_id);
        CREATE INDEX idx_journal_entries_is_posted  ON accounting.journal_entries(is_posted);
    """)
    op.execute("""
        CREATE TRIGGER trigger_journal_entries_updated_at
            BEFORE UPDATE ON accounting.journal_entries
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    """)

    # ----- journal_lines -----
    op.execute("""
        CREATE TABLE IF NOT EXISTS accounting.journal_lines (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            journal_entry_id UUID NOT NULL REFERENCES accounting.journal_entries(id) ON DELETE CASCADE,
            account_id       UUID NOT NULL REFERENCES accounting.accounts(id),
            debit            NUMERIC(18,2) NOT NULL DEFAULT 0 CONSTRAINT chk_jl_debit CHECK (debit >= 0),
            credit           NUMERIC(18,2) NOT NULL DEFAULT 0 CONSTRAINT chk_jl_credit CHECK (credit >= 0),
            description      TEXT,
            created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at       TIMESTAMPTZ
        )
    """)
    op.execute("""
        CREATE INDEX idx_journal_lines_account_id       ON accounting.journal_lines(account_id);
        CREATE INDEX idx_journal_lines_journal_entry_id ON accounting.journal_lines(journal_entry_id);
    """)
    op.execute("""
        CREATE TRIGGER trigger_journal_lines_updated_at
            BEFORE UPDATE ON accounting.journal_lines
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trigger_journal_lines_updated_at  ON accounting.journal_lines")
    op.execute("DROP TRIGGER IF EXISTS trigger_journal_entries_updated_at ON accounting.journal_entries")
    op.execute("DROP TRIGGER IF EXISTS trigger_accounts_updated_at        ON accounting.accounts")
    op.execute("DROP TRIGGER IF EXISTS trigger_periods_updated_at         ON accounting.periods")
    op.execute("DROP TABLE IF EXISTS accounting.journal_lines   CASCADE")
    op.execute("DROP TABLE IF EXISTS accounting.journal_entries CASCADE")
    op.execute("DROP TABLE IF EXISTS accounting.accounts        CASCADE")
    op.execute("DROP TABLE IF EXISTS accounting.periods         CASCADE")
    op.execute("DROP SCHEMA IF EXISTS accounting")
