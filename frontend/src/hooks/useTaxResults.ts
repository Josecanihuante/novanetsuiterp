import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

export interface TaxResult {
  id: string
  period_id: string
  total_sales: number
  total_purchases: number
  iva_collected: number
  iva_paid: number
  iva_balance: number
  ppm_paid: number
  calculated_at: string
  is_filed: boolean
  created_at?: string
}

export interface TaxResultFilters {
  page?: number
  size?: number
  period_id?: string
}

/** GET /tax-results */
export function useTaxResults(filters: TaxResultFilters = {}) {
  return useQuery<{ success: boolean; data: TaxResult[] }>({
    queryKey: ['tax-results', filters],
    queryFn: () => api.get('/taxes/results', { params: filters }).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

/** GET /tax-results/:id */
export function useTaxResult(id: string) {
  return useQuery<{ success: boolean; data: TaxResult }>({
    queryKey: ['tax-results', id],
    queryFn: () => api.get(`/taxes/results/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}
