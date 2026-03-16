# Workflow: Revisión Técnica Pre-Deploy
# Comando: /review-tecnico
# Descripción: Auditoría completa de arquitectura, seguridad y calidad antes de producción

## Pasos

1. Verificar que el código nuevo sigue el patrón router → service → schema → model sin excepciones
2. Verificar que no hay lógica de negocio en los routers — solo llamadas al service layer
3. Verificar que todos los endpoints protegidos usan Depends(get_current_user)
4. Verificar que los permisos por rol están implementados en el service layer:
   - viewer: solo GET, debe retornar 403 en POST/PUT/DELETE
   - contador: GET + POST + PUT, debe retornar 403 en DELETE y en post de asientos
   - admin: acceso completo
5. Buscar credenciales o secrets hardcodeados en cualquier archivo del repositorio
6. Verificar que DATABASE_URL no está commiteada — solo en variables de entorno de Render
7. Verificar que los montos monetarios usan NUMERIC(18,2) y no float en modelos y schemas
8. Verificar que las nuevas tablas tienen UUID como PK, created_at y updated_at
9. Verificar que existe al menos un test por endpoint nuevo con escenarios: 200, 401, 403, 404
10. Verificar que el CHANGELOG.md o los commits siguen la convención feat:/fix:/docs:/chore:
11. Verificar que no se introdujeron dependencias nuevas en requirements.txt sin justificación
12. Ejecutar mentalmente el flujo completo: login → operación → respuesta → BD — ¿hay algún paso que pueda romper?
13. Generar review_report.md con:
    - Decisión final: GO / NO-GO / GO con advertencias
    - Blocking issues (impiden el deploy)
    - Warnings (corregir en próxima iteración)
    - Sugerencias opcionales
