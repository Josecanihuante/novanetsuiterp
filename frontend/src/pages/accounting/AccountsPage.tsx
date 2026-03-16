import React from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { useAccounts } from '@/hooks/useAccounts';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

export const AccountsPage = () => {
  const { data, loading, error } = useAccounts();
  const { role } = useAuth();

  if (loading) return <div className="flex h-[300px] items-center justify-center">Loading...</div>;
  if (error) return <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">Error: {error}</div>;
  if (!data || data.length === 0) return <div className="p-4 text-center text-gray-500">No accounts found</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Plan de Cuentas</h2>
        <div className="flex gap-2">
          {role !== 'viewer' && (
            <Button onClick={() => alert('Create account functionality would go here')}>
              Crear Cuenta
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
          { accessorKey: 'code', header: 'Código' },
          { accessorKey: 'name', header: 'Nombre' },
          { accessorKey: 'account_type', header: 'Tipo' },
          { accessorKey: 'description', header: 'Descripción' },
        ]}
      />
    </div>
  );
};