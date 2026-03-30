import React, { useState } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface AsientoRow {
  id: string
  entry_number: string
  entry_date: string
  description: string
  source: string
  status: 'draft' | 'posted'
  debit: number
  credit: number
  [key: string]: unknown
}

interface AsientoLine { account: string; debit: number; credit: number; description: string }

const MOCK_ASIENTOS: AsientoRow[] = [
  { id: '1', entry_number: 'A-001', entry_date: '2025-02-01', description: 'Registro ventas febrero', source: 'Manual', status: 'posted', debit: 5_000_000, credit: 5_000_000 },
  { id: '2', entry_number: 'A-002', entry_date: '2025-02-05', description: 'Pago proveedor ABC', source: 'Manual', status: 'posted', debit: 1_200_000, credit: 1_200_000 },
  { id: '3', entry_number: 'A-003', entry_date: '2025-02-10', description: 'Depreciación equipos', source: 'Manual', status: 'draft', debit: 850_000, credit: 850_000 },
  { id: '4', entry_number: 'NS-DOC-456', entry_date: '2025-02-12', description: 'Imp. NetSuite — Doc: 456', source: 'NetSuite', status: 'posted', debit: 3_400_000, credit: 3_400_000 },
]

const CUENTAS = [
  // Balance General - Activos
  '1100 - Caja',
  '1110 - Banco',
  '1200 - Cuentas por cobrar',
  '1300 - Inventarios',
  '1500 - Activos Fijos Netos',
  '1700 - Intangibles',
  // Balance General - Pasivos
  '2100 - Cuentas por pagar (Proveedores)',
  '2200 - Deuda CP',
  '2500 - Deuda LP',
  // Balance General - Patrimonio
  '3100 - Capital',
  '3200 - Utilidades Retenidas',
  // Estado de Resultados - Ingresos
  '4100 - Ingresos Ventas',
  // Estado de Resultados - Costos y Gastos
  '5100 - Costo de Ventas',
  '6100 - Gastos Operativos',
  '6200 - Depreciación',
  '6300 - Gastos Financieros',
  '6400 - Impuesto Renta',
]

const COLS: Column<AsientoRow>[] = [
  { key: 'entry_number', header: 'N° Asiento', type: 'text', sortable: true },
  { key: 'entry_date',   header: 'Fecha',      type: 'date', sortable: true },
  { key: 'description',  header: 'Glosa',      type: 'text' },
  { key: 'source',       header: 'Fuente',     type: 'text' },
  { key: 'debit',        header: 'Débito',     type: 'currency', sortable: true },
  { key: 'credit',       header: 'Crédito',    type: 'currency', sortable: true },
]

// ── Modal nuevo asiento ───────────────────────────────────────────────────────
function NuevoAsientoModal({ onClose, onSave }: { onClose: () => void, onSave: (r: AsientoRow) => void }) {
  const [fecha, setFecha]     = useState(new Date().toISOString().slice(0, 10))
  const [glosa, setGlosa]     = useState('')
  const [periodo, setPeriodo] = useState('02 / 2025')
  const [lines, setLines]     = useState<AsientoLine[]>([
    { account: '', debit: 0, credit: 0, description: '' },
    { account: '', debit: 0, credit: 0, description: '' },
  ])

  const PERIODOS = [
    '01 / 2025', '02 / 2025', '03 / 2025', '04 / 2025',
    '05 / 2025', '06 / 2025', '07 / 2025', '08 / 2025',
    '09 / 2025', '10 / 2025', '11 / 2025', '12 / 2025',
  ]

  const totalDebit  = lines.reduce((s, l) => s + (l.debit || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0)
  const balanced    = Math.abs(totalDebit - totalCredit) < 0.01

  const addLine = () => setLines((prev) => [...prev, { account: '', debit: 0, credit: 0, description: '' }])
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx))

  const updateLine = (idx: number, field: keyof AsientoLine, value: string | number) => {
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  const fmt = (n: number) => new Intl.NumberFormat('es-CL').format(n)

  const handleSubmit = (status: 'draft' | 'posted') => {
    if (!balanced) return
    
    if (lines.some(l => l.account === '')) {
      alert("Por favor selecciona una cuenta para todas las líneas.")
      return
    }

    const asientoNuevo: AsientoRow = {
      id: Math.random().toString(),
      entry_number: `A-${Date.now().toString().slice(-4)}`,
      entry_date: fecha,
      description: glosa || 'Sin descripción',
      source: 'Manual',
      status: status,
      periodo: periodo,
      debit: totalDebit,
      credit: totalCredit
    }
    
    onSave(asientoNuevo)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Nuevo Asiento Contable</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Encabezado */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="asiento-periodo" className="text-sm font-medium text-gray-700">Período</label>
              <select id="asiento-periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)}
                className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40">
                {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="asiento-fecha" className="text-sm font-medium text-gray-700">Fecha</label>
              <input id="asiento-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="asiento-glosa" className="text-sm font-medium text-gray-700">Glosa</label>
              <input id="asiento-glosa" type="text" value={glosa} onChange={(e) => setGlosa(e.target.value)}
                placeholder="Descripción del asiento"
                className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
            </div>
          </div>

          {/* Líneas */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Líneas del asiento</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Cuenta</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Débito</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Crédito</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Descripción</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((line, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">
                        <input list={`cuentas-list-${i}`} value={line.account} onChange={(e) => updateLine(i, 'account', e.target.value)}
                          placeholder="Buscar cuenta..."
                          className="w-full h-8 border border-gray-200 rounded px-2 text-xs focus:outline-none focus:ring-1 focus:ring-secondary/40" />
                        <datalist id={`cuentas-list-${i}`}>{CUENTAS.map((c) => <option key={c} value={c} />)}</datalist>
                      </td>
                      <td className="px-2 py-1.5 w-28">
                        <input type="number" min={0} value={line.debit || ''} onChange={(e) => updateLine(i, 'debit', parseFloat(e.target.value) || 0)}
                          className="w-full h-8 border border-gray-200 rounded px-2 text-xs text-right focus:outline-none focus:ring-1 focus:ring-secondary/40" />
                      </td>
                      <td className="px-2 py-1.5 w-28">
                        <input type="number" min={0} value={line.credit || ''} onChange={(e) => updateLine(i, 'credit', parseFloat(e.target.value) || 0)}
                          className="w-full h-8 border border-gray-200 rounded px-2 text-xs text-right focus:outline-none focus:ring-1 focus:ring-secondary/40" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="text" value={line.description} onChange={(e) => updateLine(i, 'description', e.target.value)}
                          className="w-full h-8 border border-gray-200 rounded px-2 text-xs focus:outline-none focus:ring-1 focus:ring-secondary/40" />
                      </td>
                      <td className="pr-2 py-1.5">
                        {lines.length > 2 && (
                          <button onClick={() => removeLine(i)} className="p-0.5 text-gray-400 hover:text-danger"><X size={14} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addLine} className="mt-2 flex items-center gap-1 text-xs text-secondary hover:underline">
              <Plus size={12} /> Agregar línea
            </button>
          </div>

          {/* Indicador de balance */}
          <div
            aria-live="polite"
            aria-atomic="true"
            className={`flex items-center justify-between px-4 py-3 rounded-lg border ${balanced ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'}`}
          >
            <span className="text-sm font-medium text-gray-700">Diferencia (Débito - Crédito)</span>
            <span className={`text-sm font-bold text-currency ${balanced ? 'text-success' : 'text-danger'}`}>
              {balanced ? <Check size={14} className="inline mr-1" aria-hidden="true" /> : null}
              {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(totalDebit - totalCredit)}
            </span>
          </div>
          <div className="text-xs text-gray-400 flex gap-6 justify-end">
            <span>Σ Débito: <strong className="text-gray-700">{fmt(totalDebit)}</strong></span>
            <span>Σ Crédito: <strong className="text-gray-700">{fmt(totalCredit)}</strong></span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="secondary" type="button" onClick={() => handleSubmit('draft')}>Guardar borrador</Button>
          <Button variant="primary" type="button" isDisabled={!balanced} onClick={() => handleSubmit('posted')}>
            {balanced ? 'Contabilizar' : 'Contabilizar (cuadra primero)'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Página Journal ─────────────────────────────────────────────────────────-
export default function Journal() {
  const [showModal, setShowModal] = useState(false)
  const [data, setData] = useState<AsientoRow[]>(MOCK_ASIENTOS)

  const tableData = data.map((a) => ({ ...a, status: a.status as unknown as string })) as unknown as AsientoRow[]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Diario Contable</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registro de asientos por partida doble</p>
        </div>
        <Button id="journal-nuevo-asiento" variant="primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Nuevo asiento
        </Button>
      </div>

      <DataTable
        columns={[
          ...COLS,
          {
            key: 'status', header: 'Estado', type: 'badge',
            badgeMap: (v) => v === 'posted' ? 'success' : 'warning',
          } as Column<AsientoRow>,
        ]}
        data={tableData}
        onRowClick={(row) => console.log('asiento', row)}
      />

      {showModal && <NuevoAsientoModal onClose={() => setShowModal(false)} onSave={(asiento) => setData([asiento, ...data])} />}
    </div>
  )
}
