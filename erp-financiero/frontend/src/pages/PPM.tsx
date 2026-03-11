import React, { useState } from 'react'
import { Download, ChevronDown, ChevronUp } from 'lucide-react'
import { BarChartWrapper } from '@/components/charts/BarChartWrapper'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface PPMRow {
  mes: string; ingresos: number; tasa: number; ppm: number
  status: string; acumulado: number
  [key: string]: unknown
}

const MOCK_HISTORIA: PPMRow[] = [
  { mes: 'Enero',      ingresos: 1_100_000_000, tasa: 2.5, ppm: 27_500_000, status: 'pagado',   acumulado: 27_500_000 },
  { mes: 'Febrero',    ingresos: 1_250_000_000, tasa: 2.5, ppm: 31_250_000, status: 'pagado',   acumulado: 58_750_000 },
  { mes: 'Marzo',      ingresos: 1_100_000_000, tasa: 2.5, ppm: 27_500_000, status: 'pendiente',acumulado: 86_250_000 },
]

const COLA_COLS: Column<PPMRow>[] = [
  { key: 'mes',       header: 'Mes',        type: 'text' },
  { key: 'ingresos',  header: 'Ingresos',   type: 'currency', sortable: true },
  { key: 'tasa',      header: 'Tasa %',     type: 'percent' },
  { key: 'ppm',       header: 'PPM',        type: 'currency', sortable: true },
  { key: 'status',    header: 'Estado',     type: 'badge', badgeMap: (v) => v === 'pagado' ? 'success' : 'warning' },
  { key: 'acumulado', header: 'Acumulado',  type: 'currency' },
]

const CHART_DATA = MOCK_HISTORIA.map((r) => ({ mes: r.mes.slice(0, 3), ppm: r.ppm / 1_000_000 }))

function fmt(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
}

export default function PPM() {
  const [mes, setMes]   = useState(3)
  const [year, setYear] = useState(2025)
  const [regime, setRegime] = useState('pro_pyme')
  const [tasa, setTasa]     = useState(0.25)
  const [showDetail, setShowDetail] = useState(false)

  // Último resultado mock
  const gross   = 1_250_000_000
  const ppmRate = regime === 'pro_pyme' ? 0.0025 : tasa / 100
  const ppmAmt  = Math.round(gross * ppmRate)
  const isSuspended = false

  const detailSteps = [
    { paso: '1. Régimen tributario',              valor: regime === 'pro_pyme' ? 'Pro PyME' : 'General' },
    { paso: '2. Base imponible (ingresos brutos)',  valor: fmt(gross) },
    { paso: '3. Tasa PPM aplicada',                valor: `${(ppmRate * 100).toFixed(2)}%` },
    { paso: `4. PPM = ${fmt(gross)} × ${(ppmRate * 100).toFixed(2)}%`, valor: fmt(ppmAmt) },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">PPM Chile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pagos Provisionales Mensuales — Art. 84 LIR</p>
        </div>
        <Button id="ppm-export-f29" variant="ghost">
          <Download size={14} /> Exportar F-29
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-4">
          {/* Selector período */}
          <Card title="Período de cálculo">
            <div className="flex gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label htmlFor="ppm-mes" className="text-sm font-medium text-gray-700">Mes</label>
                <select id="ppm-mes" value={mes} onChange={(e) => setMes(Number(e.target.value))}
                  className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40">
                  {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
                    .map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="ppm-year" className="text-sm font-medium text-gray-700">Año</label>
                <input id="ppm-year" type="number" min={2020} max={2099} value={year} onChange={(e) => setYear(Number(e.target.value))}
                  className="h-9 w-24 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
              </div>
            </div>
          </Card>

          {/* Configuración */}
          <Card title="Configuración tributaria">
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="ppm-regime" className="text-sm font-medium text-gray-700">Régimen tributario</label>
                <select id="ppm-regime" value={regime} onChange={(e) => setRegime(e.target.value)}
                  className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40">
                  <option value="general">General</option>
                  <option value="pro_pyme">Pro PyME (Art. 14D N°3)</option>
                  <option value="presunta">Renta Presunta</option>
                </select>
              </div>
              {regime === 'general' && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="ppm-tasa" className="text-sm font-medium text-gray-700">Tasa PPM % (calculada)</label>
                  <input id="ppm-tasa" type="number" step={0.01} min={0} max={5} value={tasa}
                    onChange={(e) => setTasa(parseFloat(e.target.value) || 0)}
                    className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
                  <p className="text-xs text-gray-500">Tope máximo: 5% (Art. 84 LIR)</p>
                </div>
              )}
            </div>
          </Card>

          {/* Resultado */}
          <Card title="Resultado del cálculo">
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Base imponible</span><span className="font-medium text-currency">{fmt(gross)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Tasa aplicada</span><span className="font-medium">{(ppmRate * 100).toFixed(2)}%</span></div>
              <div className="border-t border-gray-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">PPM a pagar</span>
                  <span className="text-2xl font-bold text-primary text-currency">{fmt(ppmAmt)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Alerta suspensión */}
          {isSuspended && (
            <div className="flex gap-3 p-4 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold">Evaluar suspensión Art. 90 LIR</p>
                <p>Existe pérdida tributaria acumulada. Consulte a su asesor tributario para evaluar la suspensión de PPM.</p>
              </div>
            </div>
          )}

          {/* Accordion detalle */}
          <Card>
            <button
              onClick={() => setShowDetail((d) => !d)}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700"
            >
              <span>Ver detalle del cálculo</span>
              {showDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showDetail && (
              <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                {detailSteps.map((s, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{s.paso}</span>
                    <span className="font-medium text-gray-800 text-currency">{s.valor}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          {/* BarChart */}
          <Card title="PPM mensual del año tributario (MM$)">
            <BarChartWrapper
              data={CHART_DATA}
              xKey="mes"
              bars={[{ key: 'ppm', name: 'PPM (MM$)', color: '#1E3A5F' }]}
              height={200}
              formatY={(v) => `$${v.toFixed(0)}M`}
            />
          </Card>

          {/* Tabla histórico */}
          <Card title={`Historial PPM ${year}`}>
            <DataTable
              columns={COLA_COLS}
              data={[
                ...MOCK_HISTORIA,
                {
                  mes: 'Total año',
                  ingresos: MOCK_HISTORIA.reduce((s, r) => s + r.ingresos, 0),
                  tasa: 0,
                  ppm: MOCK_HISTORIA.reduce((s, r) => s + r.ppm, 0),
                  status: '',
                  acumulado: MOCK_HISTORIA[MOCK_HISTORIA.length - 1].acumulado,
                },
              ]}
              pageSize={25}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
