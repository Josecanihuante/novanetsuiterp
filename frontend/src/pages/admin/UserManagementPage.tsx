import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface UserRow {
  id: string
  email: string
  full_name: string
  role: 'contador' | 'viewer'
  is_active: boolean
  last_login: string | null
  created_at: string
}

interface PasswordModalProps {
  password: string
  onClose: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const ROLES_GESTIONABLES = [
  { value: 'contador', label: 'Contador' },
  { value: 'viewer',   label: 'Observador' },
]

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1/user-management`

function formatDate(iso: string | null): string {
  if (!iso) return 'Nunca'
  const d = new Date(iso)
  const dd   = String(d.getDate()).padStart(2, '0')
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh   = String(d.getHours()).padStart(2, '0')
  const min  = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

// ── PasswordModal ─────────────────────────────────────────────────────────────
function PasswordModal({ password, onClose }: PasswordModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwd-modal-title"
    >
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div
          style={{
            background: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
          }}
        >
          <h3
            id="pwd-modal-title"
            style={{ fontWeight: 700, color: '#92400e', fontSize: '15px', marginBottom: '4px' }}
          >
            ⚠️ Contraseña temporal — solo se muestra una vez
          </h3>
          <p style={{ color: '#b45309', fontSize: '12px', marginBottom: '12px' }}>
            Copie y comparta por un canal seguro (no por email).
          </p>
          <div
            style={{
              background: 'white',
              border: '1px solid #fcd34d',
              borderRadius: '8px',
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '18px',
              textAlign: 'center',
              letterSpacing: '0.1em',
              fontWeight: 700,
              color: '#1e293b',
            }}
          >
            {password}
          </div>
        </div>
        <button
          id="btn-copy-password"
          onClick={handleCopy}
          style={{
            width: '100%',
            padding: '10px',
            background: copied ? '#16a34a' : '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '8px',
            transition: 'background 0.2s',
          }}
        >
          {copied ? '✅ Copiado!' : '📋 Copiar contraseña'}
        </button>
        <button
          id="btn-close-password-modal"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          Cerrar (ya copié la contraseña)
        </button>
      </div>
    </div>
  )
}

// ── Modal de Crear/Editar usuario ─────────────────────────────────────────────
interface UserFormModalProps {
  mode: 'create' | 'edit'
  initial?: UserRow
  onClose: () => void
  onSave: (data: { email: string; full_name: string; role: string; password?: string }) => Promise<void>
  saving: boolean
  error: string
}

function UserFormModal({ mode, initial, onClose, onSave, saving, error }: UserFormModalProps) {
  const [email,     setEmail]     = useState(initial?.email ?? '')
  const [fullName,  setFullName]  = useState(initial?.full_name ?? '')
  const [role,      setRole]      = useState(initial?.role ?? 'viewer')
  const [password,  setPassword]  = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: { email: string; full_name: string; role: string; password?: string } = {
      email, full_name: fullName, role,
    }
    if (mode === 'create' && password) payload.password = password
    onSave(payload)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '4px',
    display: 'block',
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" style={{ padding: '24px' }}>
        <h2 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '20px', color: '#111827' }}>
          {mode === 'create' ? '➕ Nuevo usuario' : '✏️ Editar usuario'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label htmlFor="um-full-name" style={labelStyle}>Nombre completo</label>
            <input
              id="um-full-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={inputStyle}
              placeholder="Ej: María González"
            />
          </div>

          <div>
            <label htmlFor="um-email" style={labelStyle}>Email</label>
            <input
              id="um-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="usuario@empresa.cl"
              disabled={mode === 'edit'}
            />
          </div>

          <div>
            <label htmlFor="um-role" style={labelStyle}>Rol</label>
            <select
              id="um-role"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={inputStyle}
            >
              {ROLES_GESTIONABLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {mode === 'create' && (
            <div>
              <label htmlFor="um-password" style={labelStyle}>
                Contraseña <span style={{ fontWeight: 400, color: '#9ca3af' }}>(dejar vacío para generar automáticamente)</span>
              </label>
              <input
                id="um-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="Dejar vacío para generar automáticamente"
                minLength={8}
              />
            </div>
          )}

          {error && (
            <p style={{ color: '#dc2626', fontSize: '13px', background: '#fef2f2', padding: '8px 12px', borderRadius: '8px' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              id="btn-cancel-user-form"
              onClick={onClose}
              disabled={saving}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-user-form"
              disabled={saving}
              style={{
                flex: 1,
                padding: '10px',
                background: saving ? '#9ca3af' : '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {saving ? 'Guardando…' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function UserManagementPage() {
  const token = useAuthStore((s) => s.token)

  const [users,          setUsers]          = useState<UserRow[]>([])
  const [loading,        setLoading]        = useState(true)
  const [showInactive,   setShowInactive]   = useState(false)
  const [formMode,       setFormMode]       = useState<'create' | 'edit' | null>(null)
  const [editingUser,    setEditingUser]    = useState<UserRow | undefined>(undefined)
  const [saving,         setSaving]         = useState(false)
  const [formError,      setFormError]      = useState('')
  const [tempPassword,   setTempPassword]   = useState<string | null>(null)
  const [actionError,    setActionError]    = useState('')

  const authHeaders = { Authorization: `Bearer ${token}` }

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setActionError('')
    try {
      const res = await fetch(`${API_BASE}/usuarios?include_inactive=${showInactive}`, {
        headers: authHeaders,
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const json = await res.json()
      setUsers(json.data)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [showInactive, token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // ── Crear ──────────────────────────────────────────────────────────────────
  const handleCreate = async (data: { email: string; full_name: string; role: string; password?: string }) => {
    setSaving(true)
    setFormError('')
    try {
      const res = await fetch(`${API_BASE}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setFormError(json.error?.message ?? `Error ${res.status}`)
        return
      }
      setFormMode(null)
      setTempPassword(json.data.temporary_password)
      fetchUsers()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  // ── Editar ─────────────────────────────────────────────────────────────────
  const handleEdit = async (data: { email: string; full_name: string; role: string }) => {
    if (!editingUser) return
    setSaving(true)
    setFormError('')
    try {
      const res = await fetch(`${API_BASE}/usuarios/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ full_name: data.full_name, role: data.role }),
      })
      const json = await res.json()
      if (!res.ok) {
        setFormError(json.error?.message ?? `Error ${res.status}`)
        return
      }
      setFormMode(null)
      setEditingUser(undefined)
      fetchUsers()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  // ── Resetear contraseña ────────────────────────────────────────────────────
  const handleResetPassword = async (userId: string) => {
    if (!window.confirm('¿Confirma resetear la contraseña de este usuario?')) return
    try {
      const res = await fetch(`${API_BASE}/usuarios/${userId}/resetear-contrasena`, {
        method: 'POST',
        headers: authHeaders,
      })
      const json = await res.json()
      if (!res.ok) { setActionError(json.error?.message ?? 'Error'); return }
      setTempPassword(json.data.temporary_password)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  // ── Activar / Desactivar ───────────────────────────────────────────────────
  const handleToggleActive = async (user: UserRow) => {
    const action = user.is_active ? 'desactivar' : 'activar'
    if (!window.confirm(`¿Confirma ${action} a ${user.full_name}?`)) return
    try {
      const res = await fetch(`${API_BASE}/usuarios/${user.id}/${action}`, {
        method: 'POST',
        headers: authHeaders,
      })
      const json = await res.json()
      if (!res.ok) { setActionError(json.error?.message ?? 'Error'); return }
      fetchUsers()
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const roleBadge = (role: string) => {
    const styles: React.CSSProperties = {
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    }
    if (role === 'contador') return <span style={{ ...styles, background: '#dbeafe', color: '#1d4ed8' }}>Contador</span>
    return <span style={{ ...styles, background: '#f3f4f6', color: '#374151' }}>Observador</span>
  }

  const activeDot = (active: boolean) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: active ? '#16a34a' : '#dc2626',
        display: 'inline-block',
      }} />
      <span style={{ fontSize: '13px', color: active ? '#166534' : '#991b1b' }}>
        {active ? 'Activo' : 'Inactivo'}
      </span>
    </span>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 8px' }}>
      {/* ── Cabecera ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
            👥 Gestión de Usuarios
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Administre contadores y observadores de su empresa
          </p>
        </div>
        <button
          id="btn-nuevo-usuario"
          onClick={() => { setFormMode('create'); setFormError('') }}
          style={{
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
            transition: 'transform 0.1s',
          }}
        >
          ➕ Nuevo usuario
        </button>
      </div>

      {/* ── Filtros ── */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
          <input
            id="chk-show-inactive"
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          Mostrar usuarios inactivos
        </label>
        <button
          id="btn-refresh-users"
          onClick={fetchUsers}
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            background: 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
            color: '#6b7280',
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* ── Error de acción ── */}
      {actionError && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '10px', padding: '12px 16px', marginBottom: '14px',
          color: '#dc2626', fontSize: '14px',
        }}>
          ⚠️ {actionError}
          <button onClick={() => setActionError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>✕</button>
        </div>
      )}

      {/* ── Tabla ── */}
      <div style={{
        background: 'white',
        borderRadius: '14px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '14px' }}>
            Cargando usuarios…
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👤</div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151' }}>Sin usuarios registrados</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Cree el primer usuario con el botón superior.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Nombre', 'Email', 'Rol', 'Estado', 'Último acceso', 'Acciones'].map((col) => (
                    <th key={col} style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: idx < users.length - 1 ? '1px solid #f3f4f6' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fafafa' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                      {u.full_name}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#6b7280' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '13px 16px' }}>{roleBadge(u.role)}</td>
                    <td style={{ padding: '13px 16px' }}>{activeDot(u.is_active)}</td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#6b7280' }}>
                      {formatDate(u.last_login)}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {/* Editar */}
                        <button
                          id={`btn-edit-${u.id}`}
                          onClick={() => { setEditingUser(u); setFormMode('edit'); setFormError('') }}
                          title="Editar usuario"
                          style={actionBtnStyle('#eff6ff', '#2563eb')}
                        >
                          ✏️
                        </button>
                        {/* Resetear contraseña */}
                        <button
                          id={`btn-reset-pwd-${u.id}`}
                          onClick={() => handleResetPassword(u.id)}
                          title="Resetear contraseña"
                          style={actionBtnStyle('#fef9c3', '#92400e')}
                        >
                          🔑
                        </button>
                        {/* Activar / Desactivar */}
                        <button
                          id={`btn-toggle-active-${u.id}`}
                          onClick={() => handleToggleActive(u)}
                          title={u.is_active ? 'Desactivar' : 'Activar'}
                          style={u.is_active
                            ? actionBtnStyle('#fef2f2', '#dc2626')
                            : actionBtnStyle('#f0fdf4', '#16a34a')}
                        >
                          {u.is_active ? '🚫' : '✅'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modales ── */}
      {formMode === 'create' && (
        <UserFormModal
          mode="create"
          onClose={() => setFormMode(null)}
          onSave={handleCreate}
          saving={saving}
          error={formError}
        />
      )}
      {formMode === 'edit' && editingUser && (
        <UserFormModal
          mode="edit"
          initial={editingUser}
          onClose={() => { setFormMode(null); setEditingUser(undefined) }}
          onSave={handleEdit}
          saving={saving}
          error={formError}
        />
      )}
      {tempPassword && (
        <PasswordModal
          password={tempPassword}
          onClose={() => setTempPassword(null)}
        />
      )}
    </div>
  )
}

// ── Estilos de acción ─────────────────────────────────────────────────────────
function actionBtnStyle(bg: string, color: string): React.CSSProperties {
  return {
    padding: '5px 10px',
    background: bg,
    color,
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'opacity 0.15s',
  }
}
