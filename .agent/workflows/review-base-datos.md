# Workflow: Auditoría de Base de Datos
# Comando: /review-base-datos
# Descripción: Realiza una auditoría completa del esquema, queries y configuración de BD

## Pasos

1. Revisar el esquema completo de la base de datos:
   - Verificar que todas las tablas tienen columnas de auditoría (created_at, updated_at, deleted_at)
   - Identificar columnas que deberían tener constraints (NOT NULL, UNIQUE, CHECK) y no los tienen
   - Detectar claves foráneas sin índice correspondiente
2. Analizar las queries más frecuentes o lentas:
   - Buscar `SELECT *` en código de producción
   - Identificar queries sin `LIMIT` que podrían traer millones de filas
   - Detectar posibles N+1 en el ORM
3. Revisar las migraciones existentes:
   - Verificar que todas tienen comentario de rollback
   - Detectar migraciones que modifican datos en lugar de solo esquema
4. Revisar la configuración de índices:
   - Identificar índices faltantes en columnas de búsqueda frecuente
   - Detectar índices duplicados o nunca usados
5. Verificar aspectos de seguridad:
   - ¿Hay contraseñas o datos sensibles almacenados en texto plano?
   - ¿El usuario de la aplicación tiene privilegios excesivos?
6. Generar reporte con:
   - Problemas de esquema encontrados
   - Queries que requieren optimización con estimación de impacto
   - Índices recomendados con justificación
   - Riesgos de seguridad identificados
   - Scripts SQL de corrección para los issues encontrados
