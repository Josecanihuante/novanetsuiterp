import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface LineConfig {
  key: string
  name: string
  color: string
}

interface LineChartWrapperProps {
  data: Record<string, unknown>[]
  xKey: string
  lines: LineConfig[]
  height?: number
  formatY?: (v: number) => string
}

function defaultFormatY(v: number): string {
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(v)
}

function formatXTick(value: string): string {
  const date = new Date(value)
  if (!isNaN(date.getTime())) {
    return format(date, 'MMM', { locale: es }).toUpperCase()
  }
  return value
}

export function LineChartWrapper({
  data,
  xKey,
  lines,
  height = 280,
  formatY = defaultFormatY,
}: LineChartWrapperProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey={xKey}
          tickFormatter={formatXTick}
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
          labelStyle={{ color: '#374151', fontWeight: 600 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        {lines.map((l) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name}
            stroke={l.color}
            strokeWidth={2}
            dot={{ r: 3, fill: l.color }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export default LineChartWrapper
