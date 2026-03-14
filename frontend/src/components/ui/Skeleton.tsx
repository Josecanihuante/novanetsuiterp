import React from 'react'

// ── SkeletonKPI ───────────────────────────────────────────────────────────────

export function SkeletonKPI() {
  return (
    <div className="flex bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="w-1 shrink-0 shimmer" />
      <div className="flex-1 px-4 py-3 space-y-2">
        <div className="shimmer h-3 w-24 rounded" />
        <div className="shimmer h-7 w-32 rounded" />
        <div className="shimmer h-3 w-20 rounded" />
      </div>
    </div>
  )
}

// ── SkeletonTable ─────────────────────────────────────────────────────────────

interface SkeletonTableProps {
  rows?: number
  cols?: number
}

export function SkeletonTable({ rows = 5, cols = 4 }: SkeletonTableProps) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-gray-200">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="shimmer h-4 flex-1 rounded" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 px-4 py-3 border-b border-gray-100"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className={`shimmer h-4 rounded ${colIdx === 0 ? 'flex-[2]' : 'flex-1'}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── SkeletonChart ─────────────────────────────────────────────────────────────

interface SkeletonChartProps {
  height?: number
}

export function SkeletonChart({ height = 300 }: SkeletonChartProps) {
  return (
    <div
      className="shimmer w-full rounded-lg"
      style={{ height }}
      aria-hidden="true"
    />
  )
}

export default SkeletonKPI
