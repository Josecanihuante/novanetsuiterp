import React from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

export const JournalEntriesPage = () => {
  const { data, loading, error } = useJournalEntries();
  const { role } = useAuthStore.getState();

  if (loading) return <div className="flex h-[300px] items-center justify-center">Loading...</div>;
  if (error) return <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">Error: {error}</div>;
  if (!data || data.length === 0) return <div className="p-4 text-center text-gray-500">No journal entries found</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Asientos Contables</h2>
        <div className="flex gap-2">
          {role !== 'viewer' && (
            <Button onClick={() => alert('Create journal entry functionality would go here')}>
              Nuevo Asiento
            </Button>
          )}
          {role === 'admin' && (
            <Button variant="outline">
              Exportar
            </Button>
          )}
        </div>
      </div>
      <DataTable
        data={data}
        columns={[
          { accessorKey: 'entry_number', header: 'Número' },
          { accessorKey: 'entry_date', header: 'Fecha' },
          { accessorKey: 'description', header: 'Descripción' },
          { accessorKey: 'status', header: 'Estado' },
        ]}
      />
    </div>
  );
};