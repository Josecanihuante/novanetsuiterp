import React from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useAuthStore } from '@/store/authStore'

// ── Páginas ───────────────────────────────────────────────────────────────────
import Login               from '@/pages/Login'
import Dashboard           from '@/pages/Dashboard'
import BSC                 from '@/pages/BSC'
import FinancialStatements from '@/pages/FinancialStatements'
import Journal             from '@/pages/Journal'
import Invoices            from '@/pages/Invoices'
import Customers           from '@/pages/Customers'
import Inventory           from '@/pages/Inventory'
import Import              from '@/pages/Import'
import PPM                 from '@/pages/PPM'
import NuevaFacturaPage    from '@/pages/commerce/NuevaFacturaPage'
import SIIConfigPage       from '@/pages/sii/SIIConfigPage'

// ── Guard de rutas privadas ───────────────────────────────────────────────────
function PrivateLayout() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// ── Router principal ──────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"     element={<Dashboard />} />
          <Route path="bsc/*"         element={<BSC />} />
          <Route path="financiero/*"  element={<FinancialStatements />} />
          <Route path="contabilidad"  element={<Journal />} />
          <Route path="facturas"      element={<Invoices />} />
          <Route path="commerce/invoices/nueva" element={<NuevaFacturaPage />} />
          <Route path="clientes"      element={<Customers />} />
          <Route path="inventario"    element={<Inventory />} />
          <Route path="importar"      element={<Import />} />
          <Route path="ppm"           element={<PPM />} />
          <Route path="configuracion" element={<Dashboard />} />
          <Route path="sii/configuracion" element={<SIIConfigPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

