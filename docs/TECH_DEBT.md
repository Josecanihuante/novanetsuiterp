# Deuda Técnica a Corto y Medio Plazo (Tech Debt)

Detectadas y documentadas durante la auditoría arquitectónica inicial:

## 1. Falta de Caché en BSC Service
- **Descripción:** El servicio que calcula las 34 métricas del Balanced Scorecard consulta agresivamente cada partida de balance y reconstruye los estados per request (`/bsc/metrics`).
- **Impacto:** Alto consumo de CPU para meses históricos idénticos. 
- **Solución Propuesta:** Utilizar `Redis` para cachear los dict de parámetros para períodos ya cerrados financieramente o incorporar un decorador LRU y `Cache-Control` inmutables desde FastAPI para meses sellados.

## 2. Paginación en Endpoints Críticos
- **Descripción:** Los reportes de transacciones e historial contable están devolviendo colecciones completas en arreglos JSON directos sin offset y sin metadatos extendidos. 
- **Impacto:** Lentitud potencial en la tabla `DataTable` si se alcanzan >5000 transacciones y uso de memoria no límite.
- **Solución Propuesta:** Instaurar `fastapi-pagination` o patrón depend-offset en los listados contables críticos. (Frontend ya contempla envío de size y pages).

## 3. Límite de Tasa (Rate Limiting) en Importación NetSuite
- **Descripción:** El importador multi-part de openpyxl sube el archivo directo a la memoria del FastApi/Worker y lo procesa inline.
- **Impacto:** Archivos de >100MB podrían provocar un ataque DoS o timeout matando el thread de Uvicorn/Gunicorn.
- **Solución Propuesta:** Agregar `Celery` o `BackgroundTasks` para ingesta asíncrona en CSV/Excel voluminosos, y `slowapi` limitando peticiones.

## 4. Hardcoding de Tasas Financieras Auxiliares
- **Descripción:** Variables como `WACC` o promedios estáticos en los test están harcodeados en el Backend.
- **Impacto:** Difícil actualización al inicio del año tributario nuevo.
- **Solución Propuesta:** Módulo de 'Configuraciones Globales' leída de DB / Config y administrable vía UI.

## 5. Pruebas End-to-End
- **Descripción:** Frontend posee estructura Playwright lista. Falta CI/CD GitHub Actions que lance PostgreSQL de sidecar, aplique migrations, y corra e2e.
- **Impacto:** Discrepancia del "funciona en mi local".
