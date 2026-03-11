import React from 'react'
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'

interface GaugeChartProps {
  value: number
  min?: number
  max?: number
  okRange?: [number, number]
  warningRange?: [number, number]
  label?: string
  formatValue?: (v: number) => string
  height?: number
}

function getColor(value: number, okRange?: [number, number], warningRange?: [number, number]): string {
  if (okRange && value >= okRange[0] && value <= okRange[1]) return '#27AE60'
  if (warningRange && value >= warningRange[0] && value <= warningRange[1]) return '#E67E22'
  return '#E74C3C'
}

export function GaugeChart({
  value,
  min = 0,
  max = 100,
  okRange,
  warningRange,
  label,
  formatValue,
  height = 200,
}: GaugeChartProps) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  const color = getColor(value, okRange, warningRange)
  const display = formatValue ? formatValue(value) : value.toFixed(1)

  const data = [{ value: pct, fill: color }]

  return (
    <div className="relative flex flex-col items-center">
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart
          innerRadius="65%"
          outerRadius="90%"
          data={data}
          startAngle={180}
          endAngle={0}
          barSize={14}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#f3f4f6' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      {/* Valor central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
        <span className="text-2xl font-bold" style={{ color }}>{display}</span>
        {label && <span className="text-xs text-gray-500 mt-0.5">{label}</span>}
      </div>
      {/* Leyenda min/max */}
      <div className="flex justify-between w-full px-6 -mt-2 text-xs text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

export default GaugeChart
