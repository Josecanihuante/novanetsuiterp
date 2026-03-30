import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentCondition: string;
  // Emisor (fijo)
  issuerName: string;     
  issuerRut: string;      
  issuerAddress: string;  
  issuerCity: string;     
  issuerPhone: string;
  issuerEmail: string;
  issuerActivity: string; 
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
  
  // Convert standard ISO date (yyyy-mm-dd) to Chilean format (dd/mm/yyyy)
  const formatDate = (d: string) => {
    if (!d) return '';
    try {
      // Adding time to prevent timezone offset issues in parsing
      const date = new Date(d + 'T12:00:00');
      return date.toLocaleDateString('es-CL');
    } catch {
      return d;
    }
  };

  // ── ENCABEZADO AZUL ──────────────────────────────────────────
  doc.setFillColor(30, 58, 95); // navy
  doc.rect(0, 0, W, 38, 'F');

  // Logo placeholder
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

  // Badge FACTURA
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
    ['Cond. de pago:', data.paymentCondition],
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
    head: [['N°', 'Descripción del Servicio', 'Cantidad', 'Precio Neto', 'Total Neto']],
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

  // Caja totales
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

  // separador
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

  doc.save(`Factura_${data.invoiceNumber}.pdf`);
};
