import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  category?: string
  unit_cost: number
  sale_price: number
  stock_quantity: number
  min_stock: number
  valuation_method: 'fifo' | 'lifo' | 'promedio'
  is_active: boolean
  [key: string]: unknown
}

export interface StockMovement {
  id: string
  product_id: string
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: number
  unit_cost?: number
  reference?: string
  movement_date: string
  notes?: string
}

export interface ProductFilters {
  search?: string
  category?: string
  low_stock?: boolean
  page?: number
  page_size?: number
}

export interface CreateProductPayload {
  sku: string
  name: string
  description?: string
  category?: string
  unit_cost: number
  sale_price: number
  min_stock?: number
  valuation_method?: 'fifo' | 'lifo' | 'promedio'
}

export interface StockMovementPayload {
  product_id: string
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: number
  unit_cost?: number
  reference?: string
  notes?: string
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** GET /inventory/products */
export function useProducts(filters: ProductFilters = {}) {
  return useQuery<{ success: boolean; data: Product[]; total: number }>({
    queryKey: ['products', filters],
    queryFn: () =>
      api.get('/inventory/products', { params: filters }).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

/** GET /inventory/products/:id */
export function useProduct(id: string) {
  return useQuery<{ success: boolean; data: Product }>({
    queryKey: ['products', id],
    queryFn: () => api.get(`/inventory/products/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

/** POST /inventory/products */
export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation<{ success: boolean; data: Product }, Error, CreateProductPayload>({
    mutationFn: (payload) =>
      api.post('/inventory/products', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/** PUT /inventory/products/:id */
export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation<
    { success: boolean; data: Product },
    Error,
    { id: string; payload: Partial<CreateProductPayload> }
  >({
    mutationFn: ({ id, payload }) =>
      api.put(`/inventory/products/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/** GET /inventory/stock/movements */
export function useStockMovements(productId?: string) {
  return useQuery<{ success: boolean; data: StockMovement[] }>({
    queryKey: ['stock-movements', productId],
    queryFn: () =>
      api
        .get('/inventory/stock/movements', {
          params: productId ? { product_id: productId } : {},
        })
        .then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  })
}

/** POST /inventory/stock/movements */
export function useCreateStockMovement() {
  const qc = useQueryClient()
  return useMutation<{ success: boolean; data: StockMovement }, Error, StockMovementPayload>({
    mutationFn: (payload) =>
      api.post('/inventory/stock/movements', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['stock-movements'] })
    },
  })
}
