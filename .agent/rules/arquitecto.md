---
description: >
  Reglas pasivas del Arquitecto de Software. Se aplican automáticamente
  cuando el agente genera o revisa código de arquitectura, diagramas o ADRs.
globs:
  - "architecture/**/*"
  - "docs/technical-design/**/*"
  - "*.drawio"
  - "*.puml"
alwaysApply: false
---

# Reglas de Arquitectura de Software

Cuando trabajas en decisiones de arquitectura o revisas la estructura del sistema, aplica siempre estas reglas:

## Documentación
- Toda decisión técnica importante debe acompañarse de un ADR en `architecture/decisions/`
- Los diagramas deben seguir la notación C4 y estar en formato Mermaid o PlantUML
- Nombra los ADRs como: `ADR-[número-de-3-dígitos]-[titulo-en-kebab-case].md`

## Diseño
- Evalúa siempre al menos 2 alternativas antes de proponer una solución
- Identifica explícitamente los trade-offs de cada decisión
- Los dominios de negocio nunca deben acoplarse directamente — usa eventos o contratos

## Revisión de código
- Al revisar un PR, comenta si el cambio afecta la arquitectura existente
- Si hay deuda técnica nueva, debe documentarse en `docs/tech-debt.md`
- Los cambios que cruzan límites de dominio requieren aprobación del Arquitecto
