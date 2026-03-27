import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { useVendors, useCreateVendor, Vendor } from '@/hooks/useVendors'
import { useAuthStore } from '@/store/authStore'

type VendorRow = Vendor & { [key: string]: unknown }

const COLS: Column<VendorRow>[] = [
  { key: 'tax_id',             header: 'RUT',           type: 'text', sortable: true },
  { key: 'name',               header: 'Razón Social',  type: 'text', sortable: true },
  { key: 'email',              header: 'Email',         type: 'text' },
  { key: 'phone',              header: 'Teléfono',      type: 'text' },
  { key: 'payment_terms_days', header: 'Días Pago',     type: 'number', sortable: true },
]

function VendorModal({ onClose }: { onClose: () => void }) {
  const createVendor = useCreateVendor()
  const [form, setForm] = useState({
    tax_id: '', name: '', trade_name: '', email: '', phone: '', address: '', payment_terms_days: 30
  })

  const handleSave = () => {
    createVendor.mutate(form, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Nuevo proveedor</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {[
            { id: 'vnd-tax-id',    label: 'RUT',            key: 'tax_id',    placeholder: '76.543.210-K' },
            { id: 'vnd-name',      label: 'Razón Social',   key: 'name',      placeholder: 'Proveedor Ltda.' },
            { id: 'vnd-trade',     label: 'Nombre Fantasía', key: 'trade_name', placeholder: 'Opcional' },
            { id: 'vnd-email',     label: 'Email',          key: 'email',     placeholder: 'contacto@proveedor.cl' },
            { id: 'vnd-phone',     label: 'Teléfono',       key: 'phone',     placeholder: '+56 2 1234 5678' },
            { id: 'vnd-address',   label: 'Dirección',      key: 'address',   placeholder: 'Av. Principal 123' },
          ].map(({ id, label, key, placeholder }) => (
            <div key={id} className="flex flex-col gap-1">
              <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
              <input id={id} type="text" value={form[key as keyof typeof form] as string}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 placeholder:text-gray-400" />
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <label htmlFor="vnd-terms" className="text-sm font-medium text-gray-700">Días de pago</label>
            <input id="vnd-terms" type="number" value={form.payment_terms_days}
              onChange={e => setForm(f => ({ ...f, payment_terms_days: Number(e.target.value) }))}
              className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={createVendor.isPending}>
            {createVendor.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function VendorsPage() {
  const role = useAuthStore(s => s.user?.role)
  const [showModal, setShowModal] = useState(false)
  const { data, isLoading, error } = useVendors()

  const vendors: VendorRow[] = (data?.data ?? []).map(v => ({ ...v } as VendorRow))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de proveedores y condiciones de pago</p>
        </div>
        {role !== 'viewer' && (
          <Button id="vendors-nuevo" variant="primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Nuevo proveedor
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Cargando proveedores…</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error al cargar los proveedores.</div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No hay proveedores registrados.</div>
      ) : (
        <DataTable columns={COLS} data={vendors} />
      )}

      {showModal && <VendorModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
