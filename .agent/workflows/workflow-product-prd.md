# Workflow: Definición de Producto
# Comando: /product-prd
# Descripción: Genera un PRD completo para una nueva feature del ERP Financiero

## Pasos

1. Leer el contexto del ERP: empresa Innova Consulting Group SpA, 3 roles (admin/contador/viewer), stack FastAPI + React + Neon + Render
2. Identificar qué problema de negocio resuelve la feature solicitada en el contexto chileno (SII, IVA, PPM)
3. Definir los usuarios afectados: ¿qué rol la usa? ¿qué rol la aprueba? ¿qué rol solo la visualiza?
4. Redactar el MVP mínimo viable — separar lo esencial de lo deseable
5. Escribir user stories en formato: Como [rol], quiero [acción], para [beneficio]
6. Escribir criterios de aceptación en formato Gherkin (Given/When/Then) para cada story
7. Identificar dependencias con módulos existentes: accounting / commerce / inventory / taxes / financial
8. Identificar si la feature requiere integración con SII — marcarla como alta complejidad si es así
9. Estimar esfuerzo relativo: Pequeño (1-2 días) / Mediano (3-5 días) / Grande (1-2 semanas)
10. Generar los siguientes documentos:
    - PRD.md con visión, usuarios, stories y criterios de aceptación
    - feature_list.md con backlog priorizado por valor de negocio vs esfuerzo
    - user_flows.md con el flujo paso a paso del usuario principal
11. Confirmar con el equipo antes de pasar a @arquitecto-software
