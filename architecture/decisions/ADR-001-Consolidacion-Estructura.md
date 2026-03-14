# ADR-001: Consolidación de la Estructura del Repositorio Monorepo

## Estado: Propuesto
## Fecha: 2026-03-14

## Contexto
Actualmente el proyecto `Proyecto ERP` sufre de una severa duplicación de carpetas y conflictos en el control de versiones, resultado de una inicialización incorrecta o una clonación anidada accidental. 
Se ha detectado:
1. Una carpeta `erp-financiero/` que de por sí misma es un repositorio Git anidado (contiene su propio `.git` y está en medio de un `git merge` conflictivo).
2. Dentro de esa carpeta, existe otro subdirectorio `erp-financiero/erp-financiero/` que contiene las copias limpias de `frontend/` y `backend/`.
3. Existe también una copia paralela `erp-financiero/backend/`.
4. Múltiples versiones de `docker-compose.yml` (en la raíz, dentro de `erp-financiero`, y dentro de `erp-financiero/erp-financiero`).
5. El flujo de CI en `.github/workflows/ci.yml` está configurado para un stack diferente (Node + Prisma), mientras que el proyecto real utiliza FastAPI + Alembic (Backend) y React + Vite (Frontend).

## Decisión
Como Arquitecto de Software, decido reestructurar el repositorio hacia un estándar de **Monorepo Limpio** con la siguiente topología en la raíz del proyecto base (`Proyecto ERP`):
- `/frontend`: Contendrá exclusivamente la aplicación React (movido desde la copia limpia más profunda).
- `/backend`: Contendrá exclusivamente la aplicación FastAPI (movido desde la copia limpia más profunda).
- `/docs` y `/architecture`: Documentación técnica.
- `docker-compose.yml`: Versión consolidada en la raíz para orquestar los servicios.
- Eliminación total del directorio anidado `erp-financiero/` para erradicar el conflicto sub-git y las copias obsoletas.

## Consecuencias
### Positivas
- **Eliminación de Deuda Técnica**: Se resuelven los conflictos de Git ocultos y las redundancias de código.
- **Eficiencia en CI/CD**: Facilita la configuración de flujos de integración continua al tener los proyectos expuestos claramente.
- **Claridad Cognitiva**: Los desarrolladores saben exactamente dónde reside el código de cada capa.
### Negativas
- **Interrupción Temporal**: Cualquier rama local que apuntase a las rutas antiguas necesitará ser rebasada o perderá sus referencias relativas.
### Neutras
- Se requerirá actualizar el archivo `ci.yml` para que apunte a las rutas correctas (`cd frontend` y `cd backend`) y ejecute los comandos correspondientes (e.g. `pytest` en lugar de `prisma`).

## Alternativas consideradas
- **Mantener el submódulo de git (Opción A)**: Descartada. No hay una justificación arquitectónica fuerte para mantener submódulos anidados en este caso de uso si el equipo gestiona todo el ERP como un solo producto fuertemente acoplado en sus versiones (BFF/API conjunta).
