import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'

export interface Period {
  id: string
  name: string
  start_date: string
  end_date: string
  fiscal_year: number
  is_closed: boolean
  created_at?: string
}

export interface PeriodFilters {
  fiscal_year?: number
  is_closed?: boolean
  page?: number
  size?: number
}

export interface CreatePeriodPayload {
  name: string
  start_date: string
  end_date: string
  fiscal_year: number
  is_closed?: boolean
}

/** GET /periods */
export function usePeriods(filters: PeriodFilters = {}) {
  return useQuery<{ success: boolean; data: Period[]; meta: { count: number } }>({
    queryKey: ['periods', filters],
    queryFn: () => api.get('/periods', { params: filters }).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

/** GET /periods/:id */
export function usePeriod(id: string) {
  return useQuery<{ success: boolean; data: Period }>({
    queryKey: ['periods', id],
    queryFn: () => api.get(`/periods/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

/** POST /periods */
export function useCreatePeriod() {
  const qc = useQueryClient()
  return useMutation<{ success: boolean; data: Period }, Error, CreatePeriodPayload>({
    mutationFn: (payload) => api.post('/periods', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periods'] }),
  })
}

/** PUT /periods/:id */
export function useUpdatePeriod() {
  const qc = useQueryClient()
  return useMutation<
    { success: boolean; data: Period },
    Error,
    { id: string; payload: Partial<CreatePeriodPayload> }
  >({
    mutationFn: ({ id, payload }) => api.put(`/periods/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periods'] }),
  })
}

/** PATCH /periods/:id/close */
export function useClosePeriod() {
  const qc = useQueryClient()
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => api.patch(`/periods/${id}/close`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periods'] }),
  })
}

/** DELETE /periods/:id */
export function useDeletePeriod() {
  const qc = useQueryClient()
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => api.delete(`/periods/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periods'] }),
  })
}
