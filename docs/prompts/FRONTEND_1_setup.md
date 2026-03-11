# FRONTEND — Parte 1 de 3: Setup y Componentes Base

Proyecto: ERP Financiero. Crea el frontend React en la carpeta `frontend/`.

## Tarea 1 — Inicialización

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install tailwindcss axios zustand recharts react-router-dom react-hook-form @hookform/resolvers zod @tanstack/react-query lucide-react date-fns
```

Configura Tailwind con estos colores en tailwind.config.js:
```js
colors: {
  primary: '#1E3A5F',
  secondary: '#2E86AB',
  success: '#27AE60',
  danger: '#E74C3C',
  warning: '#E67E22',
  surface: '#F8FAFC',
}
```

## Tarea 2 — src/components/ui/

### Button.tsx
```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  isDisabled?: boolean
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
}
```
Estilos Tailwind por variant. ForwardRef. aria-busy cuando isLoading. Spinner inline.

### Input.tsx / Select.tsx
Siempre con label (htmlFor exacto). aria-describedby apuntando al mensaje de error. Border rojo cuando hay error. Placeholder en gris claro.

### Card.tsx
Props: title?, action?, children, footer?. Shadow-sm, border, rounded-lg.

### Badge.tsx
Variants: success (verde), danger (rojo), warning (naranja), neutral (gris). Texto pequeño uppercase.

### KPICard.tsx
```tsx
interface KPICardProps {
  name: string           // "Margen Neto"
  value: number | null   // 12.34
  unit: 'CLP' | '%' | 'x' | 'días'
  variation?: number     // variación % vs período anterior
  status: 'ok' | 'warning' | 'critical' | 'neutral'
  isLoading?: boolean
}
```
Layout: barra lateral de color (4px ancho) según status (verde/amarillo/rojo/gris). Nombre en gris pequeño. Valor en grande bold (color según status). Unidad en gris. Variación con flecha ↑ verde o ↓ roja + porcentaje. Skeleton cuando isLoading.

### DataTable.tsx
```tsx
interface Column<T> {
  key: keyof T
  header: string
  type: 'text' | 'number' | 'currency' | 'percent' | 'date' | 'badge'
  sortable?: boolean
}
interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  onRowClick?: (row: T) => void
}
```
Sort por columna. Búsqueda global (input arriba). Paginación (10/25/50 por página). Botón export CSV. Skeleton de filas cuando isLoading.

### FinancialTable.tsx
Tabla para estados financieros:
- Columna Concepto con padding-left acumulado según nivel (nivel 0: normal, nivel 1: pl-4, nivel 2: pl-8)
- Filas de subtotal/total en bold con bg-gray-50
- Columnas opcionales (toggle): Monto | % Vertical | Δ Absoluto | Δ%
- Valores negativos en texto rojo, positivos en negro
- Formato: CLP con punto separador de miles, sin decimales

### FileDropzone.tsx
Área drag & drop. Muestra ícono Upload y texto "Arrastra tu archivo .xlsx aquí". Valida extensión .xlsx y tamaño máximo 50MB. Muestra nombre del archivo cargado con botón X para quitar.

### Skeleton.tsx
Componentes: SkeletonKPI (rectangle con shimmer), SkeletonTable (filas con shimmer), SkeletonChart (rectangle alto).

## Tarea 3 — src/components/charts/

### LineChartWrapper.tsx
```tsx
interface Props {
  data: Record<string, any>[]
  xKey: string
  lines: { key: string; name: string; color: string }[]
  height?: number
  formatY?: (v: number) => string
}
```
Wrapper de Recharts LineChart. Tooltip con formato personalizable. ResponsiveContainer. Eje X con meses abreviados.

### BarChartWrapper.tsx
Similar a LineChart pero barras. Soporte multi-serie (barras agrupadas).

### GaugeChart.tsx
Usando Recharts RadialBarChart. Muestra valor actual sobre fondo con colores: verde (rango OK), amarillo (alerta), rojo (crítico). Props: value, min, max, okRange: [min,max], warningRange: [min,max].

### WaterfallChart.tsx
Para Estado de Resultados en cascada. Barras apiladas que muestran la transición de Ingresos → deducciones intermedias → Utilidad Neta. Barras azules para ingresos, rojas para deducciones, verdes para utilidades parciales.

## Tarea 4 — Layout principal

### src/components/layout/Sidebar.tsx
Fondo primary (#1E3A5F). Ancho 260px fijo. Logo arriba. Items con iconos lucide-react:
- Dashboard (LayoutDashboard)
- Balance Scorecard (BarChart3) — expandible con 6 sub-items
- Estados Financieros (FileText) — expandible con 4 sub-items
- Contabilidad (BookOpen)
- Facturación (Receipt)
- Clientes (Users)
- Inventario (Package)
- Importar NetSuite (Upload)
- PPM Chile (Calculator)
- Configuración (Settings)

Item activo: bg-white/20 text-white font-bold. Hover: bg-white/10.

### src/components/layout/Header.tsx
Fondo blanco, shadow-sm, altura 64px. Izquierda: selector mes (select 1-12) + año (input number). Centro: nombre empresa. Derecha: avatar + nombre usuario + botón logout.

### src/App.tsx
React Router con rutas privadas (redirigen a /login si no hay token en Zustand). Layout con Sidebar + Header + contenido.

Cuando termines avisa. No hagas aún las páginas.
