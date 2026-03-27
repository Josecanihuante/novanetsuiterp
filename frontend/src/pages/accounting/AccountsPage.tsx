import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { useAccounts, useCreateAccount, Account } from '@/hooks/useAccounts'
import { useAuthStore } from '@/store/authStore'

type AccountRow = Account & { [key: string]: unknown }

const COLS: Column<AccountRow>[] = [
  { key: 'code',         header: 'Código',       type: 'text', sortable: true },
  { key: 'name',         header: 'Nombre',       type: 'text', sortable: true },
  { key: 'account_type', header: 'Tipo',         type: 'text', sortable: true },
  { key: 'parent_id',   header: 'Cuenta padre',  type: 'text' },
  { key: 'description', header: 'Descripción',   type: 'text' },
]

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense']

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: 'Activo',
  liability: 'Pasivo',
  equity: 'Patrimonio',
  revenue: 'Ingresos',
  expense: 'Gastos',
}

function AccountModal({ onClose }: { onClose: () => void }) {
  const createAccount = useCreateAccount()

  const [form, setForm] = useState({
    code: '',
    name: '',
    account_type: 'asset',
    description: '',
  })

  const handleSave = () => {
    createAccount.mutate(form, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Nueva cuenta contable</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Código</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="h-9 border rounded px-3 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Tipo</label>
            <select
              value={form.account_type}
              onChange={(e) =>
                setForm({ ...form, account_type: e.target.value })
              }
              className="h-9 border rounded px-3 text-sm"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ACCOUNT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-sm font-medium">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-9 border rounded px-3 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-sm font-medium">Descripción</label>
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="h-9 border rounded px-3 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={createAccount.isPending}>
            {createAccount.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AccountsPage() {
  const role = useAuthStore((s) => s.user?.role)

  const [showModal, setShowModal] = useState(false)

  const { data, isLoading, error } = useAccounts()

  const accounts = (data?.data ?? []).map((a) => ({
    ...a,
    account_type: ACCOUNT_TYPE_LABELS[a.account_type] ?? a.account_type,
  })) as AccountRow[]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Plan de Cuentas</h1>
          <p className="text-sm text-gray-500">
            Clasificación contable de activos, pasivos, patrimonio, ingresos y
            gastos
          </p>
        </div>

        {role !== 'viewer' && (
          <Button onClick={() => setShowModal(true)}>
            <Plus size={14} /> Nueva cuenta
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">Cargando cuentas…</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          Error al cargar cuentas
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No hay cuentas registradas
        </div>
      ) : (
        <DataTable columns={COLS} data={accounts} />
      )}

      {showModal && <AccountModal onClose={() => setShowModal(false)} />}
    </div>
  )
}