import React from 'react'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Select } from '@/components/ui/Input'

const MONTHS = [
  { value: 1,  label: 'Enero' },
  { value: 2,  label: 'Febrero' },
  { value: 3,  label: 'Marzo' },
  { value: 4,  label: 'Abril' },
  { value: 5,  label: 'Mayo' },
  { value: 6,  label: 'Junio' },
  { value: 7,  label: 'Julio' },
  { value: 8,  label: 'Agosto' },
  { value: 9,  label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

const YEARS = Array.from({ length: 6 }, (_, i) => {
  const y = new Date().getFullYear() - i
  return { value: y, label: String(y) }
})

export function Header() {
  const { user, logout, companyName, selectedMonth, selectedYear, setMonth, setYear } =
    useAuthStore()

  const roleLabel: Record<string, string> = {
    admin:    'Administrador',
    contador: 'Contador',
    viewer:   'Visualizador',
  }

  return (
    <header
      className="flex items-center justify-between bg-white border-b border-gray-200 shadow-sm px-6 shrink-0"
      style={{ height: 64 }}
    >
      {/* Izquierda — selector de período */}
      <div className="flex items-center gap-3">
        <label htmlFor="header-month" className="text-xs text-gray-500 font-medium">
          Período:
        </label>
        <select
          id="header-month"
          value={selectedMonth}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="h-8 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
          aria-label="Seleccionar mes"
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <input
          id="header-year"
          type="number"
          min={2000}
          max={2099}
          value={selectedYear}
          onChange={(e) => setYear(Number(e.target.value))}
          aria-label="Seleccionar año"
          className="h-8 w-20 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
      </div>

      {/* Centro — nombre empresa */}
      <p className="text-sm font-semibold text-primary tracking-wide">
        {companyName}
      </p>

      {/* Derecha — usuario + logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
            <UserIcon size={14} className="text-secondary" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-xs font-semibold text-gray-800">
              {user?.full_name ?? 'Usuario'}
            </span>
            <span className="text-[10px] text-gray-500">
              {roleLabel[user?.role ?? ''] ?? user?.role}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="p-1.5 rounded-md text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}

export default Header
