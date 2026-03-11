# ADR-0001: Selección del Stack Tecnológico

## Estado: Aceptado
## Fecha: 2026-03-10

## Contexto
Se requiere construir un ERP Financiero local con capacidades de CRM, inventario, contabilidad y Scorecard. El sistema debe ser mantenible, escalable y permitir una integración fluida con datos de Oracle NetSuite (Excel).

## Decisión
Se ha seleccionado el siguiente stack tecnológico:
- **Frontend**: React 18 con TypeScript y Tailwind CSS. Se utilizará Zustand para la gestión de estado y Recharts para la visualización de datos.
- **Backend**: Python 3.12 con FastAPI para la API REST. Se utilizará SQLAlchemy como ORM y Alembic para migraciones.
- **Base de Datos**: PostgreSQL 16.
- **Autenticación**: JWT con OAuth2.

## Consecuencias
### Positivas
- Desarrollo rápido gracias a la naturaleza asíncrona de FastAPI y la productividad de React.
- Tipado fuerte en ambos lados (TypeScript y Pydantic) reduciendo errores.
- Ecosistema maduro de visualización (Recharts) para las 34 métricas del BSC.
- Facilidad de parsing de Excel con librerías de Python (pandas/openpyxl).

### Negativas
- Curva de aprendizaje inicial para el manejo de múltiples esquemas en PostgreSQL a través de SQLAlchemy.

## Alternativas consideradas
- **Django**: Descartado por ser menos ágil para una arquitectura SPA + API desacoplada, aunque provee más "out of the box".
- **Node.js (Next.js)**: Descartado para el backend debido a la potencia de las librerías de Python para cálculos financieros y procesamiento de datos Excel complejos.
