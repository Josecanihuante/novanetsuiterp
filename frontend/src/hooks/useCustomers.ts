import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface Customer {
  id: string
  tax_id: string
  name: string
  email?: string
  phone?: string
  address?: string
  payment_terms_days: number
  credit_limit: number
  pending_balance?: number
  is_active: boolean
  [key: string]: unknown
}

export interface CustomerFilters {
  search?: string
  is_active?: boolean
  page?: number
  page_size?: number
}

export interface CreateCustomerPayload {
  tax_id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  payment_terms_days?: number
  credit_limit?: number
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** GET /customers */
export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery<{ success: boolean; data: Customer[]; total: number }>({
    queryKey: ['customers', filters],
    queryFn: () =>
      api.get('/customers', { params: filters }).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

/** GET /customers/:id */
export function useCustomer(id: string) {
  return useQuery<{ success: boolean; data: Customer }>({
    queryKey: ['customers', id],
    queryFn: () => api.get(`/customers/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

/** POST /customers */
export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation<{ success: boolean; data: Customer }, Error, CreateCustomerPayload>({
    mutationFn: (payload) =>
      api.post('/customers', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

/** PUT /customers/:id */
export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation<
    { success: boolean; data: Customer },
    Error,
    { id: string; payload: Partial<CreateCustomerPayload> }
  >({
    mutationFn: ({ id, payload }) =>
      api.put(`/customers/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

/** DELETE /customers/:id (soft delete) */
export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) =>
      api.delete(`/customers/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}
