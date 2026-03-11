# Workflow: Revisión de Código Backend
# Comando: /review-backend
# Descripción: Realiza una revisión completa del código de servidor y APIs

## Pasos

1. Identificar todos los endpoints expuestos y verificar que tienen autenticación donde corresponde
2. Revisar que los DTOs de request validan todas las entradas del usuario
3. Verificar que las respuestas de error no exponen información interna del sistema
4. Buscar secrets o credenciales hardcodeadas en el código fuente
5. Revisar el manejo de errores: ¿hay try/catch apropiados? ¿se loguean los errores?
6. Verificar que la separación de capas (Controller/Service/Repository) es correcta
7. Revisar los HTTP status codes usados — deben ser semánticamente correctos
8. Verificar cobertura de tests para los servicios críticos
9. Analizar posibles problemas de performance: N+1, queries sin límite, llamadas síncronas
10. Generar reporte con issues encontrados, clasificados por severidad (Crítico/Alto/Medio/Bajo)
