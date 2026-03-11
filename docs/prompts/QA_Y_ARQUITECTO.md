# QA — Auditoría de Calidad

Proyecto: ERP Financiero. El sistema ya está construido. Ejecuta la auditoría completa.

## Tarea 1 — Completar test_bsc_service.py
Verifica que hay tests para las 34 métricas. Por cada métrica faltante crea:
- Test con valores conocidos que verifica resultado exacto
- Test con denominador = 0 (debe retornar None, nunca ZeroDivisionError)

Las 34 métricas: utilidad_bruta, margen_bruto, ebitda, margen_ebitda, ebit, margen_operativo, ebt, utilidad_neta, margen_neto, roi, roa, roe, roic, contribucion_marginal, capital_trabajo, capital_trabajo_optimo, razon_corriente, prueba_acida, solvencia_cp, fco, free_cash_flow, estructura_financiamiento, deuda_patrimonio, deuda_activos, deuda_ebitda, cobertura_intereses, leverage, z_altman, rot_activo_total, rot_capital_trabajo, ventas_empleado, gasto_op_ventas, gasto_op_diario, dias_cxc, dias_inventario, dias_proveedores, ciclo_efectivo, punto_equilibrio, cobertura_pe, roi_dupont, eva, crecimiento_ventas.

## Tarea 2 — Verificar test_ppm_service.py
Los 5 casos deben estar: pro_pyme (0.25%), sin historia (1%), general normal, general tope 5%, suspensión Art.90.

## Tarea 3 — Crear test_netsuite_service.py
Fixture Excel en memoria con openpyxl: 5 filas válidas + 1 con Debit no numérico + 1 con Date en formato YYYY-MM-DD. Verifica valid_rows=5 y errors=2.

## Tarea 4 — Crear frontend/src/utils/formatters.test.ts
Tests para formatCLP, formatPercent, formatRatio, getVariationColor. Incluir: valor cero, negativo, null retorna '—'.

## Tarea 5 — Crear frontend/e2e/ con Playwright

auth.spec.ts: login exitoso → redirect dashboard. Login incorrecto → mensaje error. Logout → redirect login.

bsc.spec.ts: login → ir a BSC → verificar 6 tabs → KPICards tienen valores → cambiar tab.

ppm.spec.ts: login → ir a PPM → seleccionar mes/año → verificar monto calculado y tabla histórica.

import.spec.ts: login → ir a Import → cargar Excel → verificar preview → verificar tabla errores.

## Tarea 6 — Verificar errores de API
Comprueba que los endpoints retornan el formato correcto:
- ID inexistente → 404 `{"success": false, "error": {"code": "NOT_FOUND", "message": "..."}}`
- Body inválido → 422 `{"success": false, "error": {"code": "VALIDATION_ERROR", ...}}`
- Sin JWT → 401 `{"success": false, "error": {"code": "UNAUTHORIZED", ...}}`
Si alguno falla, corrige el exception handler en backend/app/main.py.

## Tarea 7 — Generar docs/QA_Report.md
Incluir: cobertura por módulo, lista de casos creados, issues encontrados (ID, descripción, severidad), recomendación Go/No-Go.

---

# ARQUITECTO — Revisión Final

Proyecto: ERP Financiero. El sistema ya está construido. Ejecuta la revisión de cierre.

## Tarea 1 — Ejecutar /review-arquitectura
Evalúa: separación de capas, acoplamientos, schemas de BD, testabilidad, puntos de falla.

## Tarea 2 — Verificar capas backend
Routers: solo reciben request, validan, llaman servicio, retornan response.
Servicios: lógica de negocio, llaman repositorios.
Repositorios: solo queries SQLAlchemy.
Reporta cualquier violación encontrada.

## Tarea 3 — Crear docs/ADR-001-stack.md
Estado: ACEPTADO. Contexto: ERP financiero web local con cálculos complejos. Decisión: React 18 + FastAPI + PostgreSQL. Consecuencias positivas: OpenAPI automático, Pydantic v2, Recharts maduro, Python ideal para cálculos. Negativas: dos runtimes. Alternativas descartadas: Next.js fullstack, Django REST.

## Tarea 4 — Crear docs/ADR-002-database.md
Estado: ACEPTADO. Contexto: datos contables con ACID obligatorio. Decisión: PostgreSQL 16 con 6 schemas separados. Positivo: ACID completo, schemas por dominio, funciones de ventana. Negativo: requiere Docker. Descartados: MySQL, SQLite.

## Tarea 5 — Crear docs/ADR-003-migrations.md
Estado: ACEPTADO. Decisión: Alembic con upgrade() y rollback documentado en comentarios de cada migración.

## Tarea 6 — Crear docs/ARCHITECTURE.md
Diagrama C4 en Mermaid con: Usuario → React SPA → FastAPI → PostgreSQL. Incluir los servicios clave (BSC, PPM, NetSuite).

## Tarea 7 — Crear docs/TECH_DEBT.md
Identifica deuda técnica. Ítems típicos: falta caché en BSC (recalcula cada request), falta rate limiting en importación, falta paginación en algún endpoint, WACC hardcodeado.

## Tarea 8 — Verificar y completar README.md
Debe tener: requisitos previos, setup en 5 pasos (clonar, docker-compose up, backend setup, frontend setup, acceder). Credenciales por defecto para desarrollo.

## Tarea 9 — Generar docs/ARCH_REVIEW_FINAL.md
Incluir: resumen ejecutivo, fortalezas, riesgos con severidad, issues de arquitectura, deuda técnica destacada, veredicto GO/NO-GO con justificación.
