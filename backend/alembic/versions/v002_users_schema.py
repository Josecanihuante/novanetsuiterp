"""V002 - Create users schema and users table

Revision ID: v002
Revises: v001
Create Date: 2026-03-10

-- ROLLBACK:
-- DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP SCHEMA IF EXISTS users;
"""
from alembic import op
import sqlalchemy as sa


revision = 'v002'
down_revision = 'v001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Shared updated_at trigger function (created once)
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("CREATE SCHEMA IF NOT EXISTS users")

    op.execute("""
        CREATE TABLE IF NOT EXISTS users.users (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email           VARCHAR(255) UNIQUE NOT NULL,
            full_name       VARCHAR(255) NOT NULL,
            hashed_password TEXT NOT NULL,
            role            VARCHAR(20) NOT NULL DEFAULT 'viewer'
                                CONSTRAINT chk_users_role CHECK (role IN ('admin','contador','viewer')),
            is_active       BOOLEAN NOT NULL DEFAULT true,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at      TIMESTAMPTZ
        )
    """)

    op.execute("""
        CREATE INDEX idx_users_email      ON users.users(email);
        CREATE INDEX idx_users_is_active  ON users.users(is_active) WHERE is_active = true;
        CREATE INDEX idx_users_deleted_at ON users.users(deleted_at) WHERE deleted_at IS NULL;
    """)

    op.execute("""
        CREATE TRIGGER trigger_users_updated_at
            BEFORE UPDATE ON users.users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trigger_users_updated_at ON users.users")
    op.execute("DROP TABLE IF EXISTS users.users CASCADE")
    op.execute("DROP SCHEMA IF EXISTS users")
