import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'

export interface Vendor {
  id: string
  tax_id: string
  name: string
  trade_name?: string
  email?: string
  phone?: string
  address?: string
  payment_terms_days: number
  is_active: boolean
}

export interface VendorFilters {
  search?: string
  page?: number
  size?: number
}

export interface CreateVendorPayload {
  tax_id: string
  name: string
  trade_name?: string
  email?: string
  phone?: string
  address?: string
  payment_terms_days?: number
}

/** GET /vendors */
export function useVendors(filters: VendorFilters = {}) {
  return useQuery<{ success: boolean; data: Vendor[]; meta: { count: number } }>({
    queryKey: ['vendors', filters],
    queryFn: () => api.get('/vendors', { params: filters }).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

/** GET /vendors/:id */
export function useVendor(id: string) {
  return useQuery<{ success: boolean; data: Vendor }>({
    queryKey: ['vendors', id],
    queryFn: () => api.get(`/vendors/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

/** POST /vendors */
export function useCreateVendor() {
  const qc = useQueryClient()
  return useMutation<{ success: boolean; data: Vendor }, Error, CreateVendorPayload>({
    mutationFn: (payload) => api.post('/vendors', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendors'] }),
  })
}

/** PUT /vendors/:id */
export function useUpdateVendor() {
  const qc = useQueryClient()
  return useMutation<
    { success: boolean; data: Vendor },
    Error,
    { id: string; payload: Partial<CreateVendorPayload> }
  >({
    mutationFn: ({ id, payload }) => api.put(`/vendors/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendors'] }),
  })
}

/** DELETE /vendors/:id (soft delete) */
export function useDeleteVendor() {
  const qc = useQueryClient()
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => api.delete(`/vendors/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendors'] }),
  })
}
