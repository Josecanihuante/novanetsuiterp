import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import { FinancialTable } from '@/components/ui/FinancialTable'
import { Card } from '@/components/ui/Card'
import { WaterfallChart } from '@/components/charts/WaterfallChart'
import { Select } from '@/components/ui/Input'

// ── Datos mock ────────────────────────────────────────────────────────────────
// ── Período anterior (Enero 2025) — base para calcular variaciones ────────────
// ER período anterior
const ER_PREV: Record<string, number> = {
  'Ingresos':              1_155_000_000,
  '(-) Costo de Ventas':    -700_000_000,
  'Utilidad Bruta':          455_000_000,
  '(-) Gastos Operativos':  -172_500_000,
  'EBIT':                    282_500_000,
  '(+) Depreciación':         23_000_000,
  'EBITDA':                  305_500_000,
  '(-) Gastos Financieros':  -34_000_000,
  'EBT':                     248_500_000,
  '(-) Impuesto Renta':      -58_500_000,
  'Utilidad Neta':           190_000_000,
}

// BG período anterior (Enero 2025)
const BG_PREV: Record<string, number> = {
  'Efectivo y equivalentes':      155_000_000,
  'Cuentas por cobrar':           230_000_000,
  'Inventarios':                  110_000_000,
  'TOTAL ACTIVO CORRIENTE':       495_000_000,
  'Activos Fijos Netos':          980_000_000,
  'Intangibles':                  425_000_000,
  'TOTAL ACTIVO NO CORRIENTE':  1_405_000_000,
  'TOTAL ACTIVO':               1_900_000_000,
  'Cuentas por pagar':            172_000_000,
  'Deuda CP':                     118_000_000,
  'TOTAL PASIVO CORRIENTE':       290_000_000,
  'Deuda LP':                     860_000_000,
  'TOTAL PASIVO':               1_150_000_000,
  'Capital':                      500_000_000,
  'Utilidades Retenidas':         250_000_000,
  'TOTAL PATRIMONIO':             750_000_000,
  'TOTAL PASIVO + PATRIMONIO':  1_900_000_000,
}

// EFE período anterior (Enero 2025)
const EFE_PREV: Record<string, number> = {
  'Utilidad Neta':                      190_000_000,
  '(+) Depreciación':                    23_000_000,
  '(-) Var. Cuentas por Cobrar':        -18_000_000,
  'FLUJO CAJA OPERACIONAL':             195_000_000,
  '(-) CAPEX':                          -55_000_000,
  'FLUJO CAJA INVERSIÓN':               -55_000_000,
  'Emisión de deuda':                            0,
  '(-) Dividendos':                     -22_000_000,
  'FLUJO CAJA FINANCIERO':              -22_000_000,
  'VARIACIÓN NETA EFECTIVO':            118_000_000,
  'Saldo inicial':                       37_500_000,
  'SALDO FINAL DE CAJA':                155_500_000,
}

// EOAF período anterior (Enero 2025)
const EOAF_PREV: Record<string, number> = {
  'Utilidad Neta del Período':  190_000_000,
  'Depreciación y Amortización':  23_000_000,
  'TOTAL FUENTES':              213_000_000,
  'CAPEX':                       55_000_000,
  'Pago de dividendos':          22_000_000,
  'TOTAL USOS':                  77_000_000,
  'SUPERÁVIT DE FONDOS':        136_000_000,
}

// Helper: calcula Δ Abs y Δ% respecto al período anterior
function withDelta(name: string, value: number, prev: Record<string, number>) {
  const p = prev[name]
  if (p === undefined || p === 0) return {}
  const deltaAbs = value - p
  const deltaPct = (deltaAbs / Math.abs(p)) * 100
  return { deltaAbs: Math.round(deltaAbs), deltaPct: Math.round(deltaPct * 10) / 10 }
}

const ER_ROWS = [
  { name: 'Ingresos',             value:  1_250_000_000, indent: 0, isBold: true,  isSubtotal: false, verticalPct: 100,  ...withDelta('Ingresos',             1_250_000_000, ER_PREV) },
  { name: '(-) Costo de Ventas',  value:   -750_000_000, indent: 1,                                   verticalPct: -60,  ...withDelta('(-) Costo de Ventas',  -750_000_000,  ER_PREV) },
  { name: 'Utilidad Bruta',       value:    500_000_000, indent: 0, isBold: true,  isSubtotal: true,  verticalPct:  40,  ...withDelta('Utilidad Bruta',        500_000_000,   ER_PREV) },
  { name: '(-) Gastos Operativos',value:   -187_500_000, indent: 1,                                   verticalPct: -15,  ...withDelta('(-) Gastos Operativos',-187_500_000,  ER_PREV) },
  { name: 'EBIT',                 value:    312_500_000, indent: 0, isBold: true,  isSubtotal: true,  verticalPct:  25,  ...withDelta('EBIT',                  312_500_000,   ER_PREV) },
  { name: '(+) Depreciación',     value:     25_000_000, indent: 1,                                   verticalPct:   2,  ...withDelta('(+) Depreciación',       25_000_000,   ER_PREV) },
  { name: 'EBITDA',               value:    337_500_000, indent: 0, isBold: true,  isSubtotal: true,  verticalPct:  27,  ...withDelta('EBITDA',                337_500_000,   ER_PREV) },
  { name: '(-) Gastos Financieros',value:   -37_500_000, indent: 1,                                   verticalPct:  -3,  ...withDelta('(-) Gastos Financieros', -37_500_000,  ER_PREV) },
  { name: 'EBT',                  value:    275_000_000, indent: 0, isBold: true,  isSubtotal: true,  verticalPct:  22,  ...withDelta('EBT',                   275_000_000,   ER_PREV) },
  { name: '(-) Impuesto Renta',   value:    -68_000_000, indent: 1,                                   verticalPct:  -5.4,...withDelta('(-) Impuesto Renta',    -68_000_000,   ER_PREV) },
  { name: 'Utilidad Neta',        value:    207_000_000, indent: 0, isBold: true,  isSubtotal: true,  verticalPct:  16.6,...withDelta('Utilidad Neta',         207_000_000,   ER_PREV) },
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
  { name: 'ACTIVO',                   value:             0, indent: 0, isBold: true, isSubtotal: true },
  { name: 'Efectivo y equivalentes',  value:   187_500_000, indent: 1, verticalPct:  9.4, ...withDelta('Efectivo y equivalentes',    187_500_000, BG_PREV) },
  { name: 'Cuentas por cobrar',       value:   250_000_000, indent: 1, verticalPct: 12.5, ...withDelta('Cuentas por cobrar',          250_000_000, BG_PREV) },
  { name: 'Inventarios',              value:   125_000_000, indent: 1, verticalPct:  6.3, ...withDelta('Inventarios',                 125_000_000, BG_PREV) },
  { name: 'TOTAL ACTIVO CORRIENTE',   value:   562_500_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 28.1, ...withDelta('TOTAL ACTIVO CORRIENTE',   562_500_000, BG_PREV) },
  { name: 'Activos Fijos Netos',      value: 1_000_000_000, indent: 1, verticalPct: 50,   ...withDelta('Activos Fijos Netos',       1_000_000_000, BG_PREV) },
  { name: 'Intangibles',              value:   437_500_000, indent: 1, verticalPct: 21.9, ...withDelta('Intangibles',                 437_500_000, BG_PREV) },
  { name: 'TOTAL ACTIVO NO CORRIENTE',value: 1_437_500_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 71.9, ...withDelta('TOTAL ACTIVO NO CORRIENTE', 1_437_500_000, BG_PREV) },
  { name: 'TOTAL ACTIVO',             value: 2_000_000_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 100,  ...withDelta('TOTAL ACTIVO',             2_000_000_000, BG_PREV) },
  { name: 'PASIVO Y PATRIMONIO',      value:             0, indent: 0, isBold: true, isSubtotal: true },
  { name: 'Cuentas por pagar',        value:   187_500_000, indent: 1, verticalPct:  9.4, ...withDelta('Cuentas por pagar',           187_500_000, BG_PREV) },
  { name: 'Deuda CP',                 value:   125_000_000, indent: 1, verticalPct:  6.3, ...withDelta('Deuda CP',                    125_000_000, BG_PREV) },
  { name: 'TOTAL PASIVO CORRIENTE',   value:   312_500_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 15.6, ...withDelta('TOTAL PASIVO CORRIENTE',   312_500_000, BG_PREV) },
  { name: 'Deuda LP',                 value:   875_000_000, indent: 1, verticalPct: 43.8, ...withDelta('Deuda LP',                    875_000_000, BG_PREV) },
  { name: 'TOTAL PASIVO',             value: 1_187_500_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 59.4, ...withDelta('TOTAL PASIVO',             1_187_500_000, BG_PREV) },
  { name: 'Capital',                  value:   500_000_000, indent: 1, verticalPct: 25,   ...withDelta('Capital',                     500_000_000, BG_PREV) },
  { name: 'Utilidades Retenidas',     value:   312_500_000, indent: 1, verticalPct: 15.6, ...withDelta('Utilidades Retenidas',         312_500_000, BG_PREV) },
  { name: 'TOTAL PATRIMONIO',         value:   812_500_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 40.6, ...withDelta('TOTAL PATRIMONIO',         812_500_000, BG_PREV) },
  { name: 'TOTAL PASIVO + PATRIMONIO',value: 2_000_000_000, indent: 0, isBold: true, isSubtotal: true, verticalPct: 100,  ...withDelta('TOTAL PASIVO + PATRIMONIO', 2_000_000_000, BG_PREV) },
]

const EFE_ROWS = [
  { name: 'Utilidad Neta',                   value:  207_000_000, indent: 1, ...withDelta('Utilidad Neta',                   207_000_000, EFE_PREV) },
  { name: '(+) Depreciación',                value:   25_000_000, indent: 1, ...withDelta('(+) Depreciación',                 25_000_000, EFE_PREV) },
  { name: '(-) Var. Cuentas por Cobrar',     value:  -12_500_000, indent: 1, ...withDelta('(-) Var. Cuentas por Cobrar',    -12_500_000, EFE_PREV) },
  { name: 'FLUJO CAJA OPERACIONAL',          value:  219_500_000, indent: 0, isBold: true, isSubtotal: true, ...withDelta('FLUJO CAJA OPERACIONAL',   219_500_000, EFE_PREV) },
  { name: '(-) CAPEX',                       value:  -62_500_000, indent: 1, ...withDelta('(-) CAPEX',                       -62_500_000, EFE_PREV) },
  { name: 'FLUJO CAJA INVERSIÓN',            value:  -62_500_000, indent: 0, isBold: true, isSubtotal: true, ...withDelta('FLUJO CAJA INVERSIÓN',    -62_500_000, EFE_PREV) },
  { name: 'Emisión de deuda',                value:           0,  indent: 1 },
  { name: '(-) Dividendos',                  value:  -25_000_000, indent: 1, ...withDelta('(-) Dividendos',                  -25_000_000, EFE_PREV) },
  { name: 'FLUJO CAJA FINANCIERO',           value:  -25_000_000, indent: 0, isBold: true, isSubtotal: true, ...withDelta('FLUJO CAJA FINANCIERO',   -25_000_000, EFE_PREV) },
  { name: 'VARIACIÓN NETA EFECTIVO',         value:  132_000_000, indent: 0, isBold: true, isSubtotal: true, ...withDelta('VARIACIÓN NETA EFECTIVO',  132_000_000, EFE_PREV) },
  { name: 'Saldo inicial',                   value:   55_500_000, indent: 1, ...withDelta('Saldo inicial',                    55_500_000, EFE_PREV) },
  { name: 'SALDO FINAL DE CAJA',             value:  187_500_000, indent: 0, isBold: true, isSubtotal: true, ...withDelta('SALDO FINAL DE CAJA',     187_500_000, EFE_PREV) },
]

const EOAF_ROWS = [
  { name: 'FUENTES',                    value:           0, indent: 0, isBold: true, isSubtotal: true },
  { name: 'Utilidad Neta del Período',  value: 207_000_000, indent: 1, ...withDelta('Utilidad Neta del Período',  207_000_000, EOAF_PREV) },
  { name: 'Depreciación y Amortización',value:  25_000_000, indent: 1, ...withDelta('Depreciación y Amortización', 25_000_000, EOAF_PREV) },
  { name: 'TOTAL FUENTES',              value: 232_000_000, indent: 0, isBold: true, isSubtotal: true, ...withDelta('TOTAL FUENTES',  232_000_000, EOAF_PREV) },
  { name: 'USOS',                       value:           0, indent: 0, isBold: true, isSubtotal: true },
  { name: 'CAPEX',                      value:  62_500_000, indent: 1, ...withDelta('CAPEX',              62_500_000, EOAF_PREV) },
  { name: 'Pago de dividendos',         value:  25_000_000, indent: 1, ...withDelta('Pago de dividendos', 25_000_000, EOAF_PREV) },
  { name: 'TOTAL USOS',                 value:  87_500_000, indent: 0, isBold: true, isSubtotal: true, ...withDelta('TOTAL USOS',     87_500_000, EOAF_PREV) },
  { name: 'SUPERÁVIT DE FONDOS',        value: 144_500_000, indent: 0, isBold: true, isSubtotal: true, ...withDelta('SUPERÁVIT DE FONDOS', 144_500_000, EOAF_PREV) },
]

const PERIODOS = [
  { value: '2025-02', label: 'Febrero 2025' },
  { value: '2025-01', label: 'Enero 2025' },
  { value: '2024-12', label: 'Diciembre 2024' },
  { value: '2024-11', label: 'Noviembre 2024' },
]

const TABS = ['Estado de Resultados', 'Balance General', 'EFE', 'EOAF']

export default function FinancialStatements() {
  const location = useLocation()
  const navigate = useNavigate()

  const pathToIndex: Record<string, number> = {
    'estado-resultados': 0,
    'balance-general': 1,
    'efe': 2,
    'eoaf': 3
  }
  const indexToPath = ['estado-resultados', 'balance-general', 'efe', 'eoaf']

  const currentPath = location.pathname.split('/').pop() || 'estado-resultados'
  const tab = pathToIndex[currentPath] ?? 0

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
              onClick={() => navigate(`/financiero/${indexToPath[i]}`)}
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
