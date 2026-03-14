import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

/**
 * Tipos de estado financiero disponibles en el backend.
 */
export type FinancialStatementType =
  | 'income-statement'
  | 'balance-sheet'
  | 'cash-flow'
  | 'source-use'

export interface FinancialRow {
  name: string
  value: number
  indent?: number
  isBold?: boolean
  isSubtotal?: boolean
  verticalPct?: number | null
  deltaAbs?: number | null
  deltaPct?: number | null
}

export interface FinancialStatementResponse {
  success: boolean
  data: {
    type: string
    period_id: string
    compare_period_id?: string
    rows: FinancialRow[]
    balanced?: boolean
  }
}

/**
 * Hook: Estado Financiero
 * GET /financial/{type}?period_id=&compare_period_id=
 */
export function useFinancialStatement(
  type: FinancialStatementType,
  periodId: string,
  comparePeriodId?: string,
) {
  return useQuery<FinancialStatementResponse>({
    queryKey: ['financial', type, periodId, comparePeriodId ?? null],
    queryFn: () =>
      api
        .get(`/financial/${type}`, {
          params: {
            period_id: periodId,
            ...(comparePeriodId ? { compare_period_id: comparePeriodId } : {}),
          },
        })
        .then((r) => r.data),
    enabled: !!periodId && !!type,
    staleTime: 1000 * 60 * 5,
  })
}
