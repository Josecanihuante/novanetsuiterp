# BACKEND — Parte 2 de 3: Servicios

Proyecto: ERP Financiero. El setup y los modelos ya están creados. Crea ahora los servicios.

## backend/app/services/bsc_service.py

Una función por métrica. Recibe dict con datos del período. Retorna float o None (nunca lanza excepción).

```python
def safe_div(a, b):
    return None if not b else a / b

# PERSPECTIVA 1 — Rentabilidad
def utilidad_bruta(d): return d["ingresos"] - d["costo_ventas"]
def margen_bruto(d): return safe_div(utilidad_bruta(d), d["ingresos"]) * 100
def ebit(d): return utilidad_bruta(d) - d["gastos_operativos"]
def ebitda(d): return ebit(d) + d["depreciacion"] + d["amortizacion"]
def margen_ebitda(d): return safe_div(ebitda(d), d["ingresos"]) * 100
def margen_operativo(d): return safe_div(ebit(d), d["ingresos"]) * 100
def ebt(d): return ebit(d) - d["gastos_financieros"]
def utilidad_neta(d): return ebt(d) - d["impuesto_renta"]
def margen_neto(d): return safe_div(utilidad_neta(d), d["ingresos"]) * 100
def roi(d): return safe_div(d["ganancia"] - d["inversion"], d["inversion"]) * 100
def roa(d): return safe_div(utilidad_neta(d), d["activos_totales"]) * 100
def roe(d): return safe_div(utilidad_neta(d), d["patrimonio"]) * 100
def roic(d): return safe_div(d["nopat"], d["capital_invertido"]) * 100
def contribucion_marginal(d): return d["ingresos"] - d["costos_variables"]

# PERSPECTIVA 2 — Liquidez
def capital_trabajo(d): return d["activo_corriente"] - d["pasivo_corriente"]
def razon_corriente(d): return safe_div(d["activo_corriente"], d["pasivo_corriente"])
def prueba_acida(d): return safe_div(d["activo_corriente"] - d["inventario"], d["pasivo_corriente"])
def solvencia_cp(d): return safe_div(d["efectivo"], d["pasivo_corriente"]) * 100
def free_cash_flow(d): return d["fco"] - d["capex"]

# PERSPECTIVA 3 — Endeudamiento
def estructura_financiamiento(d): return safe_div(d["deuda_total"], d["deuda_total"] + d["patrimonio"]) * 100
def deuda_patrimonio(d): return safe_div(d["pasivo_total"], d["patrimonio"])
def deuda_activos(d): return safe_div(d["pasivo_total"], d["activo_total"]) * 100
def deuda_ebitda(d): return safe_div(d["deuda_financiera_neta"], ebitda(d))
def cobertura_intereses(d): return safe_div(ebit(d), d["gastos_intereses"])
def leverage(d): return safe_div(d["activo_total"], d["patrimonio"])
def z_altman(d):
    a = d["activo_total"]
    if not a: return None
    return (1.2*(d["capital_trabajo"]/a) + 1.4*(d["utilidades_retenidas"]/a) +
            3.3*(ebit(d)/a) + 0.6*(d["valor_mercado"]/d["pasivo_total"]) + d["ingresos"]/a)

# PERSPECTIVA 4 — Eficiencia
def rot_activo_total(d): return safe_div(d["ingresos"], d["activos_totales"])
def rot_capital_trabajo(d): return safe_div(d["ingresos"], capital_trabajo(d))
def ventas_empleado(d): return safe_div(d["ingresos"], d["num_empleados"])
def gasto_op_ventas(d): return safe_div(d["gastos_operativos"], d["ingresos"]) * 100
def gasto_op_diario(d): return safe_div(d["gastos_operativos"], d["dias_periodo"])

# PERSPECTIVA 5 — Ciclo de Efectivo
def dias_cxc(d): return safe_div(d["cuentas_cobrar"], safe_div(d["ingresos"], 360))
def dias_inventario(d): return safe_div(d["inventario"], safe_div(d["cmv"], 360))
def dias_proveedores(d): return safe_div(d["cuentas_pagar"], safe_div(d["cmv"], 360))
def ciclo_efectivo(d): return (dias_cxc(d) or 0) + (dias_inventario(d) or 0) - (dias_proveedores(d) or 0)

# PERSPECTIVA 6 — Estratégico
def punto_equilibrio(d): return safe_div(d["costos_fijos"], d["margen_contribucion_unitario"])
def cobertura_pe(d): return safe_div(d["ventas_reales"], d["ventas_pe"]) * 100
def roi_dupont(d):
    mn = margen_neto(d); ra = rot_activo_total(d); lev = leverage(d)
    return None if None in (mn, ra, lev) else mn * ra * lev
def eva(d): return d["nopat"] - (d["wacc"] * d["capital_invertido"])
def crecimiento_ventas(d): return safe_div(d["ventas_actual"] - d["ventas_anterior"], d["ventas_anterior"]) * 100
```

## backend/app/services/financial_service.py

Genera los 4 estados financieros desde journal_lines agrupadas por account.type/subtype.

- **Estado de Resultados**: Ingresos → CMV → Utilidad Bruta → Gastos Op. → EBIT → Gastos Fin. → EBT → Impuesto → Utilidad Neta. Análisis vertical: línea/ingresos×100. Análisis horizontal: valor_actual - valor_anterior y %.
- **Balance General**: Activo Corriente + Activo No Corriente = Pasivo Corriente + Pasivo No Corriente + Patrimonio. Vertical: línea/activo_total×100. Horizontal igual.
- **EFE**: Secciones Operaciones / Inversión / Financiamiento. Solo análisis horizontal.
- **EOAF**: Fuentes y Usos. Sin análisis adicional.

## backend/app/services/ppm_service.py

```python
def calcular_ppm(mes, anio, ingresos_brutos, config, tax_anterior):
    if config.tax_regime == 'pro_pyme':
        tasa = 0.0025
    elif tax_anterior is None:
        tasa = 0.01
    else:
        tasa = tax_anterior.first_category_tax / tax_anterior.gross_income
        tasa = min(tasa, 0.05)  # tope 5% Art. 84

    suspendido = bool(tax_anterior and tax_anterior.accumulated_loss > 0)
    monto = 0 if suspendido else round(ingresos_brutos * tasa, 0)

    return {
        "period_month": mes, "period_year": anio,
        "gross_income": ingresos_brutos, "ppm_rate": tasa,
        "ppm_amount": monto, "is_suspended": suspendido,
        "suspension_reason": "Pérdida tributaria acumulada Art. 90 LIR" if suspendido else None,
        "detalle": [
            f"Ingresos brutos del mes: ${ingresos_brutos:,.0f}",
            f"Régimen tributario: {config.tax_regime}",
            f"Tasa PPM aplicada: {tasa*100:.4f}%",
            f"PPM calculado: ${monto:,.0f}",
        ]
    }
```

## backend/app/services/netsuite_service.py

```python
COLUMNAS = ["Account","Account Name","Type","Date","Document Number",
            "Name","Memo","Debit","Credit","Amount","Currency",
            "Subsidiary","Department","Class"]

TIPO_MAP = {"Income":"income","Expense":"expense","Asset":"asset",
            "Liability":"liability","Equity":"equity"}

def parse_netsuite_excel(file_bytes):
    wb = load_workbook(BytesIO(file_bytes))
    ws = wb.active
    headers = [c.value for c in ws[1]]
    # validar columnas
    faltantes = [c for c in COLUMNAS if c not in headers]
    if faltantes:
        raise ValueError(f"Columnas faltantes: {faltantes}")

    valid_rows, errors = [], []
    for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        r = dict(zip(headers, row))
        row_errors = []
        # validar Date MM/DD/YYYY
        try:
            fecha = datetime.strptime(str(r["Date"]), "%m/%d/%Y").date()
        except:
            row_errors.append({"row": i, "column": "Date", "message": "Formato de fecha inválido. Use MM/DD/YYYY"})
            fecha = None
        # validar Debit numérico
        try:
            debito = float(r["Debit"] or 0)
        except:
            row_errors.append({"row": i, "column": "Debit", "message": "El valor de Debit debe ser numérico"})
            debito = None
        # validar Credit numérico
        try:
            credito = float(r["Credit"] or 0)
        except:
            row_errors.append({"row": i, "column": "Credit", "message": "El valor de Credit debe ser numérico"})
            credito = None

        if row_errors:
            errors.extend(row_errors)
        else:
            valid_rows.append({
                "account_code": r["Account"], "account_name": r["Account Name"],
                "account_type": TIPO_MAP.get(r["Type"], "expense"),
                "date": fecha, "document_number": r["Document Number"],
                "entity_name": r["Name"], "description": r["Memo"],
                "debit": debito, "credit": credito,
                "currency": r["Currency"], "subsidiary": r["Subsidiary"],
            })
    return {"valid_rows": valid_rows, "errors": errors}
```

Cuando termines avisa. No hagas aún los routers.
