# ADR 002: Base de Datos Relacional y Estrategia de Schemas

**Estado:** ACEPTADO
**Fecha:** 2025-03-10

## Contexto
Los ERPs resuelven problemas sobre dominios de negocio entrelazados (Inventario, Clientes, Facturación, Asientos). Se manejan datos contables strictos que requieren cumplimiento normativo tributario y consistencia matemática absoluta (cuadre de asientos).

## Decisión
Se ha elegido **PostgreSQL 16** como motor principal de persistencia de datos relacional, implementando aislamiento multi-schema (6 schemas separados por módulo interno: `public`, `auth`, `core`, `inventory`, `journal`, variables o vistas).

## Consecuencias

### Positivas
- **ACID Completo:** Soporte real transaccional indispensable en contabilidad (una factura no puede quedar creada si no se registró en su asiento final).
- **Control Organizativo:** Los schemas separan responsabilidades. La lógica de importaciones y KPIs puede modelarse en vistas materializadas u operadores de ventana integrados a este nivel sin castigar memoria RAM de la App.

### Negativas
- **Dependencia de Docker:** Los desarrolladores locales no pueden simplemente correr SQLite (el cual carece de constraints y tipos estrictos adecuados para un ERP complejo).

## Alternativas Descartadas
- **MySQL/MariaDB:** Su manejo de arrays y window functions analíticas necesarias para flujos de caja o BSC históricos resulta menos expresivo que el de PostgreSQL.
- **MongoDB / NoSQL:** Descartado inmediatamente por la carencia de rigurosidad relacional requerida en asientos contables y libros mayores.
