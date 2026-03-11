---
description: >
  Reglas pasivas del QA Engineer. Se aplican automáticamente al revisar
  código existente, escribir tests o analizar la calidad del sistema.
globs:
  - "tests/**/*"
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/*.test.py"
  - "e2e/**/*"
alwaysApply: false
---

# Reglas de Quality Assurance

Cuando escribes tests o revisas calidad del código, aplica siempre estas reglas:

## Estructura de tests
- Seguir el patrón AAA: Arrange, Act, Assert — claramente separado
- Nombre del test debe describir comportamiento: "debería [hacer X] cuando [condición Y]"
- Un solo `assert` conceptual por test — si necesitas más, crea más tests
- Tests no deben depender del orden de ejecución

## Cobertura
- Cubrir siempre: happy path, sad path y al menos 2 edge cases por función
- Cobertura mínima de branches: 60% — objetivo 75%
- Los tests flaky son bugs — deben corregirse antes de cualquier otro trabajo

## Datos de prueba
- Usar factories/builders para generar datos de test — no copiar-pegar objetos
- No usar datos de producción en tests
- Limpiar el estado entre tests — cada test arranca desde cero

## Revisión de PRs
- Todo PR debe incluir tests para el código nuevo
- Verificar que los tests fallen primero (TDD) cuando sea posible
- Documentar por qué se skipea un test si es necesario skipear
