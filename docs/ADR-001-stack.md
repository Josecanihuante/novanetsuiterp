# ADR 001: Selección de Stack Tecnológico

**Estado:** ACEPTADO
**Fecha:** 2025-03-10

## Contexto
El proyecto es un ERP Financiero local vía web, que agrupa altos volúmenes de datos transaccionales, además de ejecutar cálculos matemáticos complejos sobre más de 34 métricas de Balanced Scorecard y Pagos Provisionales Mensuales (PPM). Requiere una UI interactiva y rápida para mostrar variaciones y gráficos.

## Decisión
Se ha decidido implementar una arquitectura separada (Backend/Frontend) utilizando:
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, TanStack Query y Recharts.
- **Backend:** FastAPI, Python 3.12, SQLAlchemy, Pydantic v2.
- **Persistencia:** PostgreSQL 16.

## Consecuencias

### Positivas
- **Contrato Fuerte:** Python+Pydantic v2 junto con OpenAPI Swagger automático asegura que la documentación y la validación de payloads siempre estén actualizados.
- **Ecosistema Analítico:** Python es idóneo para incorporar posteriormente Machine Learning, Pandas u otras lógicas avanzadas en finanzas.
- **Interactividad UI:** React 18 ofrece renderizado óptimo y Recharts genera visualizaciones ricas out-of-the-box con Tailwind unificando el diseño.

### Negativas
- **Dos Runtimes:** Mantenimiento de contenedores/entornos separados (Node o V8 y CPython) y doble definición de tipado en interfaces entre el front y el back.

## Alternativas Descartadas
- **Next.js Fullstack:** Si bien soluciona el problema del runtime unificado, las robustas necesidades matemáticas y de scripts (como cálculos tributarios y dashboards densos de data) favorecen al ecosistema Python sobre Node.js puro sin perder velocidad de UI.
- **Django REST Framework:** Demasiado empaquetado y fuertemente acoplado. FastAPI con SQLAlchemy 2 soporta asincronía y se ajusta más a un patrón repositorio puro desacoplado.
