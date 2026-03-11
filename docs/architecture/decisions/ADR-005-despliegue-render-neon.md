# ADR-005: Migración de despliegue principal a Render.com (Backend)

## Estado: Aceptado
## Fecha: 2026-03-11

## Contexto

Previamente se había decidido utilizar Railway (ADR-004) como plataforma de despliegue para el backend. Sin embargo, se ha reevaluado la decisión para utilizar **Render.com** en su lugar, manteniendo la base de datos PostgreSQL en **Neon**.

Render ofrece una integración mediante *Infrastructure as Code* (`render.yaml`) muy robusta, lo cual permite versionar la configuración exacta del servicio web, su comando de inicio y sus variables de entorno directamente en el repositorio.

## Decisión

Migrar la configuración de despliegue del backend de Railway a Render.com.
- Se crea un archivo declarativo `render.yaml` en la raíz del proyecto.
- Se adapta la lógica de conexión SQLAlchemy en `backend/app/db/session.py` para forzar `sslmode=require` específicamente cuando detecta hosts asociados a Neon, Render o Supabase.
- Se actualiza el frontend para que apunte (mediante `VITE_API_URL`) al subdominio `.onrender.com`.

La lógica de autenticación en el frontend (*api.ts*) que inyecta los tokens JWT se mantendrá utilizando `Zustand` (`useAuthStore`) en lugar de lectura directa de `localStorage`, favoreciendo la arquitectura reactiva ya existente.

## Consecuencias

### Positivas
- **Infraestructura como código**: El archivo `render.yaml` es una fuente de verdad clara en el repositorio para cómo se construye y ejecuta el servicio.
- Configuración SSL altamente compatible con múltiples proveedores en la nube y local.
- Buena visibilidad de logs y despliegues automáticos al hacer push a la rama `main`.

### Negativas
- **Cold starts prolongados**: En el plan gratuito de Render, los servicios web se "duermen" (spin down) tras 15 minutos en inactividad. La primera petición tras este estado puede tomar más de 45 segundos en responder.

### Neutras
- Será necesario configurar manualmente en el panel de Render las variables de entorno marcadas con `sync: false` (como `DATABASE_URL` y `SECRET_KEY`).

## Alternativas consideradas

- **Mantener Railway**: Ya estaba parcialmente configurado, pero la directriz preferente indica que la infraestructura debe ser configurada para Render usando Node/Python nativo mediante el YAML (evitando depender puramente del builder dinámico NIXPACKS).
