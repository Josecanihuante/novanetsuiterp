/**
 * Utilidades de formato para valores financieros chilenos.
 * Nunca lanza excepciones — siempre devuelve '—' para null/undefined.
 */

// ── Formato CLP ──────────────────────────────────────────────────────────────
export function formatCLP(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  const negative = value < 0
  const abs = Math.abs(Math.round(value))
  // es-CL usa punto como sep. de miles y coma como decimal → solo necesitamos el entero
  const formatted = abs.toLocaleString('es-CL')
  return negative ? `-$ ${formatted}` : `$ ${formatted}`
}

// ── Porcentaje ───────────────────────────────────────────────────────────────
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(decimals)}%`
}

// ── Ratio / veces ────────────────────────────────────────────────────────────
export function formatRatio(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(2)}x`
}

// ── Días ─────────────────────────────────────────────────────────────────────
export function formatDays(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${Math.round(value)} días`
}

// ── Formato genérico por unidad (para KPICard) ───────────────────────────────
export type KPIUnit = 'CLP' | '%' | 'x' | 'días'

export function formatKPI(value: number | null | undefined, unit: KPIUnit): string {
  if (value === null || value === undefined) return '—'
  switch (unit) {
    case 'CLP':  return formatCLP(value)
    case '%':    return formatPercent(value)
    case 'x':    return formatRatio(value)
    case 'días': return formatDays(value)
    default:     return String(value)
  }
}

// ── Color de variación ───────────────────────────────────────────────────────
export function getVariationColor(
  variation: number | null | undefined,
): 'success' | 'danger' | 'neutral' {
  if (variation === null || variation === undefined || variation === 0) return 'neutral'
  return variation > 0 ? 'success' : 'danger'
}

// ── Estado semafórico de KPI ─────────────────────────────────────────────────
export function getKPIStatus(
  value: number,
  okMin: number,
  okMax: number,
): 'ok' | 'warning' | 'critical' {
  if (value >= okMin && value <= okMax) return 'ok'
  // Zona amarilla: ±20% del rango ok
  if (value >= okMin * 0.8 && value <= okMax * 1.2) return 'warning'
  return 'critical'
}

// ── Fecha YYYY-MM-DD → DD/MM/YYYY ────────────────────────────────────────────
export function formatDateCL(isoDate: string | null | undefined): string {
  if (!isoDate) return '—'
  const parts = isoDate.split('-')
  if (parts.length < 3) return isoDate
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

// ── Período "2025-02" → "Febrero 2025" ─────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export function formatPeriodLabel(periodId: string): string {
  const [y, m] = periodId.split('-')
  const mesIdx = parseInt(m, 10) - 1
  return `${MESES[mesIdx] ?? m} ${y}`
}
