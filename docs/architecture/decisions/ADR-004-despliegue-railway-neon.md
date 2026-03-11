# ADR-004: Despliegue en Railway (backend) con PostgreSQL en Neon

## Estado: Aceptado
## Fecha: 2026-03-11

## Contexto

El proyecto ERP Financiero tiene su frontend desplegado en Vercel (React + TypeScript).  
El backend FastAPI y la base de datos PostgreSQL corrían únicamente en Docker local,  
sin acceso público. Era necesario elegir una plataforma cloud de despliegue que:

- Sea gratuita o de bajo costo para una etapa MVP
- No requiera configuración de infraestructura compleja (sin Kubernetes, sin EC2)
- Soporte Python / FastAPI de forma nativa
- Ofrezca PostgreSQL compatible con SQLAlchemy y Alembic
- Permita conectarse fácilmente con el frontend en Vercel (CORS, HTTPS)

## Decisión

Se elige **Railway** para el backend FastAPI y **Neon** para la base de datos PostgreSQL.

- **Railway** detecta automáticamente proyectos Python con NIXPACKS y los despliega  
  sin Dockerfile. Ofrece `$PORT` dinámico, healthchecks configurables y variables  
  de entorno por proyecto.
- **Neon** provee PostgreSQL 16 serverless con SSL obligatorio, branch por entorno,  
  connection pooling integrado y un tier gratuito generoso.  
  Es 100% compatible con SQLAlchemy + psycopg2.

La URL del backend en Railway se inyecta en el frontend Vercel como variable de entorno  
`VITE_API_URL`, sin hardcodear URLs en el código.

## Consecuencias

### Positivas
- Despliegue en minutos: Railway detecta `Procfile` / `railway.json` y construye con NIXPACKS
- Zero-downtime: Railway hace healthcheck en `/health` antes de redirigir tráfico
- SSL automático: Neon impone `sslmode=require`; Railway provee HTTPS por defecto
- Separación de responsabilidades: BD independiente del runtime del backend
- Migraciones controladas: Alembic puede ejecutarse como release command en Railway

### Negativas
- **Cold starts**: El tier gratuito de Railway puede pausar el servicio tras inactividad
- **Neon SSL obligatorio**: Require ajuste en `session.py` para distinguir local vs. cloud
- **URL de Railway desconocida hasta el primer deploy**: El frontend necesita un re-deploy
  posterior para configurar `VITE_API_URL` con la URL real

### Neutras
- El tier gratuito de Neon tiene límite de 0.5 GB de almacenamiento
- Railway tiene un crédito mensual gratuito de $5 USD que cubre el uso básico de un MVP

## Alternativas consideradas

- **Render + Supabase**: Documentación más simple, pero Supabase tiene un límite de  
  proyectos gratuitos simultáneos y Render es más lento en cold starts.  
  Descartado por mayor latencia.

- **AWS ECS + RDS**: Alta disponibilidad y escalabilidad enterprise, pero requiere  
  configuración de VPC, IAM roles, task definitions y load balancer. Costo fijo  
  mínimo de ~$50/mes. Descartado por sobrecarga operacional para un MVP.

- **Docker Compose en VPS (DigitalOcean/Hetzner)**: Control total, sin cold starts,  
  pero requiere gestión manual de SSL (Let's Encrypt), actualizaciones de SO y  
  backups. Descartado por carga de mantenimiento operacional.

- **Fly.io**: Similar a Railway, buen soporte Python. Descartado por curva de  
  configuración mayor (Dockerfile requerido) y menor integración GitHub.
