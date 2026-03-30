import React, { useState, useEffect } from 'react'
import { Plus, X, Search, FileText, Download, Save, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { generateInvoicePDF, PDFInvoiceData } from '@/utils/invoicePDF'
import { InvoicePreview } from '@/components/invoice/InvoicePreview'
import { useAuthStore } from '@/store/authStore'
import api from '@/services/api' // using existing axios configured store

const ISSUER = {
  name: 'Innova Consulting Group SpA',
  rut: '76.987.654-3',
  address: 'Av. Providencia 2594, Of. 301',
  city: 'Providencia, Santiago',
  phone: '+56 2 2345 6789',
  email: 'contacto@innovaconsulting.cl',
  activity: 'Consultoría de Estrategia y Transformación Digital',
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

interface ClientData {
  id: string
  name: string
  tax_id: string
  address: string
  city: string
  email: string
  trade_name: string
}

export default function NuevaFacturaPage() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState(`HON-${currentYear}-0001`)
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  
  const defaultDueDate = new Date()
  defaultDueDate.setDate(defaultDueDate.getDate() + 30)
  const [dueDate, setDueDate] = useState(defaultDueDate.toISOString().split('T')[0])
  
  const [paymentCondition, setPaymentCondition] = useState('30 días')
  
  // Client State
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<ClientData[]>([])
  
  const [client, setClient] = useState({
    id: '',
    name: '',
    rut: '',
    address: '',
    city: '',
    email: '',
    activity: 'Comercial'
  })

  // Items State
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'Servicios de consultoría contable', quantity: 1, unitPrice: 0 }
  ])
  
  const [notes, setNotes] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Calculated values
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const iva = Math.round(subtotal * 0.19)
  const total = subtotal + iva

  const formatCLP = (n: number) => `$${n.toLocaleString('es-CL')}`

  // Handlers
  const handleClientSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery) return
    setIsSearching(true)
    try {
      const resp = await api.get(`/customers?search=${searchQuery}`)
      setSearchResults(resp.data.data)
    } catch (error) {
      console.error("Error buscando clientes:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const selectClient = (c: ClientData) => {
    setClient({
      id: c.id,
      name: c.name,
      rut: c.tax_id,
      address: c.address || '',
      city: c.city || '',
      email: c.email || '',
      activity: c.trade_name || 'Comercial'
    })
    setSearchResults([])
    setSearchQuery('')
  }

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), description: '', quantity: 1, unitPrice: 0 }])
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(it => it.id === id ? { ...it, [field]: value } : it))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(it => it.id !== id))
  }

  const getPdfData = (): PDFInvoiceData => ({
    invoiceNumber,
    invoiceDate,
    dueDate,
    paymentCondition,
    issuerName: ISSUER.name,
    issuerRut: ISSUER.rut,
    issuerAddress: ISSUER.address,
    issuerCity: ISSUER.city,
    issuerPhone: ISSUER.phone,
    issuerEmail: ISSUER.email,
    issuerActivity: ISSUER.activity,
    clientName: client.name,
    clientRut: client.rut,
    clientAddress: client.address,
    clientCity: client.city,
    clientEmail: client.email,
    clientActivity: client.activity,
    items: items.map(it => ({
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      subtotal: it.quantity * it.unitPrice
    })),
    subtotal,
    iva,
    total,
    notes
  })

  const handleDownloadPDF = () => {
    generateInvoicePDF(getPdfData())
  }

  const handleSave = async () => {
    if (!client.id) {
      alert("Debes seleccionar un cliente registrado.")
      return
    }
    
    // Obtener el ID del periodo activo. Para simplificar el demo mockeamos uno del sistema 
    // o asumiremos que el backend lo acepta. En una APP real haríamos GET /periods
    
    try {
      const payload = {
        invoice_number: invoiceNumber,
        invoice_type: "sales",
        customer_id: client.id,
        period_id: "00000000-0000-0000-0000-000000000000", // UUID dummy para efecto del sistema
        issue_date: new Date(invoiceDate).toISOString(),
        due_date: new Date(dueDate).toISOString(),
        payment_condition: paymentCondition,
        notes: notes || undefined,
        items: items.map((it, idx) => ({
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          line_order: idx + 1
        }))
      }
      
      await api.post('/invoices', payload)
      navigate('/facturas')
    } catch (err) {
      console.error(err)
      alert("Error al guardar la factura en el servidor.")
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <InvoicePreview 
        isOpen={showPreview} 
        data={getPdfData()} 
        onClose={() => setShowPreview(false)} 
        onDownload={handleDownloadPDF}
      />

      {/* Header & Actions */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="px-2">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[#1e3a5f]">Nueva Factura Electrónica</h1>
            <p className="text-sm text-gray-500">Documento afecto a IVA (19%)</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setShowPreview(true)}>
            <FileText size={16} className="mr-2" /> Vista Previa
          </Button>
          <Button variant="ghost" onClick={handleDownloadPDF}>
            <Download size={16} className="mr-2" /> Descargar PDF
          </Button>
          <Button variant="primary" onClick={handleSave} className="bg-[#1e3a5f]">
            <Save size={16} className="mr-2" /> Guardar Factura
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-8">
        
        {/* SECCIÓN 1: DATOS FACTURA */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">1. Datos del Documento</h2>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° Factura</label>
              <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md px-3 font-semibold text-[#1e3a5f]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Emisión</label>
              <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md px-3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Vencimiento</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md px-3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condición Pago</label>
              <select value={paymentCondition} onChange={e => setPaymentCondition(e.target.value)} 
                className="w-full h-10 border border-gray-300 rounded-md px-3">
                <option value="Contado">Contado</option>
                <option value="15 días">15 días</option>
                <option value="30 días">30 días</option>
                <option value="60 días">60 días</option>
                <option value="90 días">90 días</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECCIÓN 2: RECEPTOR */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">2. Datos del Receptor</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <form onSubmit={handleClientSearch} className="flex gap-2 mb-6 relative">
              <input 
                type="text" 
                placeholder="Buscar cliente por nombre o RUT..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 h-10 border border-gray-300 rounded-md px-3 text-sm"
              />
              <Button type="submit" variant="primary" disabled={isSearching}>
                <Search size={16} className="mr-2" /> Buscar
              </Button>
              
              {/* Dropdown resultados flotante */}
              {searchResults.length > 0 && (
                <div className="absolute top-12 left-0 right-32 bg-white border border-gray-200 shadow-xl rounded-md z-10 max-h-60 overflow-y-auto">
                  {searchResults.map(res => (
                    <div key={res.id} onClick={() => selectClient(res)} className="p-3 border-b hover:bg-gray-50 cursor-pointer flex justify-between">
                      <div>
                        <div className="font-semibold text-sm">{res.name}</div>
                        <div className="text-xs text-gray-500">{res.trade_name}</div>
                      </div>
                      <div className="text-sm text-gray-600 font-mono">{res.tax_id}</div>
                    </div>
                  ))}
                </div>
              )}
            </form>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Razón Social</label>
                <input type="text" value={client.name} onChange={e => setClient({...client, name: e.target.value})}
                  className="w-full border-b border-gray-300 bg-transparent px-1 py-1 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">RUT</label>
                <input type="text" value={client.rut} onChange={e => setClient({...client, rut: e.target.value})}
                  className="w-full border-b border-gray-300 bg-transparent px-1 py-1 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Giro / Actividad</label>
                <input type="text" value={client.activity} onChange={e => setClient({...client, activity: e.target.value})}
                  className="w-full border-b border-gray-300 bg-transparent px-1 py-1 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email Integración DTE</label>
                <input type="text" value={client.email} onChange={e => setClient({...client, email: e.target.value})}
                  className="w-full border-b border-gray-300 bg-transparent px-1 py-1 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Dirección</label>
                <input type="text" value={client.address} onChange={e => setClient({...client, address: e.target.value})}
                  className="w-full border-b border-gray-300 bg-transparent px-1 py-1 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ciudad / Comuna</label>
                <input type="text" value={client.city} onChange={e => setClient({...client, city: e.target.value})}
                  className="w-full border-b border-gray-300 bg-transparent px-1 py-1 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 3: ÍTEMS */}
        <section>
          <div className="flex justify-between items-end mb-4 border-b pb-2">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">3. Detalle de Servicios</h2>
            <Button variant="ghost" size="sm" onClick={addItem} className="h-8">
              <Plus size={14} className="mr-1" /> Agregar Ítem
            </Button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-2 font-medium w-1/2">Descripción</th>
                <th className="pb-2 font-medium w-24 text-center">Cantidad</th>
                <th className="pb-2 font-medium w-36 text-right">Precio Unitario</th>
                <th className="pb-2 font-medium w-36 text-right">Total Neto</th>
                <th className="pb-2 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0 group">
                  <td className="py-2 pr-2">
                    <input type="text" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Ej. Asesoría Financiera" className="w-full border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="number" min="1" value={item.quantity || ''} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-center focus:border-blue-500" />
                  </td>
                  <td className="py-2 px-2 relative">
                    <span className="absolute left-4 top-4 text-gray-400">$</span>
                    <input type="number" min="0" value={item.unitPrice || ''} onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-200 rounded pl-6 pr-2 py-1.5 text-right focus:border-blue-500" />
                  </td>
                  <td className="py-2 px-2 text-right font-medium text-gray-800">
                    {formatCLP(item.quantity * item.unitPrice)}
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALES */}
          <div className="flex justify-end mt-6">
            <div className="w-80 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Monto Neto:</span>
                  <span className="text-gray-800">{formatCLP(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">IVA (19%):</span>
                  <span className="text-gray-800">{formatCLP(iva)}</span>
                </div>
              </div>
              <div className="bg-[#1e3a5f] text-white p-4 flex justify-between items-center">
                <span className="font-bold">TOTAL FACTURA:</span>
                <span className="text-xl font-bold">{formatCLP(total)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 4: OBSERVACIONES */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">4. Notas Adicionales</h2>
          <textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)}
            placeholder="Condiciones comerciales, cuenta bancaria para pago, orden de compra, etc."
            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </section>

      </div>
    </div>
  )
}
