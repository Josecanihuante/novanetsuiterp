import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/services/api'

/**
 * Interfaces tipadas para PPM
 */
export interface PPMConfigPayload {
  regime: 'general' | 'pro_pyme' | 'presunta'
  rut_empresa?: string
  tasa_override?: number
}

export interface PPMCalculationResponse {
  success: boolean
  data: {
    month: number
    year: number
    regime: string
    base_imponible: number
    tasa: number
    ppm_bruto: number
    is_suspended: boolean
    suspension_reason?: string
    art84_applied: boolean
    calculation_steps: Array<{ step: string; value: number | string }>
  }
}

export interface PPMHistoryEntry {
  mes: number
  year: number
  ingresos: number
  tasa: number
  ppm: number
  status: 'pagado' | 'pendiente'
  acumulado: number
}

/**
 * Hook: Calcular PPM (POST)
 * POST /taxes/ppm/calculate
 */
export function usePPMCalculation() {
  return useMutation<
    PPMCalculationResponse,
    Error,
    { month: number; year: number; config?: PPMConfigPayload }
  >({
    mutationFn: ({ month, year, config }) =>
      api
        .post('/taxes/ppm/calculate', { month, year, ...config })
        .then((r) => r.data),
  })
}

/**
 * Hook: Configuración PPM actual
 * GET /taxes/ppm/config
 */
export function usePPMConfig() {
  return useQuery<{ success: boolean; data: PPMConfigPayload }>({
    queryKey: ['ppm', 'config'],
    queryFn: () => api.get('/taxes/ppm/config').then((r) => r.data),
    staleTime: 1000 * 60 * 30,
  })
}

/**
 * Hook: Historial PPM del año
 * GET /taxes/ppm/history?year=
 */
export function usePPMHistory(year: number) {
  return useQuery<{ success: boolean; data: PPMHistoryEntry[] }>({
    queryKey: ['ppm', 'history', year],
    queryFn: () =>
      api.get('/taxes/ppm/history', { params: { year } }).then((r) => r.data),
    enabled: !!year,
    staleTime: 1000 * 60 * 5,
  })
}
