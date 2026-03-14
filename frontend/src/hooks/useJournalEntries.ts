import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface JournalEntry {
  id: string
  entry_number: string
  entry_date: string
  description: string
  source: string
  status: 'draft' | 'posted'
  debit_total: number
  credit_total: number
  [key: string]: unknown
}

export interface JournalLine {
  account_id: string
  debit: number
  credit: number
  description?: string
}

export interface CreateJournalEntryPayload {
  entry_date: string
  description: string
  lines: JournalLine[]
}

export interface JournalFilters {
  period_id?: string
  status?: string
  source?: string
  page?: number
  page_size?: number
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** GET /journal/entries */
export function useJournalEntries(filters: JournalFilters = {}) {
  return useQuery<{ success: boolean; data: JournalEntry[]; total: number }>({
    queryKey: ['journal', 'entries', filters],
    queryFn: () =>
      api.get('/journal/entries', { params: filters }).then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  })
}

/** POST /journal/entries — crear borrador */
export function useCreateJournalEntry() {
  const qc = useQueryClient()
  return useMutation<{ success: boolean; data: JournalEntry }, Error, CreateJournalEntryPayload>({
    mutationFn: (payload) =>
      api.post('/journal/entries', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal', 'entries'] })
    },
  })
}

/** PATCH /journal/entries/:id/post — contabilizar */
export function usePostJournalEntry() {
  const qc = useQueryClient()
  return useMutation<{ success: boolean; data: JournalEntry }, Error, string>({
    mutationFn: (id) =>
      api.patch(`/journal/entries/${id}/post`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal', 'entries'] })
    },
  })
}
