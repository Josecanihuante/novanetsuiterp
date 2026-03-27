import React, { useState } from 'react'
import { Plus, Lock, X } from 'lucide-react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { usePeriods, useCreatePeriod, useClosePeriod, Period } from '@/hooks/usePeriods'
import { useAuthStore } from '@/store/authStore'

type PeriodRow = Period & { [key: string]: unknown }

const COLS: Column<PeriodRow>[] = [
  { key: 'name',        header: 'Nombre',      type: 'text', sortable: true },
  { key: 'fiscal_year', header: 'Año fiscal',  type: 'number', sortable: true },
  { key: 'start_date',  header: 'Inicio',      type: 'date', sortable: true },
  { key: 'end_date',    header: 'Fin',         type: 'date', sortable: true },
  { key: 'status',      header: 'Estado',      type: 'text' },
]

function PeriodModal({ onClose }: { onClose: () => void }) {
  const createPeriod = useCreatePeriod()
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', fiscal_year: new Date().getFullYear() })

  const handleSave = () => {
    createPeriod.mutate(form, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Nuevo período contable</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 col-span-2">
            <label htmlFor="per-name" className="text-sm font-medium text-gray-700">Nombre</label>
            <input id="per-name" type="text" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Enero 2026" className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="per-year" className="text-sm font-medium text-gray-700">Año fiscal</label>
            <input id="per-year" type="number" value={form.fiscal_year}
              onChange={e => setForm(f => ({ ...f, fiscal_year: Number(e.target.value) }))}
              className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="per-start" className="text-sm font-medium text-gray-700">Fecha inicio</label>
            <input id="per-start" type="date" value={form.start_date}
              onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="per-end" className="text-sm font-medium text-gray-700">Fecha fin</label>
            <input id="per-end" type="date" value={form.end_date}
              onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={createPeriod.isPending}>
            {createPeriod.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function PeriodsPage() {
  const role = useAuthStore(s => s.user?.role)
  const [showModal, setShowModal] = useState(false)
  const { data, isLoading, error } = usePeriods()
  const closePeriod = useClosePeriod()

  const periods: PeriodRow[] = (data?.data ?? []).map(p => ({
    ...p,
    start_date: new Date(p.start_date).toLocaleDateString('es-CL'),
    end_date: new Date(p.end_date).toLocaleDateString('es-CL'),
    status: p.is_closed ? '🔒 Cerrado' : '✅ Abierto',
  }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Períodos Contables</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de períodos fiscales y cierre de libros</p>
        </div>
        {role !== 'viewer' && (
          <Button id="periods-nuevo" variant="primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Nuevo período
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Cargando períodos…</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error al cargar los períodos.</div>
      ) : periods.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No hay períodos contables registrados.</div>
      ) : (
        <DataTable columns={COLS} data={periods} />
      )}

      {showModal && <PeriodModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
