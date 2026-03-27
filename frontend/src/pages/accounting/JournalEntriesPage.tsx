import React from 'react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { useJournalEntries } from '@/hooks/useJournalEntries'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

interface JournalRow { [key: string]: unknown }

const COLS: Column<JournalRow>[] = [
  { key: 'entry_number', header: 'Número',       type: 'text', sortable: true },
  { key: 'entry_date',   header: 'Fecha',        type: 'date', sortable: true },
  { key: 'description',  header: 'Descripción',  type: 'text' },
  { key: 'status',       header: 'Estado',       type: 'text' },
]

export const JournalEntriesPage = () => {
  const { data: rawData, loading, error } = useJournalEntries()
  const role = useAuthStore(s => s.user?.role)

  if (loading) return <div className="flex h-[300px] items-center justify-center">Cargando asientos…</div>
  if (error) return <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">Error al cargar asientos</div>

  const rows: JournalRow[] = (rawData ?? []) as JournalRow[]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Asientos Contables</h1>
          <p className="text-sm text-gray-500 mt-0.5">Libro diario de asientos contables</p>
        </div>
        <div className="flex gap-2">
          {role !== 'viewer' && (
            <Button variant="primary" onClick={() => alert('Nuevo asiento')}>
              Nuevo Asiento
            </Button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No hay asientos contables registrados.</div>
      ) : (
        <DataTable columns={COLS} data={rows} />
      )}
    </div>
  )
}

export default JournalEntriesPage