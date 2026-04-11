import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  BookOpen,
  Receipt,
  Users,
  Package,
  Upload,
  Calculator,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ReactNode
  href?: string
  children?: { label: string; href: string }[]
}

const NAV: NavItem[] = [
  { label: 'Dashboard',            icon: <LayoutDashboard size={18} />, href: '/dashboard' },
  {
    label: 'Balanced Scorecard',
    icon: <BarChart3 size={18} />,
    children: [
      { label: 'Perspectiva Rentabilidad', href: '/bsc/rentabilidad' },
      { label: 'Perspectiva Liquidez',     href: '/bsc/liquidez' },
      { label: 'Perspectiva Endeudamiento', href: '/bsc/endeudamiento' },
      { label: 'Perspectiva Eficiencia',   href: '/bsc/eficiencia' },
      { label: 'Ciclo de Efectivo',        href: '/bsc/ciclo-efectivo' },
      { label: 'Estratégico',              href: '/bsc/estrategico' },
    ],
  },
  {
    label: 'Estados Financieros',
    icon: <FileText size={18} />,
    children: [
      { label: 'Estado de Resultados', href: '/financiero/estado-resultados' },
      { label: 'Balance General',      href: '/financiero/balance-general' },
      { label: 'Flujos de Efectivo',   href: '/financiero/efe' },
      { label: 'Orig. y Aplic. Fondos', href: '/financiero/eoaf' },
    ],
  },
  { label: 'Contabilidad',         icon: <BookOpen size={18} />,   href: '/contabilidad' },
  { label: 'Facturación',          icon: <Receipt size={18} />,    href: '/facturas' },
  { label: 'Clientes',             icon: <Users size={18} />,      href: '/clientes' },
  { label: 'Inventario',           icon: <Package size={18} />,    href: '/inventario' },
  { label: 'Importar NetSuite',    icon: <Upload size={18} />,     href: '/importar' },
  { label: 'PPM Chile',            icon: <Calculator size={18} />, href: '/ppm' },
  { label: 'Configuración',        icon: <Settings size={18} />,   href: '/configuracion' },
]

const BASE = 'flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors'
const ACTIVE_CLASS = 'bg-white/20 text-white font-semibold'
const IDLE_CLASS   = 'text-white/70 hover:bg-white/10 hover:text-white'

function NavGroup({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const handleGroupClick = () => {
    if (!open && item.children && item.children.length > 0) {
      navigate(item.children[0].href)
    }
    setOpen((o) => !o)
  }

  return (
    <li>
      <button
        onClick={handleGroupClick}
        className={`${BASE} w-full text-left ${IDLE_CLASS}`}
      >
        {item.icon}
        <span className="flex-1">{item.label}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <ul className="mt-0.5 ml-7 border-l border-white/10 pl-3 space-y-0.5">
          {item.children!.map((child) => (
            <li key={child.href}>
              <NavLink
                to={child.href}
                className={({ isActive }) =>
                  `${BASE} text-xs ${isActive ? ACTIVE_CLASS : IDLE_CLASS}`
                }
              >
                {child.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export function Sidebar() {
  return (
    <aside
      className="flex flex-col bg-primary text-white shrink-0"
      style={{ width: 260 }}
      aria-label="Navegación principal"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center text-white font-bold text-xs">
          ERP
        </div>
        <span className="font-semibold text-sm tracking-wide">ERP Financiero</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {NAV.map((item) =>
            item.children ? (
              <NavGroup key={item.label} item={item} />
            ) : (
              <li key={item.label}>
                <NavLink
                  to={item.href!}
                  className={({ isActive }) =>
                    `${BASE} ${isActive ? ACTIVE_CLASS : IDLE_CLASS}`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ),
          )}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
