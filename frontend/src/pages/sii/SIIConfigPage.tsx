import React, { useState, useRef } from 'react'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  FileCode2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import api from '@/services/api'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface SIIStatus {
  ambiente: 'CERTIFICACION' | 'PRODUCCION'
  rut_empresa: string
  certificado_ok: boolean
  listo_produccion: boolean
  sii_url: string
}

interface FolioDisponible {
  document_type: number
  folio_actual: number
  folio_hasta: number
  folios_disponibles: number
  fecha_vencimiento: string | null
}

const DOCUMENT_TYPES: Record<number, string> = {
  33: 'Factura Afecta (IVA)',
  34: 'Factura Exenta',
  39: 'Boleta Afecta',
  41: 'Boleta Exenta',
  56: 'Nota de Débito',
  61: 'Nota de Crédito',
}

// ── Badge de ambiente ──────────────────────────────────────────────────────────
function AmbienteBadge({ ambiente }: { ambiente: string }) {
  const isProduccion = ambiente === 'PRODUCCION'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        isProduccion
          ? 'bg-green-100 text-green-800'
          : 'bg-yellow-100 text-yellow-800'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isProduccion ? 'bg-green-500' : 'bg-yellow-500'}`}
      />
      {isProduccion ? 'PRODUCCIÓN' : 'CERTIFICACIÓN'}
    </span>
  )
}

// ── Indicador booleano ─────────────────────────────────────────────────────────
function BoolIndicator({ ok, labelOk, labelNo }: { ok: boolean; labelOk: string; labelNo: string }) {
  return ok ? (
    <span className="flex items-center gap-1.5 text-green-700 text-sm">
      <CheckCircle2 size={15} className="shrink-0" /> {labelOk}
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-red-600 text-sm">
      <XCircle size={15} className="shrink-0" /> {labelNo}
    </span>
  )
}

// ── Acordeón de instrucciones ──────────────────────────────────────────────────
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
        aria-expanded={open}
      >
        {title}
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && (
        <div className="px-4 py-3 text-sm text-gray-600 space-y-1.5 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function SIIConfigPage() {
  const { user } = useAuthStore()

  // Estado del sistema
  const [siiStatus, setSiiStatus] = useState<SIIStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)

  // Folios
  const [folios, setFolios] = useState<FolioDisponible[]>([])
  const [loadingFolios, setLoadingFolios] = useState(false)

  // Upload CAF
  const [cafDocType, setCafDocType] = useState<number>(33)
  const [cafFile, setCafFile] = useState<File | null>(null)
  const [uploadingCaf, setUploadingCaf] = useState(false)
  const [cafResult, setCafResult] = useState<string | null>(null)
  const [cafError, setCafError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Bloquear si no es admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <XCircle size={40} className="text-red-400" />
        <p className="text-sm font-medium">Acceso restringido — solo administradores.</p>
      </div>
    )
  }

  // ── Obtener estado SII ────────────────────────────────────────────────────
  const fetchStatus = async () => {
    setLoadingStatus(true)
    setErrorStatus(null)
    try {
      const { data } = await api.get('/sii/status')
      setSiiStatus(data.data)
    } catch {
      setErrorStatus('No se pudo obtener el estado del sistema SII.')
    } finally {
      setLoadingStatus(false)
    }
  }

  // ── Obtener folios disponibles ────────────────────────────────────────────
  const fetchFolios = async () => {
    setLoadingFolios(true)
    try {
      const { data } = await api.get('/sii/folios/disponibles')
      setFolios(data.data)
    } catch {
      setFolios([])
    } finally {
      setLoadingFolios(false)
    }
  }

  // Cargar ambos al montar
  React.useEffect(() => {
    fetchStatus()
    fetchFolios()
  }, [])

  // ── Upload CAF ────────────────────────────────────────────────────────────
  const handleUploadCaf = async () => {
    if (!cafFile) return
    setCafResult(null)
    setCafError(null)
    setUploadingCaf(true)
    const form = new FormData()
    form.append('caf_file', cafFile)
    try {
      const { data } = await api.post(
        `/sii/caf/upload?document_type=${cafDocType}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      const d = data.data
      setCafResult(
        `✅ CAF cargado correctamente. Folios ${d.folio_desde}–${d.folio_hasta} ` +
        `(${d.folios_disponibles} disponibles).`,
      )
      setCafFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchFolios()
    } catch (err: any) {
      setCafError(
        err?.response?.data?.detail?.message || 'Error al cargar el archivo CAF.',
      )
    } finally {
      setUploadingCaf(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">SII / DTE</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Configuración de Documentos Tributarios Electrónicos — Innova Consulting Group SpA
        </p>
      </div>

      {/* 1 — Estado del sistema ────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Estado del sistema
          </h2>
          <button
            onClick={() => { fetchStatus(); fetchFolios() }}
            disabled={loadingStatus}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw size={13} className={loadingStatus ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {errorStatus && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {errorStatus}
          </p>
        )}

        {siiStatus ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase font-medium">Ambiente</p>
              <AmbienteBadge ambiente={siiStatus.ambiente} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase font-medium">RUT Empresa</p>
              <p className="text-sm font-mono text-gray-800">{siiStatus.rut_empresa}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase font-medium">Certificado digital</p>
              <BoolIndicator
                ok={siiStatus.certificado_ok}
                labelOk="Configurado"
                labelNo="No configurado"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase font-medium">Listo para producción</p>
              <BoolIndicator
                ok={siiStatus.listo_produccion}
                labelOk="Sí — puede operar en producción"
                labelNo="No — configura certificado primero"
              />
            </div>
            <div className="col-span-full space-y-1">
              <p className="text-xs text-gray-400 uppercase font-medium">URL SII activa</p>
              <p className="text-sm font-mono text-gray-600">{siiStatus.sii_url}</p>
            </div>
          </div>
        ) : (
          !loadingStatus && <p className="text-sm text-gray-400">Sin datos.</p>
        )}
      </section>

      {/* 2 — Folios disponibles ────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Folios disponibles (CAF)
        </h2>

        {loadingFolios ? (
          <p className="text-sm text-gray-400">Cargando folios…</p>
        ) : folios.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
            <AlertTriangle size={15} />
            No hay CAFs cargados. Sube el archivo XML del CAF en la sección siguiente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Tipo', 'Descripción', 'Folio actual', 'Folio hasta', 'Disponibles', 'Vencimiento'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase py-2 px-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {folios.map((f) => {
                  const lowStock = f.folios_disponibles < 10
                  return (
                    <tr key={f.document_type} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="py-2 px-3 font-mono text-gray-700">{f.document_type}</td>
                      <td className="py-2 px-3 text-gray-700">
                        {DOCUMENT_TYPES[f.document_type] ?? '—'}
                      </td>
                      <td className="py-2 px-3 text-gray-700">{f.folio_actual}</td>
                      <td className="py-2 px-3 text-gray-700">{f.folio_hasta}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`font-semibold ${
                            lowStock ? 'text-red-600' : 'text-green-700'
                          }`}
                        >
                          {f.folios_disponibles}
                          {lowStock && (
                            <AlertTriangle size={13} className="inline ml-1 text-red-500" />
                          )}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-500">
                        {f.fecha_vencimiento ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 3 — Cargar CAF ────────────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileCode2 size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Cargar CAF
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600" htmlFor="caf-doc-type">
              Tipo de documento
            </label>
            <select
              id="caf-doc-type"
              value={cafDocType}
              onChange={(e) => setCafDocType(Number(e.target.value))}
              className="w-full h-9 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
            >
              {Object.entries(DOCUMENT_TYPES).map(([code, label]) => (
                <option key={code} value={code}>
                  {code} — {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600" htmlFor="caf-file-input">
              Archivo XML del CAF
            </label>
            <input
              id="caf-file-input"
              ref={fileInputRef}
              type="file"
              accept=".xml"
              onChange={(e) => {
                setCafFile(e.target.files?.[0] ?? null)
                setCafResult(null)
                setCafError(null)
              }}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>
        </div>

        {cafResult && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            {cafResult}
          </p>
        )}
        {cafError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {cafError}
          </p>
        )}

        <button
          id="sii-upload-caf-btn"
          onClick={handleUploadCaf}
          disabled={!cafFile || uploadingCaf}
          className="flex items-center gap-2 h-9 px-5 text-sm font-medium bg-secondary text-white rounded-md hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Upload size={14} />
          {uploadingCaf ? 'Cargando…' : 'Cargar folios'}
        </button>
      </section>

      {/* 4 — Instrucciones ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Instrucciones
        </h2>

        <Accordion title="¿Cómo obtener el certificado digital?">
          <ol className="list-decimal list-inside space-y-1">
            <li>Ingresa a <strong>misiimovil.sii.cl</strong> con el RUT de la empresa.</li>
            <li>Ve a <em>Factura Electrónica → Certificado Digital</em>.</li>
            <li>Genera o importa tu certificado <strong>.p12</strong>.</li>
            <li>En Render, sube el archivo como <em>Secret File</em> en la ruta <code>/app/certs/cert.p12</code>.</li>
            <li>Actualiza las variables <code>SII_CERT_PATH</code> y <code>SII_CERT_PASSWORD</code> en Render.</li>
          </ol>
        </Accordion>

        <Accordion title="¿Cómo solicitar folios CAF en el SII?">
          <ol className="list-decimal list-inside space-y-1">
            <li>Ingresa a <strong>misiimovil.sii.cl</strong> con el RUT de la empresa.</li>
            <li>Ve a <em>Factura Electrónica → Solicitud de Folios</em>.</li>
            <li>Selecciona el tipo de documento (ej: 33 — Factura Afecta) y la cantidad de folios.</li>
            <li>Descarga el archivo XML del CAF generado.</li>
            <li>Súbelo aquí en la sección <strong>Cargar CAF</strong>.</li>
          </ol>
        </Accordion>

        <Accordion title="¿Cómo pasar de certificación a producción?">
          <ol className="list-decimal list-inside space-y-1">
            <li>Asegúrate de tener el certificado digital configurado.</li>
            <li>Emite al menos 5 DTEs de prueba y verifica que el SII los acepte.</li>
            <li>En Render, cambia la variable <code>SII_AMBIENTE</code> de <code>CERTIFICACION</code> a <code>PRODUCCION</code>.</li>
            <li>Actualiza también <code>SII_RESOLUCION_NUMERO</code> y <code>SII_RESOLUCION_FECHA</code> con los datos de tu resolución SII.</li>
            <li>Redespliega el servicio en Render.</li>
          </ol>
        </Accordion>
      </section>
    </div>
  )
}
