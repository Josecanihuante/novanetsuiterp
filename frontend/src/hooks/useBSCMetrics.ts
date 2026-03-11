import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

/**
 * Hook: BSC Metrics
 * GET /bsc/metrics?period_id=YYYY-MM
 */
export interface BSCMetric {
  name: string
  perspective: string
  value: number | null
  unit: 'CLP' | '%' | 'x' | 'días'
  variation?: number
  status: 'ok' | 'warning' | 'critical' | 'neutral'
  formula?: string
  interpretation?: string
}

export interface BSCMetricsResponse {
  success: boolean
  data: {
    period_id: string
    metrics: BSCMetric[]
  }
}

export function useBSCMetrics(periodId: string) {
  return useQuery<BSCMetricsResponse>({
    queryKey: ['bsc', 'metrics', periodId],
    queryFn: () =>
      api.get('/bsc/metrics', { params: { period_id: periodId } }).then((r) => r.data),
    enabled: !!periodId,
    staleTime: 1000 * 60 * 5, // 5 min
  })
}

/**
 * Hook: BSC Snapshot (todos los períodos disponibles)
 * GET /bsc/snapshot
 */
export function useBSCSnapshot() {
  return useQuery({
    queryKey: ['bsc', 'snapshot'],
    queryFn: () => api.get('/bsc/snapshot').then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  })
}
