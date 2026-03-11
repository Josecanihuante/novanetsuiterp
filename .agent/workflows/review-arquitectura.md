# Workflow: Revisión de Arquitectura
# Comando: /review-arquitectura
# Descripción: Realiza una revisión completa de arquitectura del proyecto actual

## Pasos

1. Analizar la estructura de directorios del proyecto y mapear los módulos principales
2. Identificar las dependencias entre módulos y detectar acoplamientos no deseados
3. Verificar que existan ADRs para las decisiones técnicas clave
4. Evaluar si el diseño actual soporta los requisitos de escalabilidad conocidos
5. Revisar que haya diagramas C4 actualizados en `architecture/diagrams/`
6. Identificar puntos únicos de falla (SPOF) en la arquitectura actual
7. Generar un reporte con:
   - ✅ Fortalezas de la arquitectura actual
   - ⚠️ Riesgos identificados con nivel de severidad (Alto/Medio/Bajo)
   - 🔧 Recomendaciones prioritizadas
   - 📋 ADRs pendientes de crear
8. Si hay riesgos de nivel Alto, proponer un plan de mitigación con estimación de esfuerzo
