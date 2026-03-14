import React, { useState } from 'react'
import { Download } from 'lucide-react'
import { FinancialTable } from '@/components/ui/FinancialTable'
import { Card } from '@/components/ui/Card'
import { WaterfallChart } from '@/components/charts/WaterfallChart'
import { Select } from '@/components/ui/Input'

// ── Datos mock ────────────────────────────────────────────────────────────────
const ER_ROWS = [
  { name: 'Ingresos', value: 1_250_000_000, indent: 0, isBold: true, isSubtotal: false, verticalPct: 100, deltaAbs: 95_000_000, deltaPct: 8.2 },
  { name: '(-) Costo de Ventas', value: -750_000_000, indent: 1, verticalPct: -60, deltaAbs: -50_000_000, deltaPct: 7.1 },
  { name: 'Utilidad Bruta', value: 500_000_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 40, deltaAbs: 45_000_000, deltaPct: 9.9 },
  { name: '(-) Gastos Operativos', value: -187_500_000, indent: 1, verticalPct: -15 },
  { name: 'EBIT', value: 312_500_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 25 },
  { name: '(+) Depreciación', value: 25_000_000, indent: 1, verticalPct: 2 },
  { name: 'EBITDA', value: 337_500_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 27 },
  { name: '(-) Gastos Financieros', value: -37_500_000, indent: 1, verticalPct: -3 },
  { name: 'EBT', value: 275_000_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 22 },
  { name: '(-) Impuesto Renta', value: -68_000_000, indent: 1, verticalPct: -5.4 },
  { name: 'Utilidad Neta', value: 207_000_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 16.6, deltaAbs: 17_000_000, deltaPct: 9.1 },
]

const WATERFALL_ITEMS = [
  { name: 'Ingresos',    value: 1_250_000_000, type: 'income'    as const },
  { name: '(-) CMV',     value:   750_000_000, type: 'deduction' as const },
  { name: 'Ut. Bruta',   value: 500_000_000,  type: 'subtotal'  as const },
  { name: '(-) Gastos',  value:   187_500_000, type: 'deduction' as const },
  { name: 'EBIT',        value: 312_500_000,  type: 'subtotal'  as const },
  { name: '(-) Fin.',    value:    37_500_000, type: 'deduction' as const },
  { name: '(-) Imp.',    value:    68_000_000, type: 'deduction' as const },
  { name: 'Ut. Neta',   value: 207_000_000,  type: 'subtotal'  as const },
]

const BG_ROWS = [
  { name: 'ACTIVO', value: 0, indent: 0, isBold: true, isSubtotal: true },
  { name: 'Efectivo y equivalentes', value: 187_500_000, indent: 1, verticalPct: 9.4 },
  { name: 'Cuentas por cobrar', value: 250_000_000, indent: 1, verticalPct: 12.5 },
  { name: 'Inventarios', value: 125_000_000, indent: 1, verticalPct: 6.3 },
  { name: 'TOTAL ACTIVO CORRIENTE', value: 562_500_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 28.1 },
  { name: 'Activos Fijos Netos', value: 1_000_000_000, indent: 1, verticalPct: 50 },
  { name: 'Intangibles', value: 437_500_000, indent: 1, verticalPct: 21.9 },
  { name: 'TOTAL ACTIVO NO CORRIENTE', value: 1_437_500_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 71.9 },
  { name: 'TOTAL ACTIVO', value: 2_000_000_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 100 },
  { name: 'PASIVO Y PATRIMONIO', value: 0, indent: 0, isBold: true, isSubtotal: true },
  { name: 'Cuentas por pagar', value: 187_500_000, indent: 1, verticalPct: 9.4 },
  { name: 'Deuda CP', value: 125_000_000, indent: 1, verticalPct: 6.3 },
  { name: 'TOTAL PASIVO CORRIENTE', value: 312_500_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 15.6 },
  { name: 'Deuda LP', value: 875_000_000, indent: 1, verticalPct: 43.8 },
  { name: 'TOTAL PASIVO', value: 1_187_500_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 59.4 },
  { name: 'Capital', value: 500_000_000, indent: 1, verticalPct: 25 },
  { name: 'Utilidades Retenidas', value: 312_500_000, indent: 1, verticalPct: 15.6 },
  { name: 'TOTAL PATRIMONIO', value: 812_500_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 40.6 },
  { name: 'TOTAL PASIVO + PATRIMONIO', value: 2_000_000_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 100 },
]

const EFE_ROWS = [
  { name: 'Utilidad Neta', value: 207_000_000, indent: 1 },
  { name: '(+) Depreciación', value: 25_000_000, indent: 1 },
  { name: '(-) Var. Cuentas por Cobrar', value: -12_500_000, indent: 1 },
  { name: 'FLUJO CAJA OPERACIONAL', value: 219_500_000, indent: 0, isBold: true, isSubtotal: true },
  { name: '(-) CAPEX', value: -62_500_000, indent: 1 },
  { name: 'FLUJO CAJA INVERSIÓN', value: -62_500_000, indent: 0, isBold: true, isSubtotal: true },
  { name: 'Emisión de deuda', value: 0, indent: 1 },
  { name: '(-) Dividendos', value: -25_000_000, indent: 1 },
  { name: 'FLUJO CAJA FINANCIERO', value: -25_000_000, indent: 0, isBold: true, isSubtotal: true },
  { name: 'VARIACIÓN NETA EFECTIVO', value: 132_000_000, indent: 0, isBold: true, isSubtotal: true },
  { name: 'Saldo inicial', value: 55_500_000, indent: 1 },
  { name: 'SALDO FINAL DE CAJA', value: 187_500_000, indent: 0, isBold: true, isSubtotal: true },
]

const EOAF_ROWS = [
  { name: 'FUENTES', value: 0, indent: 0, isBold: true, isSubtotal: true },
  { name: 'Utilidad Neta del Período', value: 207_000_000, indent: 1 },
  { name: 'Depreciación y Amortización', value: 25_000_000, indent: 1 },
  { name: 'TOTAL FUENTES', value: 232_000_000, indent: 0, isBold: true, isSubtotal: true },
  { name: 'USOS', value: 0, indent: 0, isBold: true, isSubtotal: true },
  { name: 'CAPEX', value: 62_500_000, indent: 1 },
  { name: 'Pago de dividendos', value: 25_000_000, indent: 1 },
  { name: 'TOTAL USOS', value: 87_500_000, indent: 0, isBold: true, isSubtotal: true },
  { name: 'SUPERÁVIT DE FONDOS', value: 144_500_000, indent: 0, isBold: true, isSubtotal: true },
]

const PERIODOS = [
  { value: '2025-02', label: 'Febrero 2025' },
  { value: '2025-01', label: 'Enero 2025' },
  { value: '2024-12', label: 'Diciembre 2024' },
  { value: '2024-11', label: 'Noviembre 2024' },
]

const TABS = ['Estado de Resultados', 'Balance General', 'EFE', 'EOAF']

export default function FinancialStatements() {
  const [tab, setTab]   = useState(0)
  const [period, setPeriod] = useState(PERIODOS[0].value)
  const [compare, setCompare]= useState('')

  const tabContent = [
    <div className="space-y-6" key="er">
      <FinancialTable rows={ER_ROWS} titulo="Estado de Resultados" />
      <Card title="Cascada de Resultados">
        <WaterfallChart items={WATERFALL_ITEMS} height={300} />
      </Card>
    </div>,
    <FinancialTable rows={BG_ROWS} titulo="Balance General" key="bg" />,
    <FinancialTable rows={EFE_ROWS} titulo="Estado de Flujos de Efectivo (Método Indirecto)" key="efe" />,
    <FinancialTable rows={EOAF_ROWS} titulo="Estado de Origen y Aplicación de Fondos" key="eoaf" />,
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Estados Financieros</h1>
          <p className="text-sm text-gray-500 mt-0.5">Análisis vertical y horizontal</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Período actual"
            className="h-8 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
          >
            {PERIODOS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select
            value={compare}
            onChange={(e) => setCompare(e.target.value)}
            aria-label="Período de comparación"
            className="h-8 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
          >
            <option value="">Sin comparación</option>
            {PERIODOS.filter((p) => p.value !== period).map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button
            id="financial-export-excel"
            className="flex items-center gap-1.5 h-8 px-3 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Download size={12} /> Exportar Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={[
                'whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                tab === i
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido */}
      <Card>{tabContent[tab]}</Card>
    </div>
  )
}
