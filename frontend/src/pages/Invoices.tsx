import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface InvoiceRow {
  id: string
  invoice_number: string
  type: string
  issue_date: string
  due_date: string
  party: string
  total: number
  status: string
  [key: string]: unknown
}

const MOCK: InvoiceRow[] = [
  { id: '1', invoice_number: 'F-001', type: 'Venta',   issue_date: '2025-02-01', due_date: '2025-03-01', party: 'Empresa ABC',    total: 5_950_000, status: 'issued' },
  { id: '2', invoice_number: 'F-002', type: 'Compra',  issue_date: '2025-02-05', due_date: '2025-03-05', party: 'Proveedor XYZ', total: 1_428_000, status: 'paid' },
  { id: '3', invoice_number: 'NC-01', type: 'NC',      issue_date: '2025-02-10', due_date: '2025-03-10', party: 'Empresa DEF',    total: -595_000, status: 'issued' },
  { id: '4', invoice_number: 'F-003', type: 'Venta',   issue_date: '2025-02-15', due_date: '2025-03-15', party: 'Cliente GHI',   total: 3_570_000, status: 'draft' },
]

const STATUS_BADGE = (v: unknown): 'success' | 'danger' | 'warning' | 'neutral' => {
  const s = String(v)
  if (s === 'paid')   return 'success'
  if (s === 'issued') return 'neutral'
  if (s === 'draft')  return 'warning'
  if (s === 'cancelled') return 'danger'
  return 'neutral'
}

const COLS: Column<InvoiceRow>[] = [
  { key: 'invoice_number', header: 'N° Factura', type: 'text',    sortable: true },
  { key: 'type',           header: 'Tipo',       type: 'text' },
  { key: 'issue_date',     header: 'Fecha',      type: 'date',    sortable: true },
  { key: 'due_date',       header: 'Vencimiento',type: 'date',    sortable: true },
  { key: 'party',          header: 'Contraparte',type: 'text' },
  { key: 'total',          header: 'Total',      type: 'currency',sortable: true },
  { key: 'status',         header: 'Estado',     type: 'badge',   badgeMap: STATUS_BADGE },
]

// ── Modal nueva factura ──────────────────────────────────────────────────────
interface InvoiceLine { producto: string; descripcion: string; cantidad: number; precio: number; descuento: number }

function NuevaFacturaModal({ onClose }: { onClose: () => void }) {
  const [tipo, setTipo]   = useState('Venta')
  const [lines, setLines] = useState<InvoiceLine[]>([
    { producto: '', descripcion: '', cantidad: 1, precio: 0, descuento: 0 },
  ])

  const subtotal = lines.reduce((s, l) => s + l.cantidad * l.precio * (1 - l.descuento / 100), 0)
  const iva      = subtotal * 0.19
  const total    = subtotal + iva

  const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

  const addLine = () => setLines((p) => [...p, { producto: '', descripcion: '', cantidad: 1, precio: 0, descuento: 0 }])
  const removeLine = (i: number) => setLines((p) => p.filter((_, idx) => idx !== i))
  const updateLine = (i: number, f: keyof InvoiceLine, v: string | number) =>
    setLines((p) => p.map((l, idx) => idx === i ? { ...l, [f]: v } : l))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Nueva Factura</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="inv-tipo" className="text-sm font-medium text-gray-700">Tipo</label>
              <select id="inv-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}
                className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40">
                {['Venta', 'Compra', 'Nota de Crédito', 'Nota de Débito'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="inv-contraparte" className="text-sm font-medium text-gray-700">{tipo === 'Compra' ? 'Proveedor' : 'Cliente'}</label>
              <input id="inv-contraparte" list="contrpartes-list" placeholder="Buscar..."
                className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
              <datalist id="contrpartes-list">
                <option value="Empresa ABC" /><option value="Cliente GHI" /><option value="Proveedor XYZ" />
              </datalist>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="inv-fecha" className="text-sm font-medium text-gray-700">Fecha emisión</label>
              <input id="inv-fecha" type="date" defaultValue={new Date().toISOString().slice(0, 10)}
                className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
            </div>
          </div>

          {/* Líneas */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Líneas de la factura</p>
            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Producto', 'Descripción', 'Cant.', 'Precio', 'Desc.%', 'Subtotal', ''].map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-gray-500 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((l, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">
                        <input list="productos-list" value={l.producto} onChange={(e) => updateLine(i, 'producto', e.target.value)}
                          className="w-full h-7 border border-gray-200 rounded px-2 focus:outline-none focus:ring-1 focus:ring-secondary/40" />
                        <datalist id="productos-list"><option value="Consultoría" /><option value="Licencia Software" /></datalist>
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={l.descripcion} onChange={(e) => updateLine(i, 'descripcion', e.target.value)}
                          className="w-full h-7 border border-gray-200 rounded px-2 focus:outline-none focus:ring-1 focus:ring-secondary/40" />
                      </td>
                      <td className="px-2 py-1.5 w-16">
                        <input type="number" min={1} value={l.cantidad} onChange={(e) => updateLine(i, 'cantidad', parseFloat(e.target.value) || 1)}
                          className="w-full h-7 border border-gray-200 rounded px-2 text-right focus:outline-none focus:ring-1 focus:ring-secondary/40" />
                      </td>
                      <td className="px-2 py-1.5 w-28">
                        <input type="number" min={0} value={l.precio || ''} onChange={(e) => updateLine(i, 'precio', parseFloat(e.target.value) || 0)}
                          className="w-full h-7 border border-gray-200 rounded px-2 text-right focus:outline-none focus:ring-1 focus:ring-secondary/40" />
                      </td>
                      <td className="px-2 py-1.5 w-16">
                        <input type="number" min={0} max={100} value={l.descuento || ''} onChange={(e) => updateLine(i, 'descuento', parseFloat(e.target.value) || 0)}
                          className="w-full h-7 border border-gray-200 rounded px-2 text-right focus:outline-none focus:ring-1 focus:ring-secondary/40" />
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-700 font-medium">
                        {fmt(l.cantidad * l.precio * (1 - l.descuento / 100))}
                      </td>
                      <td className="pr-2 py-1.5">
                        {lines.length > 1 && <button onClick={() => removeLine(i)} className="p-0.5 text-gray-400 hover:text-danger"><X size={12} /></button>}
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

          {/* Totales */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal (neto)</span><span className="text-currency font-medium">{fmt(subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>IVA (19%)</span><span className="text-currency font-medium">{fmt(iva)}</span></div>
            <div className="flex justify-between font-bold text-primary border-t border-gray-200 pt-1 mt-1"><span>TOTAL</span><span className="text-currency">{fmt(total)}</span></div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="secondary">Vista previa</Button>
          <Button variant="primary">Guardar factura</Button>
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'

export default function Invoices() {
  const [tipoFilter, setTipoFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = MOCK.filter((r) =>
    (!tipoFilter || r.type === tipoFilter) &&
    (!statusFilter || r.status === statusFilter)
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Facturación</h1>
          <p className="text-sm text-gray-500 mt-0.5">Facturas de venta, compra, NC y ND</p>
        </div>
        <Link to="/commerce/invoices/nueva">
          <Button id="invoices-nueva-factura" variant="primary">
            <Plus size={14} /> Nueva factura
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} aria-label="Filtrar por tipo"
          className="h-8 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-secondary/40">
          <option value="">Todos los tipos</option>
          {['Venta', 'Compra', 'NC', 'ND'].map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrar por estado"
          className="h-8 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-secondary/40">
          <option value="">Todos los estados</option>
          {['draft', 'issued', 'paid', 'cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <DataTable columns={COLS} data={filtered} onRowClick={(r) => console.log(r)} />
    </div>
  )
}
