import React from 'react'
import { KPICard } from '@/components/ui/KPICard'
import { Card } from '@/components/ui/Card'
import { LineChartWrapper } from '@/components/charts/LineChartWrapper'
import { useAuthStore } from '@/store/authStore'

// ── Datos mock ────────────────────────────────────────────────────────────────
const MOCK_KPIS = [
  { name: 'Ingresos Netos',      value: 1_250_000_000, unit: 'CLP' as const, variation:  8.3, status: 'ok'       as const },
  { name: 'Margen Neto',         value: 13.6,           unit: '%'   as const, variation: -1.2, status: 'warning'  as const },
  { name: 'EBITDA',              value: 280_000_000,   unit: 'CLP' as const, variation:  5.1, status: 'ok'       as const },
  { name: 'Razón Corriente',     value: 1.67,           unit: 'x'   as const, variation:  0.2, status: 'ok'       as const },
  { name: 'Deuda / EBITDA',      value: 3.21,           unit: 'x'   as const, variation:  0.4, status: 'warning'  as const },
  { name: 'Free Cash Flow',      value: 130_000_000,   unit: 'CLP' as const, variation: -3.0, status: 'warning'  as const },
  { name: 'Crecimiento Ventas',  value: 8.3,            unit: '%'   as const, variation:  8.3, status: 'ok'       as const },
  { name: 'EVA',                 value: -24_000_000,   unit: 'CLP' as const, variation: -5.0, status: 'critical' as const },
]

const CHART_DATA = [
  { mes: '2024-03', ingresos: 980_000_000,  utilidad_neta: 130_000_000 },
  { mes: '2024-04', ingresos: 1_020_000_000, utilidad_neta: 140_000_000 },
  { mes: '2024-05', ingresos: 1_080_000_000, utilidad_neta: 152_000_000 },
  { mes: '2024-06', ingresos: 1_000_000_000, utilidad_neta: 128_000_000 },
  { mes: '2024-07', ingresos: 1_050_000_000, utilidad_neta: 145_000_000 },
  { mes: '2024-08', ingresos: 1_100_000_000, utilidad_neta: 148_000_000 },
  { mes: '2024-09', ingresos: 1_150_000_000, utilidad_neta: 156_000_000 },
  { mes: '2024-10', ingresos: 1_090_000_000, utilidad_neta: 149_000_000 },
  { mes: '2024-11', ingresos: 1_200_000_000, utilidad_neta: 162_000_000 },
  { mes: '2024-12', ingresos: 1_180_000_000, utilidad_neta: 160_000_000 },
  { mes: '2025-01', ingresos: 1_220_000_000, utilidad_neta: 165_000_000 },
  { mes: '2025-02', ingresos: 1_250_000_000, utilidad_neta: 170_000_000 },
]

function formatMillions(v: number) {
  if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(v) >= 1_000_000)     return `$${(v / 1_000_000).toFixed(0)}M`
  return `$${v}`
}

export default function Dashboard() {
  const { selectedMonth, selectedYear } = useAuthStore()

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard Financiero</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Período: {selectedMonth}/{selectedYear} — Datos expresados en CLP
        </p>
      </div>

      {/* KPIs — Grid 4 columnas */}
      <section aria-label="KPIs principales">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_KPIS.map((kpi) => (
            <KPICard key={kpi.name} {...kpi} />
          ))}
        </div>
      </section>

      {/* Gráfico de tendencia */}
      <Card
        title="Ingresos Netos vs Utilidad Neta — últimos 12 meses"
        className="w-full"
      >
        <LineChartWrapper
          data={CHART_DATA}
          xKey="mes"
          height={280}
          formatY={formatMillions}
          lines={[
            { key: 'ingresos',      name: 'Ingresos Netos', color: '#2E86AB' },
            { key: 'utilidad_neta', name: 'Utilidad Neta',  color: '#27AE60' },
          ]}
        />
      </Card>
    </div>
  )
}
