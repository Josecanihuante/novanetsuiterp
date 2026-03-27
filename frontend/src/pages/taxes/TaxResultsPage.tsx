import React from 'react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { useTaxResults, TaxResult } from '@/hooks/useTaxResults'
import { usePeriods } from '@/hooks/usePeriods'

type TaxResultRow = TaxResult & { [key: string]: unknown }

const formatCLP = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`

const COLS: Column<TaxResultRow>[] = [
  { key: 'period_name',     header: 'Período',           type: 'text', sortable: true },
  { key: 'total_sales_fmt', header: 'Ventas Totales',    type: 'text', sortable: true },
  { key: 'iva_collected_fmt', header: 'IVA Débito',      type: 'text', sortable: true },
  { key: 'iva_paid_fmt',    header: 'IVA Crédito',       type: 'text', sortable: true },
  { key: 'iva_balance_fmt', header: 'Balance IVA',       type: 'text', sortable: true },
  { key: 'ppm_paid_fmt',    header: 'PPM Pagado',        type: 'text', sortable: true },
  { key: 'status',          header: 'Estado F29',        type: 'text' },
]

export default function TaxResultsPage() {
  const { data, isLoading, error } = useTaxResults()
  const { data: periodsData } = usePeriods()

  const periodMap = new Map((periodsData?.data ?? []).map(p => [p.id, p.name]))

  const rows: TaxResultRow[] = (data?.data ?? []).map(r => ({
    ...r,
    period_name: periodMap.get(r.period_id) ?? r.period_id,
    total_sales_fmt: formatCLP(r.total_sales),
    iva_collected_fmt: formatCLP(r.iva_collected),
    iva_paid_fmt: formatCLP(r.iva_paid),
    iva_balance_fmt: formatCLP(r.iva_balance),
    ppm_paid_fmt: formatCLP(r.ppm_paid),
    status: r.is_filed ? '✅ Declarado' : '⏳ Pendiente',
  }))

  // KPIs sumario
  const totalIvaBalance = rows.reduce((sum, r) => sum + (r as TaxResult).iva_balance, 0)
  const totalPpm = rows.reduce((sum, r) => sum + (r as TaxResult).ppm_paid, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Resultados Tributarios</h1>
        <p className="text-sm text-gray-500 mt-0.5">Balance IVA y PPM por período fiscal (F29)</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Balance IVA Acumulado</p>
          <p className={`text-lg font-bold mt-1 ${totalIvaBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCLP(totalIvaBalance)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">PPM Total Pagado</p>
          <p className="text-lg font-bold text-blue-600 mt-1">{formatCLP(totalPpm)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Períodos Declarados</p>
          <p className="text-lg font-bold text-gray-800 mt-1">
            {rows.filter(r => (r as TaxResult).is_filed).length} / {rows.length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Tasa IVA vigente</p>
          <p className="text-lg font-bold text-gray-800 mt-1">19%</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Calculando resultados tributarios…</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error al cargar los resultados tributarios.</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No hay resultados tributarios calculados.</div>
      ) : (
        <DataTable columns={COLS} data={rows} />
      )}
    </div>
  )
}
