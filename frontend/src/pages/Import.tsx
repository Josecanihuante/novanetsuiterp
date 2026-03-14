import React, { useState, useCallback } from 'react'
import { FileDropzone } from '@/components/ui/FileDropzone'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// Simulación de filas parseadas
interface PreviewRow {
  row: number
  account_code: string
  account_name: string
  date: string
  document_number: string
  debit: number
  credit: number
  valid: boolean
  error?: string
  [key: string]: unknown
}

const MOCK_PREVIEW: PreviewRow[] = [
  { row: 2, account_code: '1100', account_name: 'Caja CLP', date: '03/10/2025', document_number: 'DOC-001', debit: 5_000_000, credit: 0, valid: true },
  { row: 3, account_code: '4000', account_name: 'Ingresos', date: '03/10/2025', document_number: 'DOC-001', debit: 0, credit: 5_000_000, valid: true },
  { row: 4, account_code: '2100', account_name: 'CxP',      date: '03/11/2025', document_number: 'DOC-002', debit: 0, credit: 1_200_000, valid: true },
  { row: 5, account_code: '1200', account_name: 'Banco',    date: '03/11/2025', document_number: 'DOC-002', debit: 1_200_000, credit: 0, valid: true },
  { row: 6, account_code: '5000', account_name: 'CMV',      date: '03/12/2025', document_number: 'DOC-003', debit: 750_000, credit: 0, valid: true },
  { row: 7, account_code: '',     account_name: '',          date: '2025-03-13', document_number: 'DOC-004', debit: 0, credit: 0, valid: false, error: 'Fecha en formato incorrecto (usar MM/DD/YYYY)' },
  { row: 8, account_code: '6100', account_name: 'Gastos',   date: '03/14/2025', document_number: 'DOC-005', debit: 0, credit: 0, valid: false, error: 'Debit y Credit son ambos 0; al menos uno debe ser > 0' },
]

const PREVIEW_COLS: Column<PreviewRow>[] = [
  { key: 'row',             header: 'Fila',    type: 'number' },
  { key: 'account_code',    header: 'Cta.',    type: 'text' },
  { key: 'account_name',    header: 'Nombre',  type: 'text' },
  { key: 'date',            header: 'Fecha',   type: 'text' },
  { key: 'document_number', header: 'Doc.',    type: 'text' },
  { key: 'debit',           header: 'Débito',  type: 'currency' },
  { key: 'credit',          header: 'Crédito', type: 'currency' },
  { key: 'valid',           header: 'Estado',  type: 'badge', badgeMap: (v) => v ? 'success' : 'danger' },
]

// ── ProgressBar ───────────────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 bg-secondary rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, progress)}%` }}
      />
    </div>
  )
}

export default function Import() {
  const [file, setFile]         = useState<File | null>(null)
  const [step, setStep]         = useState<1 | 2 | 3>(1)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult]     = useState<{ imported: number; errors: number } | null>(null)

  const validRows  = MOCK_PREVIEW.filter((r) => r.valid)
  const errorRows  = MOCK_PREVIEW.filter((r) => !r.valid)
  const hasErrors  = errorRows.length > 0

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setStep(2)
    setResult(null)
  }, [])

  const handleImport = () => {
    setImporting(true)
    setProgress(0)
    let p = 0
    const interval = setInterval(() => {
      p += 20
      setProgress(p)
      if (p >= 100) {
        clearInterval(interval)
        setImporting(false)
        setResult({ imported: validRows.length, errors: errorRows.length })
        setStep(3)
      }
    }, 400)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Importar NetSuite</h1>
        <p className="text-sm text-gray-500 mt-0.5">Importa asientos contables desde un archivo Excel de NetSuite</p>
      </div>

      {/* Paso 1 — Dropzone */}
      {step === 1 && (
        <Card title="Paso 1 — Seleccionar archivo">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              <p className="font-semibold mb-1">Formato esperado (NetSuite export):</p>
              <p>Columnas requeridas: Account, Account Name, Type, Date, Document Number, Name, Memo, Debit, Credit, Amount, Currency, Subsidiary, Department, Class</p>
              <p className="mt-1 text-xs text-blue-600">Fechas en formato MM/DD/YYYY · Números sin separadores de miles</p>
            </div>
            <FileDropzone onFileSelect={handleFile} maxSizeMB={50} accept=".xlsx,.xls" />
          </div>
        </Card>
      )}

      {/* Paso 2 — Preview */}
      {step === 2 && file && (
        <div className="space-y-4">
          <Card title={`Paso 2 — Vista previa: ${file.name}`}>
            <div className="space-y-4">
              {/* Resumen */}
              <div className="flex gap-4">
                <Badge variant="success">{validRows.length} fila(s) válidas</Badge>
                {hasErrors && <Badge variant="danger">{errorRows.length} error(es)</Badge>}
              </div>

              {/* DataTable preview (primeras 20) */}
              <DataTable
                columns={PREVIEW_COLS}
                data={MOCK_PREVIEW.slice(0, 20)}
                pageSize={10}
              />

              {/* Tabla de errores */}
              {hasErrors && (
                <div>
                  <p className="text-sm font-semibold text-danger mb-2">⚠ Errores encontrados</p>
                  <div className="border border-danger/20 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-danger/5 border-b border-danger/20">
                        <tr>
                          <th className="text-left px-4 py-2 text-gray-600">Fila</th>
                          <th className="text-left px-4 py-2 text-gray-600">Motivo del error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {errorRows.map((e) => (
                          <tr key={e.row} className="border-b border-gray-100">
                            <td className="px-4 py-2 text-danger font-medium">{e.row}</td>
                            <td className="px-4 py-2 text-gray-700">{e.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => { setStep(1); setFile(null) }}>← Volver</Button>
            <div className="flex items-center gap-3">
              {hasErrors && (
                <p className="text-xs text-danger">Corrige los errores antes de confirmar</p>
              )}
              <Button
                id="import-confirm"
                variant="primary"
                isDisabled={hasErrors || importing}
                isLoading={importing}
                onClick={handleImport}
                title={hasErrors ? 'Corrige los errores antes de confirmar' : 'Confirmar e importar'}
              >
                Confirmar importación
              </Button>
            </div>
          </div>

          {importing && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Importando asientos… {progress}%</p>
              <ProgressBar progress={progress} />
            </div>
          )}
        </div>
      )}

      {/* Paso 3 — Resultado */}
      {step === 3 && result && (
        <Card>
          <div className="text-center py-8 space-y-3">
            <div className="text-4xl">✅</div>
            <p className="text-lg font-semibold text-gray-800">Importación completada</p>
            <p className="text-sm text-gray-600">
              <span className="text-success font-bold">{result.imported}</span> asiento(s) importado(s) correctamente
              {result.errors > 0 && (
                <span className="text-warning"> · {result.errors} error(es) omitidos</span>
              )}
            </p>
            <Button variant="secondary" onClick={() => { setStep(1); setFile(null); setResult(null) }}>
              Importar otro archivo
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
