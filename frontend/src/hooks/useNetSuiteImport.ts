import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface NetSuitePreviewRow {
  row_number: number
  account_code: string
  account_name: string
  type: string
  date: string
  document_number: string
  memo: string
  debit: number
  credit: number
  valid: boolean
  errors: string[]
  [key: string]: unknown
}

export interface NetSuitePreviewResponse {
  success: boolean
  data: {
    total_rows: number
    valid_rows: number
    invalid_rows: number
    rows: NetSuitePreviewRow[]
    column_errors: string[]
  }
}

export interface NetSuiteConfirmResponse {
  success: boolean
  data: {
    entries_created: number
    rows_skipped: number
    errors: string[]
  }
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Hook: Preview de importación NetSuite
 * POST /import/netsuite/preview (multipart/form-data)
 */
export function useNetSuitePreview() {
  return useMutation<NetSuitePreviewResponse, Error, File>({
    mutationFn: (file) => {
      const form = new FormData()
      form.append('file', file)
      return api
        .post('/import/netsuite/preview', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    },
  })
}

/**
 * Hook: Confirmar importación NetSuite
 * POST /import/netsuite/confirm (multipart/form-data)
 */
export function useNetSuiteConfirm() {
  return useMutation<NetSuiteConfirmResponse, Error, File>({
    mutationFn: (file) => {
      const form = new FormData()
      form.append('file', file)
      return api
        .post('/import/netsuite/confirm', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    },
  })
}
