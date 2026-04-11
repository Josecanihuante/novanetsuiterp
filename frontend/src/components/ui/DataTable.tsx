import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Download } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from './Badge'
import { SkeletonTable } from './Skeleton'

type ColumnType = 'text' | 'number' | 'currency' | 'percent' | 'date' | 'badge' | 'custom'

export interface Column<T> {
  key: keyof T
  header: string
  type: ColumnType
  sortable?: boolean
  badgeMap?: (value: unknown) => 'success' | 'danger' | 'warning' | 'neutral'
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  onRowClick?: (row: T) => void
  pageSize?: number
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

function formatCell(value: unknown, type: ColumnType): string {
  if (value === null || value === undefined) return '—'
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('es-CL', {
        style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
      }).format(Number(value))
    case 'percent':
      return `${Number(value).toFixed(1)}%`
    case 'number':
      return new Intl.NumberFormat('es-CL').format(Number(value))
    case 'date':
      return format(new Date(String(value)), 'dd/MM/yyyy', { locale: es })
    default:
      return String(value)
  }
}

function exportCSV<T extends Record<string, unknown>>(columns: Column<T>[], data: T[]) {
  const header = columns.map((c) => c.header).join(',')
  const rows = data.map((row) =>
    columns.map((c) => {
      const v = row[c.key]
      return typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v ?? '')
    }).join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'export.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  onRowClick,
  pageSize: initialPageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch]       = useState('')
  const [sortKey, setSortKey]     = useState<keyof T | null>(null)
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc')
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState(initialPageSize)

  // Filtrado global
  const filtered = useMemo(() => {
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter((row) =>
      columns.some((col) => {
        const v = row[col.key]
        return v !== null && v !== undefined && String(v).toLowerCase().includes(q)
      })
    )
  }, [data, search, columns])

  // Ordenamiento
  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'es', { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  // Paginación
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated  = sorted.slice((page - 1) * pageSize, page * pageSize)

  const toggleSort = (col: Column<T>) => {
    if (!col.sortable) return
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const SortIcon = ({ col }: { col: Column<T> }) => {
    if (!col.sortable) return null
    if (sortKey !== col.key) return <ChevronsUpDown size={12} className="text-gray-400" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-secondary" />
      : <ChevronDown size={12} className="text-secondary" />
  }

  if (isLoading) return <div aria-busy="true"><SkeletonTable rows={5} cols={columns.length} /></div>

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="datatable-search"
            type="search"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
        </div>
        <button
          title="Exportar CSV"
          onClick={() => exportCSV(columns, sorted)}
          className="flex items-center gap-1.5 h-9 px-3 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Download size={13} /> CSV
        </button>
      </div>

      {/* Tabla */}
      <div className="border border-gray-200 rounded-lg overflow-hidden" aria-busy="false">
        <table role="grid" className="w-full text-sm" aria-label="Tabla de datos">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr role="row">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => toggleSort(col)}
                  aria-sort={col.sortable ? (sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
                  className={[
                    'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide select-none',
                    col.sortable ? 'cursor-pointer hover:bg-gray-100' : '',
                  ].join(' ')}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr role="row">
                <td role="gridcell" colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-500">
                  Sin resultados
                </td>
              </tr>
            ) : (
              paginated.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  role="row"
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && onRowClick) onRowClick(row) }}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={[
                    'transition-colors',
                    onRowClick ? 'cursor-pointer hover:bg-blue-50/50 focus-visible:ring-2 focus-visible:ring-secondary/40 outline-none' : 'hover:bg-gray-50/50',
                  ].join(' ')}
                >
                  {columns.map((col) => {
                    const val = row[col.key]
                    return (
                      <td role="gridcell" key={String(col.key)} className="px-4 py-3 text-gray-700">
                        {col.type === 'custom' && col.render ? (
                          col.render(row)
                        ) : col.type === 'badge' && col.badgeMap ? (
                          <Badge variant={col.badgeMap(val)}>
                            {String(val ?? '')}
                          </Badge>
                        ) : (
                          <span className={col.type === 'currency' || col.type === 'number' || col.type === 'percent' ? 'text-currency' : ''}>
                            {formatCell(val, col.type)}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <label htmlFor="datatable-pagesize" className="text-xs text-gray-500">Filas por página:</label>
          <select
            id="datatable-pagesize"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-secondary/40"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span>{sorted.length} registro(s)</span>
          <span>|</span>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Página anterior"
            className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            ‹
          </button>
          <span>{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Página siguiente"
            className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}

export default DataTable
