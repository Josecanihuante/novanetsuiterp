import React from 'react'
import { PDFInvoiceData } from '@/utils/invoicePDF'

interface Props {
  data: PDFInvoiceData
  isOpen: boolean
  onClose: () => void
  onDownload: () => void
}

export function InvoicePreview({ data, isOpen, onClose, onDownload }: Props) {
  if (!isOpen) return null

  const formatCLP = (n: number) => `$ ${n.toLocaleString('es-CL')}`
  const formatDate = (d: string) => {
    if (!d) return '';
    try {
      const date = new Date(d + 'T12:00:00')
      return date.toLocaleDateString('es-CL')
    } catch {
      return d
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Vista Previa — Factura N° {data.invoiceNumber || 'Borrador'}</h2>
          <div className="flex space-x-2">
            <button onClick={onDownload} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Descargar PDF
            </button>
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
              Cerrar
            </button>
          </div>
        </div>

        {/* Contenido Scroll (Aspecto Carta aprox) */}
        <div className="overflow-y-auto p-8 bg-gray-50 flex-1">
          <div className="bg-white mx-auto shadow-sm border border-gray-200" style={{ maxWidth: '800px', minHeight: '1000px', padding: 0 }}>
            {/* Encabezado Azul */}
            <div className="bg-[#1e3a5f] text-white p-8 pb-10 flex justify-between relative">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-[#1e3a5f] font-bold text-xl">
                  ERP
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{data.issuerName}</h1>
                  <p className="text-sm opacity-90 mt-1">RUT: {data.issuerRut}</p>
                  <p className="text-sm opacity-90">{data.issuerActivity}</p>
                  <p className="text-sm opacity-90">{data.issuerAddress} · {data.issuerCity}</p>
                  <p className="text-sm opacity-90">{data.issuerPhone} · {data.issuerEmail}</p>
                </div>
              </div>
              
              <div className="bg-[#2e86ab] text-white p-4 rounded-lg w-48 text-center h-24 flex flex-col justify-center shadow-lg -mb-16 mt-2 relative z-10 border-2 border-[#1e3a5f]">
                <div className="font-bold text-lg tracking-wider">FACTURA</div>
                <div className="text-sm mt-1">N° {data.invoiceNumber || '______'}</div>
              </div>
            </div>

            <div className="px-8 mt-12 grid grid-cols-12 gap-6">
              {/* Receptor */}
              <div className="col-span-7 bg-gray-50 border border-gray-200 rounded p-4">
                <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Receptor</div>
                <div className="font-bold text-lg text-gray-800">{data.clientName || 'Sin Receptor'}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold block">RUT:</span> {data.clientRut}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold block">Giro:</span> {data.clientActivity}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold block">Dirección:</span> {data.clientAddress}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold block">Ciudad:</span> {data.clientCity}
                </div>
              </div>

              {/* Emisión */}
              <div className="col-span-5 bg-gray-50 border border-gray-200 rounded p-4">
                <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Datos de Emisión</div>
                <dl className="text-sm">
                  <div className="flex justify-between py-1">
                    <dt className="font-semibold text-gray-600">Fecha emisión:</dt>
                    <dd className="text-gray-900">{formatDate(data.invoiceDate)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="font-semibold text-gray-600">Vencimiento:</dt>
                    <dd className="text-gray-900">{formatDate(data.dueDate)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="font-semibold text-gray-600">Cond. pago:</dt>
                    <dd className="text-gray-900">{data.paymentCondition}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Ítems */}
            <div className="px-8 mt-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1e3a5f] text-white">
                    <th className="py-2 px-3 text-left w-12 rounded-tl">N°</th>
                    <th className="py-2 px-3 text-left">Descripción del Servicio</th>
                    <th className="py-2 px-3 text-center">Cantidad</th>
                    <th className="py-2 px-3 text-right">Precio Neto</th>
                    <th className="py-2 px-3 text-right rounded-tr">Total Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">Sin ítems</td></tr>
                  ) : (
                    data.items.map((it, idx) => (
                      <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-gray-800">{it.description}</td>
                        <td className="py-2 px-3 text-center text-gray-600">{it.quantity}</td>
                        <td className="py-2 px-3 text-right text-gray-600">{formatCLP(it.unitPrice)}</td>
                        <td className="py-2 px-3 text-right font-medium text-gray-900">{formatCLP(it.subtotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="px-8 mt-8 flex justify-end">
              <div className="w-72 bg-gray-50 border border-gray-200 rounded overflow-hidden">
                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Neto:</span>
                    <span className="font-medium text-gray-900">{formatCLP(data.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">IVA (19%):</span>
                    <span className="font-medium text-gray-900">{formatCLP(data.iva)}</span>
                  </div>
                </div>
                <div className="bg-[#1e3a5f] p-4 text-white flex justify-between">
                  <span className="font-bold">TOTAL:</span>
                  <span className="font-bold text-lg">{formatCLP(data.total)}</span>
                </div>
              </div>
            </div>

            {/* Notas */}
            {data.notes && (
              <div className="px-8 mt-6">
                <div className="text-xs font-bold text-gray-500 uppercase">Observaciones:</div>
                <div className="text-sm text-gray-700 mt-1 whitespace-pre-line border-l-2 border-gray-200 pl-3">
                  {data.notes}
                </div>
              </div>
            )}

            {/* Timbre Patter */}
            <div className="px-8 mt-12 mb-8">
              <div className="border border-gray-300 w-64 h-24 mx-auto flex flex-col justify-center items-center opacity-60">
                <div className="font-bold text-[10px] tracking-widest text-[#1e3a5f]">TIMBRE ELECTRÓNICO SII</div>
                <div className="text-[10px] mt-1 text-gray-500">Res. Ex. SII N° — Doc simulado</div>
                <div className="text-[10px] mt-1 text-gray-500">No válido como documento tributario</div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#1e3a5f] text-white text-center py-2 text-[10px] mt-12">
              {data.issuerName} · RUT {data.issuerRut} · {data.issuerAddress}, {data.issuerCity}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
