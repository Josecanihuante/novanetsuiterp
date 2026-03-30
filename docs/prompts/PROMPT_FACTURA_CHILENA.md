# PROMPT — Módulo Factura Chilena
# Agentes: @developer-frontend + @developer-backend + @base-de-datos
# Ejecutar en conversación NUEVA en Antigravity
# ============================================================

## Contexto del proyecto
- Frontend: React 18 + TypeScript + Tailwind — Vercel
- Backend: FastAPI + Python 3.12 — Render (novanetsuiterp-1.onrender.com)
- BD: PostgreSQL 16 en Neon — schema commerce
- Empresa emisora: Innova Consulting Group SpA, RUT 76.987.654-3
- Tablas existentes: commerce.invoices, commerce.invoice_items, commerce.customers

## OBJETIVO
Implementar un módulo completo de generación de facturas chilenas con:
- Formulario de nueva factura editable
- Vista previa en pantalla
- Descarga en PDF formato factura chilena
- Integración con el backend existente

---

## PARTE 1 — BACKEND
### @developer-backend

### 1.1 Verificar endpoint existente
Confirmar que existe POST /api/v1/invoices/ con este schema de request:
```python
class InvoiceCreate(BaseModel):
    invoice_number: str
    invoice_date: date
    due_date: date
    payment_condition: str  # "30 días", "60 días", "Contado", etc.
    customer_id: UUID
    notes: Optional[str]
    items: list[InvoiceItemCreate]

class InvoiceItemCreate(BaseModel):
    description: str
    quantity: Decimal
    unit_price: Decimal  # precio NETO sin IVA
```

Si no existe, crearlo siguiendo el patrón router→service→schema→model.

### 1.2 Lógica de cálculo (en el service, nunca en el router)
```python
# El backend calcula automáticamente:
subtotal   = sum(item.quantity * item.unit_price for item in items)
iva        = round(subtotal * Decimal('0.19'))
total      = subtotal + iva
tax_amount = iva
```

### 1.3 Endpoint de búsqueda de clientes para el formulario
Confirmar que existe GET /api/v1/customers/?search=texto
que devuelve lista de clientes con: id, name, rut, address, email, phone

### 1.4 Response de factura creada
```python
class InvoiceResponse(BaseModel):
    id: UUID
    invoice_number: str
    invoice_date: date
    due_date: date
    payment_condition: str
    customer_id: UUID
    customer: CustomerResponse  # datos del cliente embebidos
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal
    status: str
    notes: Optional[str]
    items: list[InvoiceItemResponse]
    created_at: datetime
```

---

## PARTE 2 — FRONTEND
### @developer-frontend

### 2.1 Instalar dependencias
```bash
cd frontend
npm install jspdf jspdf-autotable
```

### 2.2 Crear archivo: frontend/src/utils/invoicePDF.ts
Función que genera el PDF de la factura en formato chileno:

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentCondition: string;
  // Emisor (fijo)
  issuerName: string;     // Innova Consulting Group SpA
  issuerRut: string;      // 76.987.654-3
  issuerAddress: string;  // Av. Providencia 2594, Providencia
  issuerCity: string;     // Santiago
  issuerPhone: string;
  issuerEmail: string;
  issuerActivity: string; // Consultoría de Estrategia y Transformación Digital
  // Receptor
  clientName: string;
  clientRut: string;
  clientAddress: string;
  clientCity: string;
  clientEmail: string;
  clientActivity: string;
  // Ítems
  items: { description: string; quantity: number; unitPrice: number; subtotal: number }[];
  // Totales
  subtotal: number;
  iva: number;
  total: number;
  notes: string;
}

export const generateInvoicePDF = (data: PDFInvoiceData): void => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = 215.9; // ancho carta en mm
  const formatCLP = (n: number) => `$ ${n.toLocaleString('es-CL')}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CL');

  // ── ENCABEZADO AZUL ──────────────────────────────────────────
  doc.setFillColor(30, 58, 95); // navy
  doc.rect(0, 0, W, 38, 'F');

  // Logo placeholder (cuadrado blanco con texto ERP)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 7, 24, 24, 3, 3, 'F');
  doc.setTextColor(30, 58, 95);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ERP', 22, 22, { align: 'center' });

  // Nombre empresa
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.issuerName, 40, 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`RUT: ${data.issuerRut}`, 40, 21);
  doc.text(data.issuerActivity, 40, 26);
  doc.text(`${data.issuerAddress} · ${data.issuerCity}`, 40, 31);
  doc.text(`${data.issuerPhone} · ${data.issuerEmail}`, 40, 36);

  // Badge FACTURA NO AFECTA / AFECTA
  doc.setFillColor(46, 134, 171); // blue
  doc.roundedRect(W - 55, 8, 45, 22, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', W - 32.5, 17, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${data.invoiceNumber}`, W - 32.5, 23, { align: 'center' });

  // ── DATOS FACTURA + RECEPTOR ──────────────────────────────────
  // Caja izquierda — Receptor
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(10, 44, 120, 42, 2, 2, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(10, 44, 120, 42, 2, 2, 'S');

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEPTOR', 14, 51);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(data.clientName, 14, 58);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`RUT: ${data.clientRut}`, 14, 64);
  doc.text(`Giro: ${data.clientActivity}`, 14, 70);
  doc.text(`Dirección: ${data.clientAddress}`, 14, 76);
  doc.text(`Ciudad: ${data.clientCity}`, 14, 82);

  // Caja derecha — Datos factura
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(136, 44, 70, 42, 2, 2, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(136, 44, 70, 42, 2, 2, 'S');

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE EMISIÓN', 140, 51);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);

  const rows = [
    ['Fecha emisión:', formatDate(data.invoiceDate)],
    ['Vencimiento:', formatDate(data.dueDate)],
    ['Condición pago:', data.paymentCondition],
  ];
  rows.forEach(([label, value], i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(label, 140, 59 + i * 8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(value, 175, 59 + i * 8, { align: 'right' });
  });

  // ── TABLA DE ÍTEMS ────────────────────────────────────────────
  autoTable(doc, {
    startY: 92,
    head: [['N°', 'Descripción del Servicio', 'Cantidad', 'Precio Unitario', 'Total Neto']],
    body: data.items.map((item, i) => [
      i + 1,
      item.description,
      item.quantity.toLocaleString('es-CL'),
      formatCLP(item.unitPrice),
      formatCLP(item.subtotal),
    ]),
    headStyles: {
      fillColor: [30, 58, 95],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 90 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 10, right: 10 },
  });

  // ── TOTALES ───────────────────────────────────────────────────
  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Caja totales (derecha)
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(130, finalY, 76, 36, 2, 2, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(130, finalY, 76, 36, 2, 2, 'S');

  const totals = [
    { label: 'Neto:', value: formatCLP(data.subtotal) },
    { label: 'IVA (19%):', value: formatCLP(data.iva) },
  ];
  totals.forEach(({ label, value }, i) => {
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 134, finalY + 10 + i * 8);
    doc.setTextColor(30, 30, 30);
    doc.text(value, 202, finalY + 10 + i * 8, { align: 'right' });
  });

  // Línea separadora
  doc.setDrawColor(30, 58, 95);
  doc.line(134, finalY + 28, 202, finalY + 28);

  // Total final
  doc.setFillColor(30, 58, 95);
  doc.roundedRect(130, finalY + 29, 76, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 134, finalY + 36);
  doc.text(formatCLP(data.total), 202, finalY + 36, { align: 'right' });

  // ── NOTAS ─────────────────────────────────────────────────────
  if (data.notes) {
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones:', 10, finalY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(data.notes, 110);
    doc.text(lines, 10, finalY + 17);
  }

  // ── TIMBRE SII SIMULADO ────────────────────────────────────────
  const timbreY = finalY + 48;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.rect(10, timbreY, 80, 20);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TIMBRE ELECTRÓNICO SII', 50, timbreY + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Res. Ex. SII N° — Documento simulado', 50, timbreY + 12, { align: 'center' });
  doc.text('No válido como documento tributario', 50, timbreY + 17, { align: 'center' });

  // ── FOOTER ────────────────────────────────────────────────────
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 270, W, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${data.issuerName} · RUT ${data.issuerRut} · ${data.issuerAddress}, ${data.issuerCity}`,
    W / 2, 275, { align: 'center' }
  );

  // ── GUARDAR ───────────────────────────────────────────────────
  doc.save(`Factura_${data.invoiceNumber}.pdf`);
};
```

### 2.3 Crear página: frontend/src/pages/commerce/NuevaFacturaPage.tsx

La página debe incluir:

**Estado del formulario:**
```typescript
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceForm {
  invoiceNumber: string;          // auto-generado: HON-YYYY-XXXX
  invoiceDate: string;            // hoy por defecto
  dueDate: string;                // hoy + 30 días por defecto
  paymentCondition: string;       // select: Contado / 30 días / 60 días / 90 días
  clientId: string;               // UUID del cliente seleccionado
  clientName: string;
  clientRut: string;
  clientAddress: string;
  clientCity: string;
  clientEmail: string;
  clientActivity: string;
  items: InvoiceItem[];
  notes: string;
}
```

**Secciones del formulario:**

SECCIÓN 1 — Datos de la factura (grid 4 columnas):
- N° Factura (editable, prefijo HON-YYYY-)
- Fecha emisión (date picker)
- Fecha vencimiento (date picker)
- Condición de pago (select)

SECCIÓN 2 — Receptor (búsqueda + campos editables):
- Input de búsqueda de cliente → llama GET /api/v1/customers/?search=
- Al seleccionar cliente, autocompleta: RUT, dirección, ciudad, email, giro
- Todos los campos quedan editables por si se necesita ajustar

SECCIÓN 3 — Detalle de servicios (tabla dinámica):
- Columnas: Descripción | Cantidad | Precio Unitario | Total
- Botón "Agregar ítem" al pie
- Botón "×" para eliminar cada ítem
- Totales calculados en tiempo real: Neto / IVA 19% / Total

SECCIÓN 4 — Observaciones:
- Textarea para notas adicionales

**Barra de acciones fija arriba:**
- Botón "Vista previa" → modal con InvoicePreview
- Botón "Descargar PDF" → llama generateInvoicePDF con los datos actuales
- Botón "Guardar" → POST /api/v1/invoices/ y redirige a /commerce/invoices

**Datos del emisor (hardcodeados para Innova Consulting):**
```typescript
const ISSUER = {
  name: 'Innova Consulting Group SpA',
  rut: '76.987.654-3',
  address: 'Av. Providencia 2594, Of. 301',
  city: 'Providencia, Santiago',
  phone: '+56 2 2345 6789',
  email: 'contacto@innovaconsulting.cl',
  activity: 'Consultoría de Estrategia y Transformación Digital',
};
```

**Cálculos (en tiempo real, sin llamar al backend):**
```typescript
const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
const iva = Math.round(subtotal * 0.19);
const total = subtotal + iva;
```

**Formato CLP obligatorio:**
```typescript
const formatCLP = (n: number) => `$${n.toLocaleString('es-CL')}`;
```

### 2.4 Crear componente: frontend/src/components/invoice/InvoicePreview.tsx

Modal de vista previa que muestra la factura formateada en HTML antes de descargar el PDF. Debe replicar visualmente el diseño del PDF:
- Encabezado azul con datos del emisor y número de factura
- Sección datos receptor
- Tabla de ítems con zebra striping
- Caja de totales (Neto / IVA / Total en azul)
- Timbre SII simulado
- Botón "Cerrar" y "Descargar PDF" dentro del modal

### 2.5 Agregar ruta en el router
En el archivo de rutas del frontend (App.tsx o router.tsx):
```typescript
<Route path="/commerce/invoices/nueva" element={<NuevaFacturaPage />} />
```

### 2.6 Agregar botón en InvoicesPage
En la página de listado de facturas, agregar:
```typescript
<Link to="/commerce/invoices/nueva">
  <Button variant="primary">+ Nueva Factura</Button>
</Link>
```

---

## PARTE 3 — BASE DE DATOS
### @base-de-datos

Verificar que commerce.invoices tiene la columna payment_condition:
```sql
ALTER TABLE commerce.invoices
ADD COLUMN IF NOT EXISTS payment_condition VARCHAR(50) DEFAULT '30 días';
```

Ejecutar en Neon SQL Editor si la columna no existe.

---

## PARTE 4 — REVISIÓN FINAL
### @technical-reviewer

Verificar antes del deploy:
- [ ] generateInvoicePDF recibe datos correctos del formulario
- [ ] Los cálculos de IVA son: iva = round(subtotal * 0.19)
- [ ] El total siempre es: subtotal + iva (sin decimales en CLP)
- [ ] El PDF usa formato de fecha DD/MM/YYYY (es-CL)
- [ ] Los montos usan separador de miles con punto: $42.000.000
- [ ] El viewer NO ve el botón "Guardar" (solo puede descargar PDF de facturas existentes)
- [ ] El contador SÍ puede crear facturas pero NO puede eliminarlas

---

## NOTAS IMPORTANTES

### Sobre el formato de fecha chilena
```typescript
// Correcto
new Date(dateString).toLocaleDateString('es-CL') // → 29/03/2026

// Incorrecto
dateString // → 2026-03-29
```

### Sobre los montos
- Los precios en el formulario se ingresan SIN IVA (precio neto)
- El IVA (19%) se calcula y muestra automáticamente
- El PDF muestra: Neto + IVA + Total
- Nunca usar float — los cálculos finales deben ser enteros (Math.round)

### Sobre jsPDF
- Instalar: npm install jspdf jspdf-autotable
- Importar autoTable así: import autoTable from 'jspdf-autotable'
- El PDF usa tamaño carta (letter), orientación portrait
- Márgenes: 10mm todos los lados

### Commit al terminar
```bash
git add .
git commit -m "feat: módulo factura chilena con generación PDF"
git push origin main
```
