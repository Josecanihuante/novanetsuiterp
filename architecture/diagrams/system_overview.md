# System Architecture Diagram (C4 Container)

```mermaid
graph TD
    User((Usuario))
    
    subgraph "ERP Financiero"
        SPA[React SPA]
        API[FastAPI Backend]
        DB[(PostgreSQL 16)]
        
        SPA -- "HTTP/REST (JSON)" --> API
        API -- "SQLAlchemy ORM" --> DB
    end
    
    User -- "Navega / Interactúa" --> SPA
    
    subgraph "Módulos API"
        API --> BSC[Balance Scorecard]
        API --> ACC[Accounting]
        API --> INV[Inventory]
        API --> TAX[Taxes - PPM]
        API --> CRM[CRM - Clientes/Prov]
    end
    
    subgraph "Integraciones Externas"
        Excel[Archivos Excel NetSuite]
        Excel -- "Importación" --> API
    end
```

## Containers Description

| Container | Technology | Description |
| :--- | :--- | :--- |
| **React SPA** | React 18, TypeScript, Tailwind | Single Page Application providing the UI for all modules. |
| **FastAPI Backend** | Python 3.12, FastAPI | REST API handling business logic and data persistence. |
| **PostgreSQL 16** | PostgreSQL | Relational database with schemas for each module. |
| **Zustand** | JavaScript | Client-side state management. |
| **SQLAlchemy** | Python | ORM for database communication. |
