# Skill: create_kpi_dashboard
# Uso: @developer-frontend + @developer-backend
# Invocar con: "usa la skill create_kpi_dashboard para el módulo [nombre]"
# ============================================================

## INSTRUCCIONES PARA EL AGENTE

Genera un dashboard KPI completo con endpoint de analytics en el backend
y componente de visualización en el frontend.

## PARTE 1 — Backend: endpoint de analytics

### backend/app/services/analytics_[module]_service.py
```python
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.commerce import Invoice  # adaptar al modelo del módulo

def get_[module]_kpis(db: Session, year: int = 2025) -> dict:
    """
    Retorna KPIs del módulo para el dashboard.
    Adaptar las queries al modelo específico.
    """
    # Total del año
    total_year = db.query(
        func.sum(Invoice.total)
    ).filter(
        extract('year', Invoice.invoice_date) == year,
        Invoice.status.in_(['paid', 'issued'])
    ).scalar() or 0

    # Por mes (para gráfico de barras)
    monthly = db.query(
        extract('month', Invoice.invoice_date).label('month'),
        func.sum(Invoice.total).label('total'),
        func.count(Invoice.id).label('count')
    ).filter(
        extract('year', Invoice.invoice_date) == year
    ).group_by('month').order_by('month').all()

    # Comparativa vs año anterior
    total_prev_year = db.query(
        func.sum(Invoice.total)
    ).filter(
        extract('year', Invoice.invoice_date) == year - 1,
        Invoice.status.in_(['paid', 'issued'])
    ).scalar() or 0

    growth_pct = 0
    if total_prev_year > 0:
        growth_pct = round(((total_year - total_prev_year) / total_prev_year) * 100, 1)

    return {
        "total_year": float(total_year),
        "total_prev_year": float(total_prev_year),
        "growth_pct": growth_pct,
        "monthly": [
            {
                "month": int(r.month),
                "month_name": get_month_name(int(r.month)),
                "total": float(r.total),
                "count": int(r.count)
            }
            for r in monthly
        ],
        "top_clients": get_top_clients(db, year),  # implementar si aplica
    }

def get_month_name(month: int) -> str:
    names = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
    return names[month - 1]
```

### backend/app/routers/analytics.py (agregar endpoint)
```python
@router.get("/[module]/kpis")
def get_[module]_kpis(
    year: int = Query(2025, ge=2020, le=2030),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return analytics_[module]_service.get_[module]_kpis(db, year)
```

## PARTE 2 — Frontend: componentes del dashboard

### frontend/src/components/charts/KpiCard.tsx
```typescript
interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;      // porcentaje de cambio vs período anterior
  color?: 'blue' | 'green' | 'orange' | 'red';
}

export const KpiCard = ({ title, value, subtitle, trend, color = 'blue' }: KpiCardProps) => {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-xs mt-1 opacity-60">{subtitle}</p>}
      {trend !== undefined && (
        <p className={`text-sm mt-2 font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs año anterior
        </p>
      )}
    </div>
  );
};
```

### frontend/src/components/charts/MonthlyBarChart.tsx
```typescript
// Usa recharts (ya disponible en el proyecto)
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyData {
  month_name: string;
  total: number;
  count: number;
}

export const MonthlyBarChart = ({ data }: { data: MonthlyData[] }) => {
  const formatCLP = (value: number) =>
    `$${(value / 1_000_000).toFixed(1)}M`;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month_name" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatCLP} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value: number) => [`$${value.toLocaleString('es-CL')}`, 'Total']}
        />
        <Bar dataKey="total" fill="#2E86AB" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
```

### frontend/src/hooks/use[Module]Kpis.ts
```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';

interface [Module]Kpis {
  total_year: number;
  total_prev_year: number;
  growth_pct: number;
  monthly: { month: number; month_name: string; total: number; count: number }[];
}

export const use[Module]Kpis = (year = 2025) => {
  const [data, setData]       = useState<[Module]Kpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiClient.get(`/analytics/[module]/kpis?year=${year}`)
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [year]);

  return { data, loading, error };
};
```

### frontend/src/pages/dashboard/[Module]Dashboard.tsx
```typescript
import { use[Module]Kpis } from '@/hooks/use[Module]Kpis';
import { KpiCard } from '@/components/charts/KpiCard';
import { MonthlyBarChart } from '@/components/charts/MonthlyBarChart';

export const [Module]DashboardPage = () => {
  const { data, loading } = use[Module]Kpis(2025);

  const formatCLP = (n: number) =>
    `$${n.toLocaleString('es-CL')}`;

  if (loading) return <div className="p-6 text-gray-500">Cargando KPIs...</div>;
  if (!data)   return <div className="p-6 text-red-500">Error al cargar datos</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard [Module]</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Total Año 2025"
          value={formatCLP(data.total_year)}
          trend={data.growth_pct}
          color="blue"
        />
        <KpiCard
          title="Año Anterior"
          value={formatCLP(data.total_prev_year)}
          color="green"
        />
        <KpiCard
          title="Crecimiento"
          value={`${data.growth_pct}%`}
          color={data.growth_pct >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Gráfico mensual */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Evolución Mensual 2025</h2>
        <MonthlyBarChart data={data.monthly} />
      </div>
    </div>
  );
};
```
