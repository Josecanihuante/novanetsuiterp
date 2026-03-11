import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface BarConfig {
  key: string
  name: string
  color: string
}

interface BarChartWrapperProps {
  data: Record<string, unknown>[]
  xKey: string
  bars: BarConfig[]
  height?: number
  formatY?: (v: number) => string
  stacked?: boolean
}

function defaultFormatY(v: number): string {
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(v)
}

export function BarChartWrapper({
  data,
  xKey,
  bars,
  height = 280,
  formatY = defaultFormatY,
  stacked = false,
}: BarChartWrapperProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barCategoryGap="30%" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatY}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatY(value), name]}
          contentStyle={{
            fontSize: 12,
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {bars.map((b) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.name}
            fill={b.color}
            stackId={stacked ? 'stack' : undefined}
            radius={[3, 3, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

export default BarChartWrapper
