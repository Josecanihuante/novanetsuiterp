import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface Invoice {
  id: string
  invoice_number: string
  type: 'sale' | 'purchase' | 'credit_note' | 'debit_note'
  issue_date: string
  due_date: string
  customer_id?: string
  vendor_id?: string
  party_name?: string
  subtotal: number
  tax_amount: number
  total: number
  status: 'draft' | 'issued' | 'paid' | 'cancelled'
  [key: string]: unknown
}

export interface InvoiceFilters {
  type?: string
  status?: string
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}

export interface InvoiceItemPayload {
  product_id?: string
  description: string
  quantity: number
  unit_price: number
  discount_pct?: number
}

export interface CreateInvoicePayload {
  type: string
  issue_date: string
  due_date?: string
  customer_id?: string
  vendor_id?: string
  items: InvoiceItemPayload[]
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** GET /invoices */
export function useInvoices(filters: InvoiceFilters = {}) {
  return useQuery<{ success: boolean; data: Invoice[]; total: number }>({
    queryKey: ['invoices', filters],
    queryFn: () =>
      api.get('/invoices', { params: filters }).then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  })
}

/** GET /invoices/:id */
export function useInvoice(id: string) {
  return useQuery<{ success: boolean; data: Invoice }>({
    queryKey: ['invoices', id],
    queryFn: () => api.get(`/invoices/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

/** POST /invoices */
export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation<{ success: boolean; data: Invoice }, Error, CreateInvoicePayload>({
    mutationFn: (payload) =>
      api.post('/invoices', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

/** PATCH /invoices/:id/issue — emitir factura */
export function useIssueInvoice() {
  const qc = useQueryClient()
  return useMutation<{ success: boolean; data: Invoice }, Error, string>({
    mutationFn: (id) =>
      api.patch(`/invoices/${id}/issue`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
