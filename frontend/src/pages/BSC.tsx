import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { X, Download } from 'lucide-react'
import { KPICard } from '@/components/ui/KPICard'
import { Card } from '@/components/ui/Card'
import { LineChartWrapper } from '@/components/charts/LineChartWrapper'
import { useAuthStore } from '@/store/authStore'

// ── Datos mock por perspectiva ────────────────────────────────────────────────
type Metrica = {
  name: string
  value: number | null
  unit: 'CLP' | '%' | 'x' | 'días'
  variation?: number
  status: 'ok' | 'warning' | 'critical' | 'neutral'
  formula: string
  interpretacion: string
}

const PERSPECTIVAS: Record<string, Metrica[]> = {
  Rentabilidad: [
    { name: 'Utilidad Bruta',       value: 400_000_000, unit: 'CLP', variation: 5.2,  status: 'ok',      formula: 'Ingresos - CMV',                       interpretacion: 'Rentabilidad primaria antes de gastos operativos.' },
    { name: 'Margen Bruto',         value: 40.0,         unit: '%',   variation: 0.5,  status: 'ok',      formula: 'Utilidad Bruta / Ingresos × 100',       interpretacion: 'Por cada $100 de venta, $40 quedan antes de gastos op.' },
    { name: 'EBITDA',               value: 280_000_000, unit: 'CLP', variation: 4.1,  status: 'ok',      formula: 'EBIT + Depreciación + Amortización',     interpretacion: 'Capacidad operativa de generación de caja.' },
    { name: 'Margen EBITDA',        value: 22.4,         unit: '%',   variation: -0.3, status: 'warning', formula: 'EBITDA / Ingresos × 100',               interpretacion: 'Eficiencia operativa antes de capex e impuestos.' },
    { name: 'EBIT',                 value: 250_000_000, unit: 'CLP', variation: 3.8,  status: 'ok',      formula: 'Utilidad Bruta - Gastos Operativos',     interpretacion: 'Resultado operativo puro.' },
    { name: 'Margen Operativo',     value: 20.0,         unit: '%',   variation: 0.2,  status: 'ok',      formula: 'EBIT / Ingresos × 100',                 interpretacion: 'Por cada $100 de venta, $20 provienen de operaciones.' },
    { name: 'EBT',                  value: 220_000_000, unit: 'CLP', variation: 2.1,  status: 'ok',      formula: 'EBIT - Gastos Financieros',              interpretacion: 'Resultado antes de impuestos.' },
    { name: 'Utilidad Neta',        value: 136_000_000, unit: 'CLP', variation: 1.5,  status: 'ok',      formula: 'EBT - Impuesto Renta',                  interpretacion: 'Ganancia disponible para socios.' },
    { name: 'Margen Neto',          value: 13.6,         unit: '%',   variation: -1.2, status: 'warning', formula: 'Utilidad Neta / Ingresos × 100',        interpretacion: 'Por cada $100 de venta, $13.6 quedan como utilidad.' },
    { name: 'ROI',                  value: 30.0,         unit: '%',   variation: 4.0,  status: 'ok',      formula: '(Ganancia - Inversión) / Inversión × 100', interpretacion: 'Rendimiento sobre la inversión total.' },
    { name: 'ROA',                  value: 6.8,          unit: '%',   variation: 0.3,  status: 'ok',      formula: 'Utilidad Neta / Activos Totales × 100', interpretacion: 'Eficiencia general de activos.' },
    { name: 'ROE',                  value: 17.0,         unit: '%',   variation: -0.5, status: 'warning', formula: 'Utilidad Neta / Patrimonio × 100',      interpretacion: 'Rendimiento para los accionistas.' },
    { name: 'ROIC',                 value: 9.7,          unit: '%',   variation: 0.8,  status: 'ok',      formula: 'NOPAT / Capital Invertido × 100',       interpretacion: 'Eficiencia del capital empleado.' },
    { name: 'Contribución Marginal',value: 600_000_000, unit: 'CLP', variation: 6.0,  status: 'ok',      formula: 'Ingresos - Costos Variables',            interpretacion: 'Aporta a cubrir costos fijos y generar utilidad.' },
  ],
  Liquidez: [
    { name: 'Capital de Trabajo',   value: 200_000_000, unit: 'CLP', variation: 3.1,  status: 'ok',      formula: 'Activo Corriente - Pasivo Corriente',   interpretacion: 'Holgura financiera de corto plazo.' },
    { name: 'Razón Corriente',      value: 1.67,         unit: 'x',   variation: 0.2,  status: 'ok',      formula: 'Activo Corriente / Pasivo Corriente',   interpretacion: 'Por cada $1 de pasivo CP hay $1.67 de activo CP.' },
    { name: 'Prueba Ácida',         value: 1.33,         unit: 'x',   variation: 0.1,  status: 'ok',      formula: '(AC - Inventario) / Pasivo Corriente',  interpretacion: 'Liquidez sin depender de stock.' },
    { name: 'Solvencia CP',         value: 1.20,         unit: 'x',   variation: -0.1, status: 'warning', formula: 'Efectivo / Pasivo Corriente',           interpretacion: 'Capacidad de pago inmediato.' },
    { name: 'FCO',                  value: 180_000_000, unit: 'CLP', variation: 2.5,  status: 'ok',      formula: 'Flujo de Caja Operacional',             interpretacion: 'Generación de caja por operaciones del período.' },
    { name: 'Free Cash Flow',       value: 130_000_000, unit: 'CLP', variation: -3.0, status: 'warning', formula: 'FCO - CAPEX',                           interpretacion: 'Caja disponible tras inversión en activos.' },
  ],
  Endeudamiento: [
    { name: 'Estructura Financiamiento', value: 60.0,   unit: '%',   variation: 1.2,  status: 'warning', formula: 'Pasivo Total / (Pasivo + Patrimonio) × 100', interpretacion: 'Porcentaje financiado con deuda.' },
    { name: 'Deuda/Patrimonio',     value: 1.50,         unit: 'x',   variation: 0.3,  status: 'warning', formula: 'Deuda Total / Patrimonio',              interpretacion: 'Por cada $1 de patrimonio hay $1.50 de deuda.' },
    { name: 'Deuda/Activos',        value: 0.45,         unit: 'x',   variation: 0.2,  status: 'ok',      formula: 'Deuda Total / Activos Totales',         interpretacion: 'Proporción de activos financiados con deuda.' },
    { name: 'Deuda/EBITDA',         value: 3.21,         unit: 'x',   variation: 0.4,  status: 'warning', formula: 'Deuda Financiera Neta / EBITDA',        interpretacion: 'Años de EBITDA para cubrir la deuda.' },
    { name: 'Cobertura Intereses',  value: 8.33,         unit: 'x',   variation: -0.5, status: 'ok',      formula: 'EBIT / Gastos Financieros',             interpretacion: 'Capacidad de pagar intereses con resultado operativo.' },
    { name: 'Leverage',             value: 2.50,         unit: 'x',   variation: 0.3,  status: 'warning', formula: 'Activo Total / Patrimonio',             interpretacion: 'Multiplicador de capital.' },
    { name: 'Z Altman',             value: 2.10,         unit: 'x',   variation: -0.2, status: 'warning', formula: 'Modelo Altman Z-Score 5 factores',      interpretacion: 'Z<1.81 zona de peligro; 1.81–2.99 zona gris; >2.99 sano.' },
  ],
  Eficiencia: [
    { name: 'Rot. Activo Total',    value: 0.63,         unit: 'x',   variation: 0.05, status: 'ok',      formula: 'Ingresos / Activos Totales',            interpretacion: 'Por cada $1 de activo genera $0.63 de ventas.' },
    { name: 'Rot. Capital Trabajo', value: 6.25,         unit: 'x',   variation: 0.3,  status: 'ok',      formula: 'Ingresos / Capital de Trabajo',         interpretacion: 'Eficiencia del capital de trabajo en ventas.' },
    { name: 'Ventas/Empleado',      value: 25_000_000,  unit: 'CLP', variation: 2.0,  status: 'ok',      formula: 'Ingresos / N° Empleados',               interpretacion: 'Productividad promedio por empleado.' },
    { name: 'Gasto Op./Ventas',     value: 15.0,         unit: '%',   variation: -0.5, status: 'ok',      formula: 'Gastos Operativos / Ingresos × 100',    interpretacion: 'Porcentaje de ventas consumido en gastos op.' },
    { name: 'Gasto Op. Diario',     value: 6_250_000,   unit: 'CLP', variation: 1.0,  status: 'neutral', formula: 'Gastos Operativos / Días del Período',  interpretacion: 'Gasto operativo diario promedio.' },
  ],
  'Ciclo Efectivo': [
    { name: 'Días CxC',             value: 48,           unit: 'días', variation: -2,   status: 'ok',      formula: 'CxC / (Ingresos / Días Período)',       interpretacion: 'Días promedio para cobrar facturas.' },
    { name: 'Días Inventario',      value: 5,            unit: 'días', variation: 0,    status: 'ok',      formula: 'Inventario / (CMV / Días Período)',     interpretacion: 'Días promedio del inventario en bodega.' },
    { name: 'Días Proveedores',     value: 45,           unit: 'días', variation: 1,    status: 'ok',      formula: 'CxP / (CMV / Días Período)',            interpretacion: 'Días promedio para pagar a proveedores.' },
    { name: 'Ciclo de Efectivo',    value: 8,            unit: 'días', variation: -1,   status: 'ok',      formula: 'Días CxC + Días Inventario - Días Proveedores', interpretacion: 'Días que el efectivo está comprometido en el ciclo operativo.' },
  ],
  Estratégico: [
    { name: 'Punto de Equilibrio',  value: 700_000_000, unit: 'CLP', variation: 0,    status: 'ok',      formula: 'Costos Fijos / Margen Contribución Unitario', interpretacion: 'Nivel de ventas bajo el cual hay pérdida.' },
    { name: 'Cobertura PE',         value: 42.9,         unit: '%',   variation: 5.0,  status: 'ok',      formula: '(Ventas Reales - Ventas PE) / Ventas PE × 100', interpretacion: 'Margen de seguridad sobre el punto de equilibrio.' },
    { name: 'ROI DuPont',           value: 13.6,         unit: '%',   variation: -0.5, status: 'ok',      formula: 'Margen Neto × Rot. Activos × Leverage', interpretacion: 'Descomposición tridimensional del ROE.' },
    { name: 'EVA',                  value: -24_000_000, unit: 'CLP', variation: -5.0, status: 'critical',formula: 'NOPAT - (Capital Invertido × WACC)',     interpretacion: 'Valor destruido/creado vs costo de capital. Negativo = destrucción de valor.' },
    { name: 'Crecimiento Ventas',   value: 8.3,          unit: '%',   variation: 8.3,  status: 'ok',      formula: '(Ventas Actual - Ventas Anterior) / Ventas Anterior × 100', interpretacion: 'Tasa de crecimiento respecto al período anterior.' },
  ],
}

// Datos históricos mock para el drawer
const MOCK_HISTORICO = [
  { mes: '2024-03', valor: 42 }, { mes: '2024-04', valor: 41 }, { mes: '2024-05', valor: 43 },
  { mes: '2024-06', valor: 40 }, { mes: '2024-07', valor: 41 }, { mes: '2024-08', valor: 42 },
  { mes: '2024-09', valor: 43 }, { mes: '2024-10', valor: 41 }, { mes: '2024-11', valor: 44 },
  { mes: '2024-12', valor: 43 }, { mes: '2025-01', valor: 44 }, { mes: '2025-02', valor: 40 },
]

const TABS = Object.keys(PERSPECTIVAS)

// ── Drawer de detalle ────────────────────────────────────────────────────────
function MetricaDrawer({ metrica, onClose }: { metrica: Metrica | null; onClose: () => void }) {
  if (!metrica) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      {/* Panel */}
      <aside className="relative w-full max-w-md bg-white shadow-xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">{metrica.name}</h2>
          <button onClick={onClose} aria-label="Cerrar panel" className="p-1 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Fórmula */}
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Fórmula</p>
            <code className="block bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm font-mono text-gray-700">
              {metrica.formula}
            </code>
          </div>
          {/* Interpretación */}
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Interpretación</p>
            <p className="text-sm text-gray-700">{metrica.interpretacion}</p>
          </div>
          {/* LineChart histórico */}
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Histórico 12 meses</p>
            <LineChartWrapper
              data={MOCK_HISTORICO}
              xKey="mes"
              height={180}
              lines={[{ key: 'valor', name: metrica.name, color: '#2E86AB' }]}
            />
          </div>
          {/* Tabla de valores */}
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Valores por mes</p>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2">Mes</th>
                  <th className="text-right px-3 py-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_HISTORICO.map((row) => (
                  <tr key={row.mes} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-1.5 text-gray-600">{row.mes}</td>
                    <td className="px-3 py-1.5 text-right font-medium">{row.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ── Página principal BSC ─────────────────────────────────────────────────────
export default function BSC() {
  const location = useLocation()
  const navigate = useNavigate()

  const pathToTab: Record<string, string> = {
    'rentabilidad': 'Rentabilidad',
    'liquidez': 'Liquidez',
    'endeudamiento': 'Endeudamiento',
    'eficiencia': 'Eficiencia',
    'ciclo-efectivo': 'Ciclo Efectivo',
    'estrategico': 'Estratégico',
  }

  const tabToPath: Record<string, string> = {
    'Rentabilidad': 'rentabilidad',
    'Liquidez': 'liquidez',
    'Endeudamiento': 'endeudamiento',
    'Eficiencia': 'eficiencia',
    'Ciclo Efectivo': 'ciclo-efectivo',
    'Estratégico': 'estrategico',
  }

  const currentPath = location.pathname.split('/').pop() || 'rentabilidad'
  const activeTab = pathToTab[currentPath] || 'Rentabilidad'

  const [selectedMetric, setSelectedMetric] = useState<Metrica | null>(null)

  const metricas = PERSPECTIVAS[activeTab] ?? []

  const handleExportCSV = () => {
    const allMetrics = Object.entries(PERSPECTIVAS).flatMap(([perspectiva, ms]) =>
      ms.map((m) => ({ perspectiva, nombre: m.name, valor: m.value ?? '', unidad: m.unit, status: m.status }))
    )
    const header = 'Perspectiva,Nombre,Valor,Unidad,Status'
    const rows = allMetrics.map((m) => `${m.perspectiva},${m.nombre},${m.valor},${m.unidad},${m.status}`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'bsc_metricas.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Balanced Scorecard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Métricas financieras por perspectiva</p>
        </div>
        <button
          id="bsc-export-csv"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 h-9 px-4 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700"
        >
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => navigate(`/bsc/${tabToPath[tab]}`)}
              className={[
                'whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Grid de KPICards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricas.map((m) => (
          <div
            key={m.name}
            onClick={() => setSelectedMetric(m)}
            className="cursor-pointer"
          >
            <KPICard
              name={m.name}
              value={m.value}
              unit={m.unit}
              variation={m.variation}
              status={m.status}
            />
          </div>
        ))}
      </div>

      {/* Drawer de detalle */}
      <MetricaDrawer metrica={selectedMetric} onClose={() => setSelectedMetric(null)} />
    </div>
  )
}
