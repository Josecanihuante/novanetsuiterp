import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { SkeletonKPI } from './Skeleton'

type Status = 'ok' | 'warning' | 'critical' | 'neutral'
type Unit = 'CLP' | '%' | 'x' | 'días'

interface KPICardProps {
  name: string
  value: number | null
  unit: Unit
  variation?: number
  status: Status
  isLoading?: boolean
}

const statusBar: Record<Status, string> = {
  ok:       'bg-success',
  warning:  'bg-warning',
  critical: 'bg-danger',
  neutral:  'bg-gray-300',
}

const statusValue: Record<Status, string> = {
  ok:       'text-success',
  warning:  'text-warning',
  critical: 'text-danger',
  neutral:  'text-gray-700',
}

function formatValue(value: number | null, unit: Unit): string {
  if (value === null) return '—'
  if (unit === 'CLP') {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value)
  }
  if (unit === '%') return `${value.toFixed(1)}%`
  if (unit === 'x')  return `${value.toFixed(2)}x`
  if (unit === 'días') return `${Math.round(value)} días`
  return String(value)
}

export function KPICard({ name, value, unit, variation, status, isLoading }: KPICardProps) {
  if (isLoading) return <SkeletonKPI />

  const isPositive = variation !== undefined && variation > 0
  const isNegative = variation !== undefined && variation < 0

  return (
    <div className="flex bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Barra lateral de color — 4px */}
      <div className={`w-1 shrink-0 ${statusBar[status]}`} />

      <div className="flex-1 px-4 py-3 min-w-0">
        {/* Nombre */}
        <p className="text-xs text-gray-500 truncate">{name}</p>

        {/* Valor */}
        <p className={`text-2xl font-bold mt-0.5 text-currency ${statusValue[status]}`}>
          {formatValue(value, unit)}
        </p>

        {/* Variación */}
        {variation !== undefined && (
          <div
            className={`flex items-center gap-1 mt-1 text-xs font-medium ${
              isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-gray-500'
            }`}
          >
            {isPositive ? (
              <TrendingUp size={12} />
            ) : isNegative ? (
              <TrendingDown size={12} />
            ) : (
              <Minus size={12} />
            )}
            <span>{Math.abs(variation).toFixed(1)}% vs período anterior</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default KPICard
