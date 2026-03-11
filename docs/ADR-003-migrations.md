# ADR 003: Herramienta de Migraciones Estructurales

**Estado:** ACEPTADO
**Fecha:** 2025-03-10

## Contexto
El esquema de PostgreSQL sufrirá múltiples incrementos (anexos de métricas BSC, retenciones y catálogos de cuentas para NetSuite). El ERP debe soportar upgrades en la base de un cliente sin corromper el histórico.

## Decisión
Se utiliza **Alembic** trabajando en conjunto con SQLAlchemy declarative base.

## Reglas de Implementación
1. Toda nueva versión de esquema debe ir acompañada de una migración mediante `alembic revision --autogenerate`.
2. Es obligatorio verificar y modificar manualmente los scripts de migración y documentar en comentarios la naturaleza del cambio.
3. Todo archivo debe incluir las directivas `upgrade()` (avanzar versión) y `downgrade()` (rollback estructural seguro).

## Consecuencias
Evita la mutación en vivo usando scripts SQL huérfanos y protege el versionado de la bóveda de datos financieras.
