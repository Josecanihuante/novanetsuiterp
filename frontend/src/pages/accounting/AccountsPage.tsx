import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { useAccounts, useCreateAccount, Account } from '@/hooks/useAccounts'
import { useAuthStore } from '@/store/authStore'

type AccountRow = Account & { [key: string]: unknown }

const COLS: Column<AccountRow>[] = [
  { key: 'code',         header: 'Código',    type: 'text', sortable: true },
  { key: 'name',         header: 'Nombre',    type: 'text', sortable: true },
  { key: 'account_type', header: 'Tipo',      type: 'text', sortable: true },
  { key: 'parent_id',    header: 'Cuenta padre', type: 'text' },
  { key: 'description',  header: 'Descripción',  type: 'text' },
]

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense']
const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: 'Activo', liability: 'Pasivo', equity: 'Patrimonio',
  revenue: 'Ingresos', expense: 'Gastos',
}

function AccountModal({ onClose }: { onClose: () => void }) {
  const createAccount = useCreateAccount()
  const [form, setForm] = useState({ code: '', name: '', account_type: 'asset', description: '' })

  const handleSave = () => {
    createAccount.mutate(form, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Nueva cuenta contable</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="acc-code" className="text-sm font-medium text-gray-700">Código</label>
            <input id="acc-code" type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              placeholder="1-01-001" className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="acc-type" className="text-sm font-medium text-gray-700">Tipo</label>
            <select id="acc-type" value={form.account_type} onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}
              className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40">
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label htmlFor="acc-name" className="text-sm font-medium text-gray-700">Nombre</label>
            <input id="acc-name" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Caja moneda nacional" className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label htmlFor="acc-desc" className="text-sm font-medium text-gray-700">Descripción</label>
            <input id="acc-desc" type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descripción opcional..." className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={createAccount.isPending}>
            {createAccount.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AccountsPage() {
  const role = useAuthStore(s => s.user?.role)
  const [showModal, setShowModal] = useState(false)
  const { data, isLoading, error } = useAccounts()

  const accounts: AccountRow[] = (data?.data ?? []).map(a => ({
    ...a,
    account_type: ACCOUNT_TYPE_LABELS[a.account_type] ?? a.account_type,
  }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Plan de Cuentas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Clasificación contable de activos, pasivos, patrimonio, ingresos y gastos</p>
        </div>
        {role !== 'viewer' && (
          <Button id="accounts-nuevo" variant="primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Nueva cuenta
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Cargando cuentas…</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error al cargar el plan de cuentas.</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No hay cuentas contables registradas.</div>
      ) : (
        <DataTable columns={COLS} data={accounts} />
      )}

      {showModal && <AccountModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
