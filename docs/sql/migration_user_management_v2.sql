-- ============================================================
-- SCRIPT SQL — Gestión de Usuarios Multi-tenant
-- Ejecutar en Neon SQL Editor en este orden exacto
-- ============================================================

-- PASO 1: Crear tabla de empresas
CREATE TABLE IF NOT EXISTS users.companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut             VARCHAR(20) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    trade_name      VARCHAR(255),
    activity        VARCHAR(255),
    address         TEXT,
    city            VARCHAR(100),
    phone           VARCHAR(50),
    email           VARCHAR(255),
    logo_url        TEXT,
    tax_regime      VARCHAR(30) DEFAULT 'general'
                    CHECK (tax_regime IN ('general','pro_pyme','micro_empresa')),
    ppm_rate        NUMERIC(8,6) DEFAULT 0.028,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PASO 2: Agregar columnas a users.users (todas nullable para no romper datos existentes)
ALTER TABLE users.users
    ADD COLUMN IF NOT EXISTS company_id  UUID REFERENCES users.companies(id),
    ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES users.users(id),
    ADD COLUMN IF NOT EXISTS last_login  TIMESTAMPTZ;

-- PASO 3: Actualizar el CHECK de roles para incluir superadmin y el español correcto
ALTER TABLE users.users DROP CONSTRAINT IF EXISTS check_role;
ALTER TABLE users.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users.users DROP CONSTRAINT IF EXISTS chk_users_role;

ALTER TABLE users.users
    ADD CONSTRAINT chk_users_role
    CHECK (role IN ('superadmin', 'admin', 'contador', 'viewer'));

-- PASO 4: Crear empresa Innova Consulting (la empresa existente)
INSERT INTO users.companies (id, rut, name, activity, tax_regime, ppm_rate)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    '76.987.654-3',
    'Innova Consulting Group SpA',
    'Consultoría de Estrategia y Transformación Digital',
    'general',
    0.028
) ON CONFLICT (rut) DO NOTHING;

-- PASO 5: Asignar company_id a todos los usuarios existentes
UPDATE users.users
SET company_id = '10000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

-- PASO 6: Índices
CREATE INDEX IF NOT EXISTS idx_users_company_id
    ON users.users(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_active
    ON users.users(role, is_active) WHERE deleted_at IS NULL;

-- PASO 7: Verificar que todo quedó bien
SELECT
    c.name AS empresa,
    u.email,
    u.role,
    u.is_active,
    u.company_id IS NOT NULL AS tiene_empresa
FROM users.users u
LEFT JOIN users.companies c ON c.id = u.company_id
ORDER BY u.role, u.email;

-- ============================================================
-- VERIFICACIÓN POST-DEPLOY
-- ============================================================

-- Confirmar que todos los usuarios tienen company_id
-- SELECT COUNT(*) AS sin_empresa
-- FROM users.users
-- WHERE company_id IS NULL AND deleted_at IS NULL;
-- Debe devolver 0

-- Confirmar roles válidos
-- SELECT DISTINCT role FROM users.users;
-- Debe mostrar solo: admin, contador, viewer (y superadmin si se creó)
