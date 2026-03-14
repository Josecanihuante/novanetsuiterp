import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LineChartWrapper } from '@/components/charts/LineChartWrapper'

interface ProductRow {
  id: string; sku: string; name: string; category: string
  stock_quantity: number; min_stock: number; cost_price: number; sale_price: number
  [key: string]: unknown
}

const MOCK: ProductRow[] = [
  { id: '1', sku: 'CONS-001', name: 'Consultoría Estratégica',    category: 'Servicios',  stock_quantity: 999, min_stock: 0,   cost_price: 1_250_000, sale_price: 2_500_000 },
  { id: '2', sku: 'LIC-SW01', name: 'Licencia Software ERP',       category: 'Software',   stock_quantity: 50,  min_stock: 10,  cost_price: 850_000,   sale_price: 1_500_000 },
  { id: '3', sku: 'HW-SRV01', name: 'Servidor Dell PowerEdge',     category: 'Hardware',   stock_quantity: 3,   min_stock: 5,   cost_price: 8_500_000, sale_price: 12_000_000 },
  { id: '4', sku: 'SUP-MAN01',name: 'Soporte Mantenimiento Anual', category: 'Servicios',  stock_quantity: 999, min_stock: 0,   cost_price: 500_000,   sale_price: 890_000 },
]

const MOVIMIENTOS_MOCK = [
  { fecha: '2025-01-15', cantidad: 5 }, { fecha: '2025-01-22', cantidad: 2 },
  { fecha: '2025-01-28', cantidad: 8 }, { fecha: '2025-02-03', cantidad: 3 },
  { fecha: '2025-02-10', cantidad: 6 }, { fecha: '2025-02-15', cantidad: 4 },
]

const COLS: Column<ProductRow>[] = [
  { key: 'sku',            header: 'SKU',         type: 'text',    sortable: true },
  { key: 'name',           header: 'Producto',    type: 'text',    sortable: true },
  { key: 'category',       header: 'Categoría',   type: 'text' },
  { key: 'stock_quantity', header: 'Stock',       type: 'number',  sortable: true },
  { key: 'cost_price',     header: 'Costo',       type: 'currency',sortable: true },
  { key: 'sale_price',     header: 'Precio',      type: 'currency',sortable: true },
]

function ProductModal({ product, onClose }: { product?: ProductRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{product ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {[
            { id: 'prod-sku',   label: 'SKU',       val: product?.sku },
            { id: 'prod-name',  label: 'Nombre',    val: product?.name },
            { id: 'prod-cat',   label: 'Categoría', val: product?.category },
            { id: 'prod-cost',  label: 'Costo',     val: product?.cost_price },
            { id: 'prod-price', label: 'Precio',    val: product?.sale_price },
            { id: 'prod-min',   label: 'Stock Mín.', val: product?.min_stock },
          ].map(({ id, label, val }) => (
            <div key={id} className="flex flex-col gap-1">
              <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
              <input id={id} type="text" defaultValue={String(val ?? '')}
                className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary">Guardar</Button>
        </div>
      </div>
    </div>
  )
}

export default function Inventory() {
  const [showModal, setShowModal]     = useState(false)
  const [selected, setSelected]       = useState<ProductRow | undefined>()
  const [detailProduct, setDetail]    = useState<ProductRow | null>(null)

  const enriched = MOCK.map((p) => ({ ...p, low_stock: p.stock_quantity < p.min_stock }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500 mt-0.5">Productos y control de stock</p>
        </div>
        <Button id="inventory-nuevo" variant="primary" onClick={() => { setSelected(undefined); setShowModal(true) }}>
          <Plus size={14} /> Nuevo producto
        </Button>
      </div>

      <div className="flex gap-5">
        {/* Tabla */}
        <div className="flex-1 min-w-0">
          <DataTable
            columns={[
              ...COLS,
              {
                key: 'id', header: 'Alerta', type: 'badge',
                badgeMap: (v: unknown) => {
                  const row = MOCK.find((p) => p.id === String(v))
                  return row && row.stock_quantity < row.min_stock ? 'danger' : 'neutral'
                },
              } as unknown as Column<ProductRow>,
            ]}
            data={MOCK}
            onRowClick={(row) => setDetail(row)}
          />
          {/* Overlay de badge stock bajo en tabla */}
          <div className="mt-2 flex flex-wrap gap-2">
            {MOCK.filter((p) => p.stock_quantity < p.min_stock).map((p) => (
              <Badge key={p.id} variant="danger">⚠ Stock bajo: {p.name}</Badge>
            ))}
          </div>
        </div>

        {/* Panel derecho de detalle */}
        {detailProduct && (
          <div className="w-80 shrink-0">
            <Card
              title={detailProduct.name}
              action={<button onClick={() => setDetail(null)} className="p-0.5 rounded hover:bg-gray-100"><X size={14} /></button>}
            >
              <p className="text-xs text-gray-500 mb-3">Movimientos últimos 30 días</p>
              <LineChartWrapper
                data={MOVIMIENTOS_MOCK}
                xKey="fecha"
                height={150}
                lines={[{ key: 'cantidad', name: 'Unidades', color: '#2E86AB' }]}
              />
              <div className="mt-3 text-xs space-y-1 text-gray-600">
                <div className="flex justify-between"><span>SKU</span><strong>{detailProduct.sku}</strong></div>
                <div className="flex justify-between"><span>Stock actual</span><strong>{detailProduct.stock_quantity}</strong></div>
                <div className="flex justify-between"><span>Stock mínimo</span><strong>{detailProduct.min_stock}</strong></div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {showModal && <ProductModal product={selected} onClose={() => setShowModal(false)} />}
    </div>
  )
}
