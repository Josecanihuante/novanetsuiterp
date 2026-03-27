import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'

export interface Account {
  id: string
  code: string
  name: string
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  parent_id?: string
  description?: string
  is_active: boolean
}

export interface AccountFilters {
  account_type?: string
  page?: number
  size?: number
}

export interface CreateAccountPayload {
  code: string
  name: string
  account_type: string
  parent_id?: string
  description?: string
}

/** GET /accounts */
export function useAccounts(filters: AccountFilters = {}) {
  return useQuery<{ success: boolean; data: Account[] }>({
    queryKey: ['accounts', filters],
    queryFn: () => api.get('/accounts', { params: filters }).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

/** GET /accounts/tree */
export function useAccountsTree() {
  return useQuery<{ success: boolean; data: Account[] }>({
    queryKey: ['accounts', 'tree'],
    queryFn: () => api.get('/accounts/tree').then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  })
}

/** GET /accounts/:id */
export function useAccount(id: string) {
  return useQuery<{ success: boolean; data: Account }>({
    queryKey: ['accounts', id],
    queryFn: () => api.get(`/accounts/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

/** POST /accounts */
export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation<{ success: boolean; data: Account }, Error, CreateAccountPayload>({
    mutationFn: (payload) => api.post('/accounts', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

/** PUT /accounts/:id */
export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation<
    { success: boolean; data: Account },
    Error,
    { id: string; payload: Partial<CreateAccountPayload> }
  >({
    mutationFn: ({ id, payload }) => api.put(`/accounts/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

/** DELETE /accounts/:id */
export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => api.delete(`/accounts/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })
}
