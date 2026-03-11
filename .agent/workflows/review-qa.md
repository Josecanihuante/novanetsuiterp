# Workflow: Plan de QA para Feature
# Comando: /review-qa
# Descripción: Genera un plan de pruebas completo y revisa la calidad del código

## Pasos

1. Analizar la funcionalidad o cambio a probar — leer los criterios de aceptación si existen
2. Identificar los flujos críticos de usuario que deben funcionar (happy path)
3. Generar casos de prueba en formato Gherkin (Given/When/Then) para:
   - Todos los happy paths identificados
   - Al menos 3 sad paths por funcionalidad principal
   - Edge cases relevantes (inputs vacíos, límites, caracteres especiales)
4. Revisar el código nuevo en busca de:
   - Funciones sin tests unitarios
   - Lógica condicional no cubierta por tests
   - Manejo de errores no testeado
5. Verificar que la cobertura de código no bajó respecto al baseline
6. Buscar tests flaky (tests que fallan intermitentemente) y documentarlos
7. Verificar que los tests de regresión de funcionalidades relacionadas siguen pasando
8. Generar reporte final con:
   - Casos de prueba creados/actualizados
   - Cobertura actual vs objetivo
   - Bugs encontrados con su severidad y pasos de reproducción
   - Recomendación de Go/No-Go para el release
