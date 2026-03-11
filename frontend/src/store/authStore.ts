import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'contador' | 'viewer'
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  selectedMonth: number
  selectedYear: number
  companyName: string
  setAuth: (token: string, refreshToken: string, user: User) => void
  logout: () => void
  setMonth: (month: number) => void
  setYear: (year: number) => void
  setCompanyName: (name: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      selectedMonth: new Date().getMonth() + 1,
      selectedYear:  new Date().getFullYear(),
      companyName: 'ERP Financiero',

      setAuth: (token, refreshToken, user) =>
        set({ token, refreshToken, user }),

      logout: () =>
        set({ token: null, refreshToken: null, user: null }),

      setMonth: (month) => set({ selectedMonth: month }),
      setYear:  (year)  => set({ selectedYear: year }),
      setCompanyName: (name) => set({ companyName: name }),
    }),
    {
      name: 'erp-auth-store',
      partialize: (state) => ({
        token:         state.token,
        refreshToken:  state.refreshToken,
        user:          state.user,
        companyName:   state.companyName,
        selectedMonth: state.selectedMonth,
        selectedYear:  state.selectedYear,
      }),
    },
  ),
)
