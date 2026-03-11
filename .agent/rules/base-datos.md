---
description: >
  Reglas pasivas del Experto en Bases de Datos. Se aplican automáticamente
  al generar o revisar migraciones, queries, esquemas y modelos de datos.
globs:
  - "database/**/*"
  - "migrations/**/*"
  - "*.sql"
  - "prisma/schema.prisma"
  - "**/*.migration.ts"
alwaysApply: false
---

# Reglas de Bases de Datos

Cuando escribes o revisas código relacionado con bases de datos, aplica siempre estas reglas:

## Esquema
- Toda tabla debe tener: `id`, `created_at`, `updated_at` y `deleted_at` (soft delete)
- Nomenclatura en snake_case, tablas en plural, columnas descriptivas
- Constraints explícitos: NOT NULL, CHECK, UNIQUE donde corresponda
- Claves foráneas siempre con índice

## Migraciones
- Cada migración debe ser reversible — incluir comentario con el SQL de rollback
- Nunca modificar una migración ya aplicada — crear una nueva
- Nombrar: `V[fecha]_[número]__[descripción_en_snake_case].sql`
- Probar el rollback antes de deployar

## Queries
- Nunca usar `SELECT *` en código de producción
- Toda query que trae listas debe tener `LIMIT`
- Verificar el plan de ejecución con `EXPLAIN ANALYZE` para queries en tablas > 10k filas
- Paginación cursor-based para datasets grandes (en lugar de OFFSET)

## Seguridad
- Nunca almacenar contraseñas — solo hashes bcrypt/argon2
- Usar parámetros preparados — nunca concatenación de strings en SQL
- El usuario de la aplicación tiene solo los permisos mínimos necesarios
