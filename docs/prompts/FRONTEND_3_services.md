# FRONTEND — Parte 3 de 3: Servicios, Hooks, Store y Accesibilidad

Proyecto: ERP Financiero. Los componentes y páginas ya están creados. Completa ahora la capa de datos.

## src/services/api.ts

```typescript
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Adjuntar JWT en cada request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Manejar 401 → logout y redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

## src/store/authStore.ts

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User { id: string; email: string; name: string; role: string }
interface AuthStore {
  token: string | null
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'erp-auth' }
  )
)
```

## src/store/periodStore.ts

```typescript
import { create } from 'zustand'

interface PeriodStore {
  month: number
  year: number
  setMonth: (m: number) => void
  setYear: (y: number) => void
}

export const usePeriodStore = create<PeriodStore>((set) => ({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  setMonth: (month) => set({ month }),
  setYear: (year) => set({ year }),
}))
```

## src/hooks/

```typescript
// useBSCMetrics.ts
export function useBSCMetrics(periodId: string) {
  return useQuery({
    queryKey: ['bsc', 'metrics', periodId],
    queryFn: () => api.get(`/bsc/metrics?period_id=${periodId}`).then(r => r.data),
    enabled: !!periodId,
  })
}

// useFinancialStatement.ts
export function useFinancialStatement(type: string, periodId: string, comparePeriodId?: string) {
  return useQuery({
    queryKey: ['financial', type, periodId, comparePeriodId],
    queryFn: () => api.get(`/financial/${type}`, {
      params: { period_id: periodId, compare_period_id: comparePeriodId }
    }).then(r => r.data),
    enabled: !!periodId,
  })
}

// usePPMCalculation.ts
export function usePPMCalculation(month: number, year: number) {
  return useMutation({
    mutationFn: () => api.post('/taxes/ppm/calculate', { month, year }).then(r => r.data),
  })
}

// useJournalEntries.ts
export function useJournalEntries(filters: Record<string, any>) {
  return useQuery({
    queryKey: ['journal', 'entries', filters],
    queryFn: () => api.get('/journal/entries', { params: filters }).then(r => r.data),
  })
}

// useInvoices.ts, useCustomers.ts, useProducts.ts — patrón idéntico
```

## src/utils/formatters.ts

```typescript
export function formatCLP(value: number | null): string {
  if (value === null || value === undefined) return '—'
  const negative = value < 0
  const abs = Math.abs(Math.round(value))
  const formatted = abs.toLocaleString('es-CL').replace(/,/g, '.')
  return negative ? `-$ ${formatted}` : `$ ${formatted}`
}

export function formatPercent(value: number | null, decimals = 2): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(decimals)}%`
}

export function formatRatio(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(2)}x`
}

export function formatDays(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return `${Math.round(value)} días`
}

export function getVariationColor(variation: number | null): 'success' | 'danger' | 'neutral' {
  if (variation === null || variation === 0) return 'neutral'
  return variation > 0 ? 'success' : 'danger'
}

export function getKPIStatus(value: number, okMin: number, okMax: number): 'ok' | 'warning' | 'critical' {
  if (value >= okMin && value <= okMax) return 'ok'
  if (value >= okMin * 0.8 && value <= okMax * 1.2) return 'warning'
  return 'critical'
}
```

## Accesibilidad — verificación final

Revisa todos los componentes y asegura:

1. **Labels**: cada `<input>`, `<select>`, `<textarea>` tiene un `<label htmlFor>` o `aria-label` correspondiente.

2. **Errores**: campos con error usan `aria-describedby="campo-error"` y el mensaje de error tiene `id="campo-error"`.

3. **Focus visible**: nunca `outline: none` sin reemplazo. Usa `focus-visible:ring-2 focus-visible:ring-primary` de Tailwind.

4. **Tamaño táctil**: todos los botones tienen `min-h-[44px] min-w-[44px]`.

5. **Contraste**: texto sobre fondo primario (#1E3A5F) en blanco (#FFFFFF) — ratio 9.5:1 ✓. Texto gris (#6B7280) sobre blanco — ratio 4.6:1 ✓.

6. **aria-live**: el indicador de balance en Journal y el resultado de PPM usan `aria-live="polite"` para anunciar cambios a screen readers.

7. **Roles en DataTable**: `role="grid"`, `role="row"`, `role="gridcell"`. Sort con `aria-sort="ascending"/"descending"/"none"`.

8. **Modal**: foco atrapado dentro del modal. Cierre con Escape. `role="dialog"` y `aria-modal="true"`.

9. **Imágenes/íconos**: íconos de Lucide que no son decorativos tienen `aria-label`. Los decorativos tienen `aria-hidden="true"`.

10. **Skeleton**: `aria-busy="true"` en el contenedor mientras carga, `aria-busy="false"` cuando termina.
