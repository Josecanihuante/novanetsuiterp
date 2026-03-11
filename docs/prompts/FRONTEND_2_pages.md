# FRONTEND — Parte 2 de 3: Páginas Principales

Proyecto: ERP Financiero. Los componentes base y el layout ya están creados. Crea ahora las páginas.

## src/pages/Dashboard.tsx
- Grid 4 columnas: 8 KPICards (Ingresos Netos, Margen Neto, EBITDA, Razón Corriente, Deuda/EBITDA, Free Cash Flow, Crecimiento Ventas, EVA)
- Debajo: LineChart con ingresos y utilidad neta de los últimos 12 meses (dos líneas)
- Responde al período del Header (mes/año)

## src/pages/BSC.tsx
- Tabs horizontales: Rentabilidad | Liquidez | Endeudamiento | Eficiencia | Ciclo Efectivo | Estratégico
- Dentro de cada tab: grid 3 columnas desktop / 2 tablet / 1 mobile de KPICards
- Métricas por perspectiva:
  - Rentabilidad: Utilidad Bruta, Margen Bruto, EBITDA, Margen EBITDA, EBIT, Margen Operativo, EBT, Utilidad Neta, Margen Neto, ROI, ROA, ROE, ROIC, Contribución Marginal
  - Liquidez: Capital de Trabajo, Capital de Trabajo Óptimo, Razón Corriente, Prueba Ácida, Solvencia CP, FCO, Free Cash Flow
  - Endeudamiento: Estructura Financiamiento, Deuda/Patrimonio, Deuda/Activos, Deuda/EBITDA, Cobertura Intereses, Leverage, Z Altman
  - Eficiencia: Rot. Activo Total, Rot. Capital Trabajo, Ventas/Empleado, Gasto Op./Ventas, Gasto Op. Diario
  - Ciclo Efectivo: Días CxC, Días Inventario, Días Proveedores, Ciclo de Efectivo
  - Estratégico: Punto de Equilibrio, Cobertura PE, ROI DuPont, EVA, Crecimiento Ventas
- Al hacer clic en KPICard: Drawer lateral con fórmula + LineChart histórico 12 meses + tabla de valores
- Botón "Exportar CSV" descarga todas las métricas

## src/pages/FinancialStatements.tsx
- Tabs: Estado de Resultados | Balance General | EFE | EOAF
- Selectores: período actual + período comparación
- Toggles: "Análisis vertical" y "Análisis horizontal"
- ER: FinancialTable + WaterfallChart debajo
- BG: FinancialTable secciones Activo / Pasivo / Patrimonio
- EFE: FinancialTable secciones Operaciones / Inversión / Financiamiento
- EOAF: FinancialTable secciones Fuentes / Usos
- Botón "Exportar Excel" en cada tab

## src/pages/Journal.tsx
- DataTable: número, fecha, glosa, fuente, estado (badge), débito total, crédito total
- Botón "Nuevo asiento" → Modal con:
  - Fecha + glosa
  - Tabla de líneas dinámica: Cuenta (autocomplete) | Débito | Crédito | Descripción | [×]
  - Botón "+ Agregar línea"
  - Indicador balance: muestra Σdébito - Σcrédito en tiempo real. Verde cuando = 0, rojo cuando ≠ 0
  - "Guardar borrador": siempre activo
  - "Contabilizar": solo activo cuando balance exactamente = 0
- En la tabla: badge "Borrador" con botón "Contabilizar" / badge "Contabilizado"

## src/pages/Invoices.tsx
- DataTable: número, tipo (badge), fecha, vencimiento, cliente/proveedor, total, estado (badge con color)
- Filtros: tipo, estado, rango fechas
- Botón "Nueva factura" → Modal:
  - Selector tipo (Venta / Compra / NC / ND)
  - Selector cliente o proveedor (según tipo)
  - Fecha + fecha vencimiento
  - Líneas: Producto (autocomplete) | Descripción | Cantidad | Precio | Descuento% | Subtotal
  - Totales automáticos: subtotal, IVA 19%, total
  - Botón "Preview" → muestra factura formateada

## src/pages/Customers.tsx
- DataTable: RUT, nombre, email, días pago, límite crédito, saldo pendiente
- Modal crear/editar con todos los campos
- Click en fila → panel derecho con tabs: Info general | Facturas | Saldo

## src/pages/Inventory.tsx
- DataTable: SKU, nombre, categoría, stock actual, costo, precio, método valuación
- Badge rojo "Stock bajo" si stock < punto de reorden
- Click en fila → panel derecho con LineChart de movimientos últimos 30 días
- Modal crear/editar producto

## src/pages/Import.tsx
**Paso 1:** FileDropzone con instrucciones de formato NetSuite esperado.

**Paso 2** (tras cargar archivo):
- DataTable preview de primeras 20 filas con columnas mapeadas
- Badge por fila: verde "Válido" / rojo "Error"
- Tabla de errores: Fila | Columna | Motivo
- Si hay errores: botón "Confirmar" deshabilitado con tooltip "Corrige los errores"
- Sin errores: botón "Confirmar importación" activo
- Durante importación: ProgressBar animada
- Resultado: "N asientos importados, K errores omitidos"

## src/pages/PPM.tsx
Layout 2 columnas:

**Columna izquierda:**
- Select mes (1-12) + input año
- Card configuración: régimen (select general/pro_pyme/presunta), tasa PPM %, RUT empresa
- Card resultado:
  - "Base imponible: $ X.XXX.XXX"
  - "Tasa aplicada: X.XX%"
  - "PPM a pagar: $ X.XXX.XXX" (grande, color primary)
- Accordion "Ver detalle del cálculo" → muestra pasos del servicio
- Alerta roja si is_suspended: "⚠️ Evaluar suspensión Art. 90 LIR — Existe pérdida tributaria acumulada. Consulte su asesor tributario."
- Botón "Exportar resumen F-29"

**Columna derecha:**
- BarChart: PPM mensual del año tributario
- DataTable: Mes | Ingresos | Tasa | PPM | Estado (badge pagado/pendiente) | Acumulado
- Fila "Total año" en bold al final

## src/pages/Login.tsx
Card centrada. Logo + título. Formulario: email + contraseña (zod validation). Error 401: "Credenciales incorrectas" en rojo bajo el form. Redirect al Dashboard tras éxito.

Cuando termines avisa. No hagas aún los hooks ni servicios API.
