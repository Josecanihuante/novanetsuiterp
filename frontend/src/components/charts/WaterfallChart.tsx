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
  // Construcción de barras flotantes usando rango [bottom, top]
  let running = 0
  const chartData = items.map((item) => {
    let bottom: number
    let top: number
    
    if (item.type === 'subtotal') {
      bottom = 0
      top = item.value
      running = item.value
    } else if (item.type === 'income') {
      bottom = running
      top = running + item.value
      running += item.value
    } else {
      // deducción — el rango es desde el remanente (bottom) hasta el running anterior (top)
      bottom = running - item.value
      top = running
      running -= item.value
    }

    return {
      name: item.name,
      range: [bottom, top],
      type: item.type,
      fill: TYPE_COLOR[item.type],
      rawValue: item.type === 'deduction' ? -item.value : item.value,
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
            formatter={(v: number | [number, number], _: string, props: { payload?: { rawValue?: number } }) =>
              [formatValue(props.payload?.rawValue ?? (Array.isArray(v) ? (v[1] - v[0]) : v)), 'Monto']
            }
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
          />
          {/* Barra flotante de rango */}
          <Bar dataKey="range" radius={[3, 3, 0, 0]}>
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
