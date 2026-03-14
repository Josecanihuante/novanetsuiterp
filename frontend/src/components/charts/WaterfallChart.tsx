import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts'

interface WaterfallItem {
  name: string
  value: number
  type: 'income' | 'deduction' | 'subtotal'
}

interface WaterfallChartProps {
  items: WaterfallItem[]
  height?: number
  formatValue?: (v: number) => string
}

function defaultFormat(v: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
  }).format(Math.abs(v))
}

const TYPE_COLOR: Record<WaterfallItem['type'], string> = {
  income:    '#2E86AB',
  deduction: '#E74C3C',
  subtotal:  '#27AE60',
}

export function WaterfallChart({
  items,
  height = 320,
  formatValue = defaultFormat,
}: WaterfallChartProps) {
  // Construcción de barras flotantes (base + valor)
  let running = 0
  const chartData = items.map((item) => {
    let base: number
    if (item.type === 'subtotal') {
      base = 0
    } else if (item.type === 'income') {
      base = running
      running += item.value
    } else {
      // deducción — valor positivo significa resta
      base = running - Math.abs(item.value)
      running -= Math.abs(item.value)
    }

    return {
      name: item.name,
      base,
      amount: Math.abs(item.type === 'subtotal' ? running : item.value),
      type: item.type,
      fill: TYPE_COLOR[item.type],
      rawValue: item.type === 'subtotal' ? running : item.value,
    }
  })

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} barCategoryGap="35%" margin={{ top: 16, right: 16, left: 16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tickFormatter={formatValue}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            formatter={(v: number, _: string, props: { payload?: { rawValue?: number } }) =>
              [formatValue(props.payload?.rawValue ?? v), 'Monto']
            }
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
          />
          {/* Barra transparente de base (invisible, solo eleva) */}
          <Bar dataKey="base" stackId="wf" fill="transparent" />
          {/* Barra de valor con color */}
          <Bar dataKey="amount" stackId="wf" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
          <ReferenceLine y={0} stroke="#e5e7eb" />
        </BarChart>
      </ResponsiveContainer>
      {/* Leyenda manual */}
      <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: TYPE_COLOR.income }} /> Ingreso
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: TYPE_COLOR.deduction }} /> Deducción
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: TYPE_COLOR.subtotal }} /> Utilidad parcial
        </span>
      </div>
    </div>
  )
}

export default WaterfallChart
