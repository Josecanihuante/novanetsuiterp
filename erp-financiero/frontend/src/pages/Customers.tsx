import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'

interface CustomerRow {
  id: string; tax_id: string; name: string; email: string
  payment_terms_days: number; credit_limit: number; pending_balance: number
  [key: string]: unknown
}

const MOCK: CustomerRow[] = [
  { id: '1', tax_id: '76.543.210-K', name: 'Empresa ABC Ltda.', email: 'contacto@abc.cl', payment_terms_days: 30, credit_limit: 50_000_000, pending_balance: 5_950_000 },
  { id: '2', tax_id: '82.111.222-3', name: 'Servicios DEF SpA', email: 'finanzas@def.cl', payment_terms_days: 60, credit_limit: 80_000_000, pending_balance: 0 },
  { id: '3', tax_id: '93.456.789-1', name: 'Inversiones GHI SA', email: 'adm@ghi.cl',     payment_terms_days: 45, credit_limit: 120_000_000, pending_balance: 3_570_000 },
]

const COLS: Column<CustomerRow>[] = [
  { key: 'tax_id',              header: 'RUT',              type: 'text',    sortable: true },
  { key: 'name',                header: 'Razón Social',     type: 'text',    sortable: true },
  { key: 'email',               header: 'Email',            type: 'text' },
  { key: 'payment_terms_days',  header: 'Días Pago',        type: 'number',  sortable: true },
  { key: 'credit_limit',        header: 'Límite Crédito',   type: 'currency',sortable: true },
  { key: 'pending_balance',     header: 'Saldo Pendiente',  type: 'currency',sortable: true },
]

function CustomerModal({ customer, onClose }: { customer?: CustomerRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{customer ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {[
            { id: 'cust-tax-id', label: 'RUT', defaultValue: customer?.tax_id, placeholder: '76.543.210-K' },
            { id: 'cust-name',   label: 'Razón Social', defaultValue: customer?.name, placeholder: 'Empresa Ltda.' },
            { id: 'cust-email',  label: 'Email', defaultValue: customer?.email, placeholder: 'contacto@empresa.cl' },
            { id: 'cust-phone',  label: 'Teléfono', defaultValue: '', placeholder: '+56 9 1234 5678' },
            { id: 'cust-address',label: 'Dirección', defaultValue: '', placeholder: 'Av. Principal 123' },
            { id: 'cust-city',   label: 'Ciudad', defaultValue: '', placeholder: 'Santiago' },
          ].map(({ id, label, defaultValue, placeholder }) => (
            <div key={id} className="flex flex-col gap-1">
              <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
              <input id={id} type="text" defaultValue={defaultValue} placeholder={placeholder}
                className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 placeholder:text-gray-400" />
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <label htmlFor="cust-credit" className="text-sm font-medium text-gray-700">Límite Crédito</label>
            <input id="cust-credit" type="number" defaultValue={customer?.credit_limit}
              className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="cust-terms" className="text-sm font-medium text-gray-700">Días de pago</label>
            <input id="cust-terms" type="number" defaultValue={customer?.payment_terms_days}
              className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary">Guardar</Button>
        </div>
      </div>
    </div>
  )
}

export default function Customers() {
  const [showModal, setShowModal]       = useState(false)
  const [selectedCustomer, setSelected] = useState<CustomerRow | undefined>()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de cartera de clientes</p>
        </div>
        <Button id="customers-nuevo" variant="primary" onClick={() => { setSelected(undefined); setShowModal(true) }}>
          <Plus size={14} /> Nuevo cliente
        </Button>
      </div>

      <DataTable
        columns={COLS}
        data={MOCK}
        onRowClick={(row) => { setSelected(row); setShowModal(true) }}
      />

      {showModal && (
        <CustomerModal customer={selectedCustomer} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
