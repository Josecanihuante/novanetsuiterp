# Workflow: Nueva Feature End-to-End
# Comando: /nueva-feature
# Descripción: Pipeline completo desde idea hasta deploy para una nueva funcionalidad del ERP

## Pasos

1. Ejecutar /product-prd para definir el PRD, user stories y criterios de aceptación
2. Revisar con el equipo que el PRD está aprobado antes de continuar — no avanzar sin aprobación
3. Ejecutar /review-arquitectura para validar que la feature encaja en la arquitectura actual
4. Si requiere tabla nueva: ejecutar /review-base-datos para diseñar el schema y la migración Alembic
5. Ejecutar /review-backend para implementar: model → schema → service → router
6. Ejecutar /review-frontend para implementar: service → hook → componentes → página
7. Ejecutar /review-qa para generar el plan de pruebas y verificar cobertura mínima del 60%
8. Corregir todos los bugs encontrados en el paso 7 — no avanzar con bugs de severidad Alta o Crítica
9. Ejecutar /review-tecnico para la auditoría pre-deploy — obtener decisión GO
10. Si el resultado es NO-GO: corregir los blocking issues y volver al paso 9
11. Ejecutar /deploy-render para desplegar backend en Render y frontend en Vercel
12. Verificar en producción que el flujo completo funciona con los 3 roles de prueba:
    - admin: ceo@innovaconsulting.cl / Consul2025!
    - contador: contador.jefe@innovaconsulting.cl / Consul2025!
    - viewer: auditor@pwc-chile.cl / Consul2025!
13. Hacer merge del Release PR generado por release-please para crear el tag de versión
