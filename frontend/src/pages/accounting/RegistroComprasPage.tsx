import React, { useState, useRef, useEffect } from 'react'
import {
  Upload,
  FileText,
  Settings,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Info,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import api from '@/services/api'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface ImportStats {
  total_procesadas: number
  importadas: number
  duplicadas: number
  errores: number
  contabilizadas: number
  detalle_errores: { fila: number; error: string; datos: Record<string, string> }[]
}

interface PurchaseInvoice {
  id: string
  document_type: number
  folio: number
  fecha_emision: string
  rut_emisor: string
  razon_social: string
  monto_neto: number
  monto_iva: number
  monto_total: number
  status: 'pendiente' | 'contabilizada' | 'anulada'
  journal_entry_id: string | null
}

interface AccountMapping {
  id: string
  mapping_type: string
  description: string
  is_default: boolean
  account_receivable_id: string | null
  account_income_id: string | null
  account_iva_debito_id: string | null
  account_payable_id: string | null
  account_expense_id: string | null
  account_iva_credito_id: string | null
}

interface Account {
  id: string
  code: string
  name: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('es-CL') }
  catch { return iso }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pendiente:      'bg-yellow-100 text-yellow-800',
    contabilizada:  'bg-green-100  text-green-800',
    anulada:        'bg-gray-100   text-gray-500',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-100'}`}>
      {status}
    </span>
  )
}

// ── Instrucciones descarga SII ────────────────────────────────────────────────
function SIIDownloadInstructions() {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors text-sm font-semibold text-blue-800"
      >
        <span className="flex items-center gap-2">
          <Info size={15} />
          Cómo descargar el Registro de Compras del SII
        </span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>
      {open && (
        <div className="bg-blue-50 px-4 py-3 border-t border-blue-200">
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Ir a <strong>misiimovil.cl</strong> e iniciar sesión con el RUT de la empresa</li>
            <li>Ir a <strong>Servicios Online → Registro de Compras y Ventas</strong></li>
            <li>Seleccionar el mes y año que deseas importar</li>
            <li>Hacer clic en <strong>Compras → Descargar → CSV</strong></li>
            <li>Subir el archivo descargado en el formulario de abajo</li>
          </ol>
        </div>
      )}
    </div>
  )
}

// ── Tab 1: Importar RCV ───────────────────────────────────────────────────────
function ImportarRCVTab() {
  const { user } = useAuthStore()
  const now = new Date()

  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year,  setYear]  = useState(now.getFullYear())
  const [autoPost, setAutoPost] = useState(false)
  const [file,  setFile]  = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<ImportStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const canImport = user?.role !== 'viewer'

  const handleImport = async () => {
    if (!file || !canImport) return
    setLoading(true); setError(null); setStats(null)
    const form = new FormData()
    form.append('csv_file', file)
    try {
      const { data } = await api.post(
        `/accounting-engine/sii/import-rcv?period_month=${month}&period_year=${year}&auto_contabilizar=${autoPost}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      setStats(data.data)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? 'Error al importar el archivo.')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      <SIIDownloadInstructions />

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Importar archivo CSV</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600" htmlFor="rcv-month">Mes</label>
            <select
              id="rcv-month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full h-9 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('es-CL', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600" htmlFor="rcv-year">Año</label>
            <select
              id="rcv-year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full h-9 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600" htmlFor="rcv-file">Archivo CSV</label>
            <input
              id="rcv-file"
              ref={inputRef}
              type="file"
              accept=".csv"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setStats(null); setError(null) }}
              className="w-full text-sm text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>
        </div>

        {canImport && (
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 select-none">
            <input
              type="checkbox"
              checked={autoPost}
              onChange={(e) => setAutoPost(e.target.checked)}
              className="w-4 h-4 accent-secondary"
            />
            Contabilizar automáticamente al importar <span className="text-xs text-gray-400">(asientos en borrador)</span>
          </label>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
        )}

        <button
          id="rcv-import-btn"
          onClick={handleImport}
          disabled={!file || loading || !canImport}
          className="flex items-center gap-2 h-9 px-5 text-sm font-medium bg-secondary text-white rounded-md hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Upload size={14} />
          {loading ? 'Importando…' : 'Importar'}
        </button>
      </div>

      {/* Resultado */}
      {stats && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Resultado de importación</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Procesadas',     value: stats.total_procesadas,  color: 'text-gray-700' },
              { label: 'Importadas',     value: stats.importadas,        color: 'text-green-700' },
              { label: 'Duplicadas',     value: stats.duplicadas,        color: 'text-yellow-700' },
              { label: 'Errores',        value: stats.errores,           color: 'text-red-600' },
              { label: 'Contabilizadas', value: stats.contabilizadas,    color: 'text-blue-700' },
            ].map((s) => (
              <div key={s.label} className="border border-gray-100 rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {stats.detalle_errores.length > 0 && (
            <details className="text-xs">
              <summary className="text-red-600 cursor-pointer font-medium">
                Ver detalle de errores ({stats.detalle_errores.length})
              </summary>
              <div className="mt-2 space-y-1 bg-red-50 rounded p-3">
                {stats.detalle_errores.slice(0, 10).map((e, i) => (
                  <p key={i} className="text-red-700">
                    Fila {e.fila}: {e.error}
                  </p>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tab 2: Facturas recibidas ──────────────────────────────────────────────────
function FacturasRecibidasTab() {
  const { user } = useAuthStore()
  const now = new Date()

  const [month, setMonth] = useState<number | ''>(now.getMonth() + 1)
  const [year,  setYear]  = useState<number | ''>(now.getFullYear())
  const [statusFilter, setStatusFilter] = useState('')
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([])
  const [loading,  setLoading]  = useState(false)
  const [posting,  setPosting]  = useState<string | null>(null)

  const canPost = user?.role !== 'viewer'

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (month)       params.set('month', String(month))
      if (year)        params.set('year',  String(year))
      if (statusFilter) params.set('status', statusFilter)
      const { data } = await api.get(`/accounting-engine/purchase-invoices?${params}`)
      setInvoices(data.data)
    } catch { setInvoices([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [month, year, statusFilter])

  const contabilizar = async (id: string) => {
    setPosting(id)
    try {
      await api.post(`/accounting-engine/purchase-invoices/${id}/contabilizar`)
      await load()
    } catch (err: any) {
      alert(err?.response?.data?.detail?.message ?? 'Error al contabilizar.')
    } finally { setPosting(null) }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : '')}
          className="h-8 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
        >
          <option value="">Todos los meses</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2000, i).toLocaleString('es-CL', { month: 'long' })}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
          className="h-8 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
        >
          <option value="">Todos los años</option>
          {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="contabilizada">Contabilizada</option>
        </select>
        <button onClick={load} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabla */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Fecha', 'RUT Emisor', 'Razón Social', 'Folio', 'Neto', 'IVA', 'Total', 'Estado', ''].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">Cargando…</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">Sin registros</td></tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50/50">
                <td className="px-3 py-2 text-gray-700">{fmtDate(inv.fecha_emision)}</td>
                <td className="px-3 py-2 font-mono text-gray-600 text-xs">{inv.rut_emisor}</td>
                <td className="px-3 py-2 text-gray-700 max-w-[160px] truncate" title={inv.razon_social}>{inv.razon_social}</td>
                <td className="px-3 py-2 text-gray-700">{inv.folio}</td>
                <td className="px-3 py-2 text-right text-gray-700">{fmtCLP(inv.monto_neto)}</td>
                <td className="px-3 py-2 text-right text-gray-700">{fmtCLP(inv.monto_iva)}</td>
                <td className="px-3 py-2 text-right font-medium text-gray-800">{fmtCLP(inv.monto_total)}</td>
                <td className="px-3 py-2"><StatusBadge status={inv.status} /></td>
                <td className="px-3 py-2">
                  {inv.status === 'pendiente' && canPost && (
                    <button
                      onClick={() => contabilizar(inv.id)}
                      disabled={posting === inv.id}
                      className="text-xs text-secondary hover:underline disabled:opacity-50"
                    >
                      {posting === inv.id ? 'Procesando…' : 'Contabilizar'}
                    </button>
                  )}
                  {inv.journal_entry_id && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Asiento
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab 3: Mapeo de cuentas ───────────────────────────────────────────────────
function MapeoCuentasTab() {
  const { user } = useAuthStore()
  const [mappings, setMappings] = useState<AccountMapping[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  // Estado del formulario para el mapeo de ventas
  const [saleForm, setSaleForm] = useState({
    account_receivable_id:  '',
    account_income_id:      '',
    account_iva_debito_id:  '',
  })
  // Estado del formulario para el mapeo de compras
  const [purchaseForm, setPurchaseForm] = useState({
    account_expense_id:     '',
    account_iva_credito_id: '',
    account_payable_id:     '',
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [mRes, aRes] = await Promise.all([
          api.get('/accounting-engine/account-mappings'),
          api.get('/api/v1/accounts'),        // endpoint existente de cuentas
        ])
        const mList: AccountMapping[] = mRes.data.data
        setMappings(mList)
        setAccounts(aRes.data.data ?? [])

        const sale = mList.find((m) => m.mapping_type === 'sale' && m.is_default)
        if (sale) {
          setSaleForm({
            account_receivable_id:  sale.account_receivable_id  ?? '',
            account_income_id:      sale.account_income_id      ?? '',
            account_iva_debito_id:  sale.account_iva_debito_id  ?? '',
          })
        }
        const purchase = mList.find((m) => m.mapping_type === 'purchase' && m.is_default)
        if (purchase) {
          setPurchaseForm({
            account_expense_id:     purchase.account_expense_id     ?? '',
            account_iva_credito_id: purchase.account_iva_credito_id ?? '',
            account_payable_id:     purchase.account_payable_id     ?? '',
          })
        }
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true); setSaved(false)
    try {
      const saleMapping  = mappings.find((m) => m.mapping_type === 'sale'     && m.is_default)
      const purchMapping = mappings.find((m) => m.mapping_type === 'purchase' && m.is_default)

      if (saleMapping) {
        await api.put(`/accounting-engine/account-mappings/${saleMapping.id}`, saleForm)
      } else {
        await api.post('/accounting-engine/account-mappings', { ...saleForm, mapping_type: 'sale', is_default: true, description: 'Mapeo por defecto — Ventas' })
      }
      if (purchMapping) {
        await api.put(`/accounting-engine/account-mappings/${purchMapping.id}`, purchaseForm)
      } else {
        await api.post('/accounting-engine/account-mappings', { ...purchaseForm, mapping_type: 'purchase', is_default: true, description: 'Mapeo por defecto — Compras' })
      }
      setSaved(true)
    } catch (err: any) {
      alert(err?.response?.data?.detail?.message ?? 'Error al guardar.')
    } finally { setSaving(false) }
  }

  if (user?.role !== 'admin') {
    return <p className="text-sm text-gray-500 py-6 text-center">Solo administradores pueden configurar el mapeo de cuentas.</p>
  }

  const AccountSelect = ({
    id, label, value, onChange,
  }: { id: string; label: string; value: string; onChange: (v: string) => void }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600" htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
      >
        <option value="">— Seleccionar cuenta —</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
        ))}
      </select>
    </div>
  )

  if (loading) return <p className="text-sm text-gray-400 py-6">Cargando…</p>

  return (
    <div className="space-y-6">
      {/* VENTAS */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Facturas emitidas (Ventas)</h3>
        <p className="text-xs text-gray-500">Asiento: DEBE CxC → HABER Ingresos + IVA Débito</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AccountSelect id="sale-cxc"    label="CxC Clientes (débito)"         value={saleForm.account_receivable_id}  onChange={(v) => setSaleForm((f) => ({ ...f, account_receivable_id: v }))}  />
          <AccountSelect id="sale-ing"    label="Cuenta de Ingresos (crédito)"   value={saleForm.account_income_id}      onChange={(v) => setSaleForm((f) => ({ ...f, account_income_id: v }))}      />
          <AccountSelect id="sale-iva"    label="IVA Débito Fiscal (crédito)"    value={saleForm.account_iva_debito_id}  onChange={(v) => setSaleForm((f) => ({ ...f, account_iva_debito_id: v }))}  />
        </div>
      </div>

      {/* COMPRAS */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Facturas recibidas (Compras)</h3>
        <p className="text-xs text-gray-500">Asiento: DEBE Gasto + IVA CF → HABER CxP Proveedores</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AccountSelect id="purch-gasto" label="Cuenta de Gasto (débito)"        value={purchaseForm.account_expense_id}     onChange={(v) => setPurchaseForm((f) => ({ ...f, account_expense_id: v }))}     />
          <AccountSelect id="purch-iva"   label="IVA Crédito Fiscal (débito)"     value={purchaseForm.account_iva_credito_id} onChange={(v) => setPurchaseForm((f) => ({ ...f, account_iva_credito_id: v }))} />
          <AccountSelect id="purch-cxp"  label="CxP Proveedores (crédito)"       value={purchaseForm.account_payable_id}     onChange={(v) => setPurchaseForm((f) => ({ ...f, account_payable_id: v }))}     />
        </div>
      </div>

      {saved && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 flex items-center gap-2">
          <CheckCircle2 size={15} /> Mapeo guardado correctamente.
        </p>
      )}

      <button
        id="mapping-save-btn"
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 h-9 px-5 text-sm font-medium bg-secondary text-white rounded-md hover:bg-secondary/90 disabled:opacity-50 transition-colors"
      >
        <Settings size={14} />
        {saving ? 'Guardando…' : 'Guardar mapeo por defecto'}
      </button>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'importar',   label: 'Importar RCV',        icon: Upload },
  { id: 'facturas',   label: 'Facturas recibidas',   icon: FileText },
  { id: 'mapeo',      label: 'Mapeo de cuentas',     icon: Settings },
]

export default function RegistroComprasPage() {
  const [activeTab, setActiveTab] = useState<string>('importar')

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Registro de Compras SII</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Importación del Registro de Compras y Ventas, contabilización automática
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              id={`rcv-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                isActive
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Contenido */}
      {activeTab === 'importar' && <ImportarRCVTab />}
      {activeTab === 'facturas' && <FacturasRecibidasTab />}
      {activeTab === 'mapeo'    && <MapeoCuentasTab />}
    </div>
  )
}
