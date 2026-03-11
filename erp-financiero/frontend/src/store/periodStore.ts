import { create } from 'zustand'

/**
 * Store liviano para el período seleccionado en el Header.
 * Se separa de authStore para que pueda cambiar sin afectar la sesión.
 */
interface PeriodStore {
  month: number
  year: number
  setMonth: (m: number) => void
  setYear: (y: number) => void
  periodId: () => string  // helper → "2025-02"
}

export const usePeriodStore = create<PeriodStore>()((set, get) => ({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  setMonth: (month) => set({ month }),
  setYear: (year) => set({ year }),
  periodId: () => {
    const { year, month } = get()
    return `${year}-${String(month).padStart(2, '0')}`
  },
}))
