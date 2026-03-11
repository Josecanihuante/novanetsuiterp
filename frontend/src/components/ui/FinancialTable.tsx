import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface FinancialRow {
  name: string
  value: number
  indent?: number          // 0=normal, 1=pl-4, 2=pl-8
  isBold?: boolean         // subtotal / total
  isSubtotal?: boolean     // fondo gris
  verticalPct?: number | null
  deltaAbs?: number | null
  deltaPct?: number | null
}

interface FinancialTableProps {
  rows: FinancialRow[]
  titulo?: string
  moneda?: string
}

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(1)}%`
}

const indentClass: Record<number, string> = {
  0: '',
  1: 'pl-4',
  2: 'pl-8',
}

export function FinancialTable({ rows, titulo, moneda = 'CLP' }: FinancialTableProps) {
  const [showVertical, setShowVertical] = useState(true)
  const [showDeltaAbs, setShowDeltaAbs] = useState(true)
  const [showDeltaPct, setShowDeltaPct] = useState(true)

  return (
    <div className="w-full">
      {/* Header con toggles */}
      {titulo && (
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">{titulo}</h4>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <button
              onClick={() => setShowVertical((v) => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${showVertical ? 'border-secondary text-secondary' : 'border-gray-200'}`}
            >
              {showVertical ? <Eye size={11} /> : <EyeOff size={11} />} % Vert.
            </button>
            <button
              onClick={() => setShowDeltaAbs((v) => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${showDeltaAbs ? 'border-secondary text-secondary' : 'border-gray-200'}`}
            >
              {showDeltaAbs ? <Eye size={11} /> : <EyeOff size={11} />} Δ Abs.
            </button>
            <button
              onClick={() => setShowDeltaPct((v) => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${showDeltaPct ? 'border-secondary text-secondary' : 'border-gray-200'}`}
            >
              {showDeltaPct ? <Eye size={11} /> : <EyeOff size={11} />} Δ%
            </button>
          </div>
        </div>
      )}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left text-xs font-semibold text-gray-500 uppercase py-2 pr-4">Concepto</th>
            <th className="text-right text-xs font-semibold text-gray-500 uppercase py-2 px-3">Monto ({moneda})</th>
            {showVertical && (
              <th className="text-right text-xs font-semibold text-gray-500 uppercase py-2 px-3">% Vert.</th>
            )}
            {showDeltaAbs && (
              <th className="text-right text-xs font-semibold text-gray-500 uppercase py-2 px-3">Δ Abs.</th>
            )}
            {showDeltaPct && (
              <th className="text-right text-xs font-semibold text-gray-500 uppercase py-2 px-3">Δ%</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={[
                'border-b border-gray-100',
                row.isSubtotal ? 'bg-gray-50' : 'hover:bg-gray-50/50',
              ].join(' ')}
            >
              {/* Concepto */}
              <td
                className={[
                  'py-2 pr-4 text-gray-700',
                  indentClass[row.indent ?? 0],
                  row.isBold ? 'font-semibold' : '',
                ].join(' ')}
              >
                {row.name}
              </td>
              {/* Monto */}
              <td
                className={[
                  'py-2 px-3 text-right text-currency',
                  row.value < 0 ? 'text-danger' : 'text-gray-900',
                  row.isBold ? 'font-semibold' : '',
                ].join(' ')}
              >
                {formatCLP(row.value)}
              </td>
              {/* % Vertical */}
              {showVertical && (
                <td className="py-2 px-3 text-right text-gray-500 text-currency">
                  {formatPct(row.verticalPct)}
                </td>
              )}
              {/* Δ Absoluto */}
              {showDeltaAbs && (
                <td
                  className={[
                    'py-2 px-3 text-right text-currency',
                    row.deltaAbs !== null && row.deltaAbs !== undefined
                      ? row.deltaAbs >= 0 ? 'text-success' : 'text-danger'
                      : 'text-gray-400',
                  ].join(' ')}
                >
                  {row.deltaAbs !== null && row.deltaAbs !== undefined
                    ? formatCLP(row.deltaAbs)
                    : '—'}
                </td>
              )}
              {/* Δ% */}
              {showDeltaPct && (
                <td
                  className={[
                    'py-2 px-3 text-right text-currency',
                    row.deltaPct !== null && row.deltaPct !== undefined
                      ? row.deltaPct >= 0 ? 'text-success' : 'text-danger'
                      : 'text-gray-400',
                  ].join(' ')}
                >
                  {formatPct(row.deltaPct)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default FinancialTable
