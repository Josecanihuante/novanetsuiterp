# Arquitectura del Sistema - ERP Financiero

Este documento detalla la estructura principal del ERP Financiero, usando el modelo C4 (Contexto, Contenedores, Componentes).

## Nivel 1: Contexto (System Context Diagram)

```mermaid
C4Context
    title ERP Financiero - Diagrama de Contexto
    
    Person(admin, "Usuario Administrador", "Asistente, Gerente o Cuentadante ingresando al portal")
    
    System(erp, "ERP Financiero", "Plataforma Core que procesa cálculos contables, KPIs y tributos chilenos (PPM).")
    System_Ext(netsuite, "Oracle NetSuite", "Fuente de datos de respaldo contable (.xlsx exportado)")

    Rel(admin, erp, "Accede a reportes, dashboards y sube Excel de la contabilidad", "HTTPS")
    Rel(erp, netsuite, "Ingesta datos offline extraídos desde el sistema", "Import Excel")
```

## Nivel 2: Contenedores (Container Diagram)

```mermaid
C4Container
    title ERP Financiero - Contenedores

    Person(admin, "Usuario", "Accede vía Navegador Web")
    
    Container(spa, "Single Page Application", "React 18 + Vite, Tailwind", "Provee UI, gráficas, y formularios en el navegador del usuario.")
    
    Container(api, "API Layer", "FastAPI (Python 3.12)", "Maneja ruteo, autenticación, y delegación de cálculos al servicio adecuado.")
    
    ContainerDb(db, "Database", "PostgreSQL 16", "Maneja el estado y los 6 schemas internos transaccionales (ACID).")
    
    Rel(admin, spa, "Visita y opera la UI")
    Rel(spa, api, "Llamadas REST / carga multipart", "JSON / FormData")
    Rel(api, db, "Reads / Writes", "SQLAlchemy ORM (psycopg3)")
```

## Nivel 3: Componentes del Backend (Component Diagram)

```mermaid
C4Component
    title ERP Financiero - Componentes (API Service)
    
    Container_Boundary(api, "API Core (FastAPI)") {
        Component(router_bsc, "BSC Router", "FastAPI Route", "Valida entrada y mapea a KPIs")
        Component(service_bsc, "BSC Service", "Python Module", "Calcula ROI, ROE, Rotación, Z-Altman (34 métricas)")
        
        Component(router_ppm, "PPM Router", "FastAPI Route", "Recepción de pagos provisorios mensuales")
        Component(service_ppm, "PPM Service", "Python Module", "Aplica LIR Art. 84, Art. 90 y 5% o Pro PyME")
        
        Component(router_import, "Import Router", "FastAPI Route", "Recibe multipart Excel")
        Component(service_netsuite, "NetSuite Service", "Python Module", "Parseo in-memory vía openpyxl y normalización estricta")
        
        Component(repo, "Repositories", "SQLAlchemy", "Aíslan los queries a PostgreSQL del dominio lógico")
    }

    Rel(router_bsc, service_bsc, "Delega")
    Rel(router_ppm, service_ppm, "Delega")
    Rel(router_import, service_netsuite, "Delega")
    
    Rel(service_bsc, repo, "Consulta balances agregados")
    Rel(service_ppm, repo, "Consulta historial P&L")
    Rel(service_netsuite, repo, "Inserta Asientos")
```

## Patrón de Separación de Capas (Backend)

La API sigue un diseño CQA (Command Query Architecture) con Inyección Estructural Modular:
1. **Routers (`app/api/`):** Solo procesan validación Pydantic, llaman al servicio y devuelven HTTP status/payload.
2. **Servicios (`app/services/`):** Tienen reglas del negocio puras. Sin noción del cliente HTTP (pueden ser consumidas de terminal o tests unitarios). 
3. **Repositorios (`app/repositories/`):** Capa de acceso a datos que maneja transacciones de BD. (Actualmente los servicios pueden llamar ORM directamente debido a la escala inicial, pero es el siguiente refactor natural listado en deuda técnica).
