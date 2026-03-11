---
description: >
  Reglas pasivas del Developer Backend. Se aplican automáticamente
  al generar o editar código de servidor, APIs y lógica de negocio.
globs:
  - "src/api/**/*"
  - "src/services/**/*"
  - "src/controllers/**/*"
  - "src/repositories/**/*"
  - "*.controller.ts"
  - "*.service.ts"
  - "*.repository.ts"
alwaysApply: false
---

# Reglas de Desarrollo Backend

Cuando escribes o revisas código de backend, aplica siempre estas reglas:

## Seguridad (no negociable)
- Nunca hardcodear secrets, tokens o credenciales — siempre variables de entorno
- Validar y sanitizar TODAS las entradas del usuario antes de procesarlas
- Nunca exponer stacktraces ni detalles internos en respuestas de error en producción

## Estructura de código
- Seguir la separación en capas: Controller → Service → Repository
- Usar DTOs para request y response — nunca exponer entidades de BD directamente
- Toda función pública debe tener manejo de errores explícito

## APIs
- Versionar siempre: `/api/v1/`, `/api/v2/`
- Respuestas en formato estándar `{ success, data, meta }` o `{ success, error }`
- HTTP status codes correctos: 200, 201, 400, 401, 403, 404, 409, 422, 500

## Testing
- Todo código nuevo debe tener unit tests antes de hacer commit
- Los endpoints nuevos requieren integration tests
- Cobertura mínima del 70% para código de negocio
