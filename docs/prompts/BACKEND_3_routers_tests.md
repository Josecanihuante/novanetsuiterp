# BACKEND — Parte 3 de 3: Routers y Tests

Proyecto: ERP Financiero. Setup, modelos y servicios ya están creados. Crea ahora los routers y tests.

## Routers en backend/app/api/v1/

JWT obligatorio en todos excepto POST /auth/login.
RBAC: admin=todo, contador=GET+POST+PUT, viewer=solo GET.
Todas las respuestas siguen: `{"success": true, "data": ...}` o `{"success": false, "error": {"code": "...", "message": "..."}}`

### auth.py
- POST /auth/login → verifica credenciales, retorna access_token + refresh_token
- POST /auth/refresh → renueva access_token con refresh_token válido
- POST /auth/logout → invalida refresh_token

### bsc.py
- GET /bsc/metrics?period_id= → calcula y retorna las 34 métricas agrupadas por perspectiva
- GET /bsc/snapshot → retorna último snapshot guardado en bsc_snapshots

### financial.py
- GET /financial/income-statement?period_id=&compare_period_id= → ER con análisis vertical y horizontal
- GET /financial/balance-sheet?period_id=&compare_period_id= → BG con análisis
- GET /financial/cash-flow?period_id=&compare_period_id= → EFE
- GET /financial/source-use?period_id= → EOAF

### accounts.py
- GET /accounts → lista paginada (page, size)
- POST /accounts → crear cuenta
- GET /accounts/{id} → detalle
- PUT /accounts/{id} → editar
- DELETE /accounts/{id} → soft delete (deleted_at = NOW())
- GET /accounts/tree → árbol jerárquico completo del plan de cuentas

### journal.py
- GET /journal/entries → lista paginada con filtros (period_id, is_posted, date_from, date_to)
- POST /journal/entries → crear asiento borrador (valida que sum(debit) == sum(credit))
- GET /journal/entries/{id} → detalle con líneas
- PUT /journal/entries/{id} → editar (solo si is_posted=false)
- PATCH /journal/entries/{id}/post → contabilizar (cambia is_posted=true, no reversible)

### import_netsuite.py
- POST /import/netsuite/preview → recibe archivo .xlsx (multipart), retorna preview con valid_rows y errors
- POST /import/netsuite/confirm → recibe el batch previamente validado, inserta en journal_entries

### invoices.py
- GET /invoices → lista paginada con filtros (type, status, date_from, date_to)
- POST /invoices → crear factura (calcula IVA 19% automáticamente)
- GET /invoices/{id} → detalle con líneas
- PUT /invoices/{id} → editar (solo si status=draft)
- PATCH /invoices/{id}/issue → emitir (draft → issued)

### customers.py
- GET /customers → lista paginada
- POST /customers → crear cliente
- GET /customers/{id} → detalle
- PUT /customers/{id} → editar
- DELETE /customers/{id} → soft delete
- GET /customers/{id}/invoices → historial de facturas del cliente

### inventory.py
- GET /products → lista paginada con filtro por categoría y alerta de stock bajo
- POST /products → crear producto
- GET /products/{id} → detalle
- PUT /products/{id} → editar
- DELETE /products/{id} → soft delete
- GET /stock/movements?product_id= → movimientos de stock
- POST /stock/movements → registrar movimiento manual

### taxes.py
- GET /taxes/ppm/config → retorna configuración tributaria activa
- PUT /taxes/ppm/config → actualiza configuración (regime, tasa, RUT)
- POST /taxes/ppm/calculate → calcula PPM del mes/año enviado
- GET /taxes/ppm/history?year= → historial de PPM del año tributario

## Tests en backend/tests/

### test_bsc_service.py
```python
import pytest
from app.services.bsc_service import *

BASE = {
    "ingresos": 1_000_000, "costo_ventas": 600_000,
    "gastos_operativos": 150_000, "depreciacion": 20_000,
    "amortizacion": 10_000, "gastos_financieros": 30_000,
    "impuesto_renta": 54_000, "activos_totales": 2_000_000,
    "patrimonio": 800_000, "pasivo_total": 1_200_000,
    "activo_corriente": 500_000, "pasivo_corriente": 300_000,
    "inventario": 100_000, "efectivo": 150_000,
    "costos_variables": 400_000, "fco": 180_000, "capex": 50_000,
    "deuda_total": 900_000, "deuda_financiera_neta": 750_000,
    "gastos_intereses": 30_000, "activo_total": 2_000_000,
    "valor_mercado": 1_500_000, "utilidades_retenidas": 200_000,
    "capital_trabajo": 200_000, "nopat": 136_000,
    "capital_invertido": 1_400_000, "wacc": 0.08,
    "num_empleados": 50, "dias_periodo": 30,
    "cuentas_cobrar": 200_000, "cuentas_pagar": 150_000,
    "cmv": 600_000, "costos_fijos": 100_000,
    "margen_contribucion_unitario": 2500, "ventas_reales": 1_000_000,
    "ventas_pe": 700_000, "inversion": 500_000, "ganancia": 650_000,
    "ventas_actual": 1_000_000, "ventas_anterior": 850_000,
}

def test_utilidad_bruta(): assert utilidad_bruta(BASE) == 400_000
def test_margen_bruto(): assert margen_bruto(BASE) == pytest.approx(40.0)
def test_ebit(): assert ebit(BASE) == 250_000
def test_ebitda(): assert ebitda(BASE) == 280_000
def test_utilidad_neta(): assert utilidad_neta(BASE) == pytest.approx(136_000)
def test_roa(): assert roa(BASE) == pytest.approx(6.8)
def test_roe(): assert roe(BASE) == pytest.approx(17.0)
def test_razon_corriente(): assert razon_corriente(BASE) == pytest.approx(1.6667, rel=1e-3)
def test_prueba_acida(): assert prueba_acida(BASE) == pytest.approx(1.3333, rel=1e-3)
def test_free_cash_flow(): assert free_cash_flow(BASE) == 130_000
def test_ciclo_efectivo():
    resultado = ciclo_efectivo(BASE)
    assert resultado is not None

# Division por cero retorna None
def test_margen_bruto_ingresos_cero():
    d = {**BASE, "ingresos": 0}
    assert margen_bruto(d) is None

def test_razon_corriente_pasivo_cero():
    d = {**BASE, "pasivo_corriente": 0}
    assert razon_corriente(d) is None

def test_roe_patrimonio_cero():
    d = {**BASE, "patrimonio": 0}
    assert roe(d) is None
```

### test_ppm_service.py
```python
from app.services.ppm_service import calcular_ppm

class MockConfig:
    def __init__(self, regime): self.tax_regime = regime

class MockTax:
    def __init__(self, impuesto, ingresos, perdida=0):
        self.first_category_tax = impuesto
        self.gross_income = ingresos
        self.accumulated_loss = perdida

def test_pro_pyme():
    r = calcular_ppm(3, 2025, 1_000_000, MockConfig("pro_pyme"), None)
    assert r["ppm_rate"] == pytest.approx(0.0025)
    assert r["ppm_amount"] == 2_500

def test_sin_historia():
    r = calcular_ppm(3, 2025, 1_000_000, MockConfig("general"), None)
    assert r["ppm_rate"] == pytest.approx(0.01)

def test_general_tasa_normal():
    tax = MockTax(impuesto=25_000, ingresos=1_000_000)
    r = calcular_ppm(3, 2025, 500_000, MockConfig("general"), tax)
    assert r["ppm_rate"] == pytest.approx(0.025)
    assert r["ppm_amount"] == 12_500

def test_general_tope_5_porciento():
    tax = MockTax(impuesto=80_000, ingresos=1_000_000)  # tasa=8% > tope
    r = calcular_ppm(3, 2025, 500_000, MockConfig("general"), tax)
    assert r["ppm_rate"] == pytest.approx(0.05)

def test_suspension_art90():
    tax = MockTax(impuesto=20_000, ingresos=1_000_000, perdida=500_000)
    r = calcular_ppm(3, 2025, 1_000_000, MockConfig("general"), tax)
    assert r["is_suspended"] is True
    assert r["ppm_amount"] == 0
```

### test_financial_service.py
```python
def test_ecuacion_contable():
    # Con datos de prueba completos
    resultado = financial_service.get_balance_sheet(db, period_id)
    total_activo = resultado["activo_corriente_total"] + resultado["activo_no_corriente_total"]
    total_pasivo_patrimonio = (resultado["pasivo_corriente_total"] +
                               resultado["pasivo_no_corriente_total"] +
                               resultado["patrimonio_total"])
    assert abs(total_activo - total_pasivo_patrimonio) < 0.01
```

### test_netsuite_service.py
Crea fixture de Excel en memoria con openpyxl: 5 filas válidas + 1 con Debit no numérico + 1 con Date en formato YYYY-MM-DD. Verifica que valid_rows=5 y errors=2.
