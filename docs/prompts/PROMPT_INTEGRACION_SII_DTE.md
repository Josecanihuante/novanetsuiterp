# PROMPT — Integración DTE SII Chile
# Agentes: @developer-backend + @base-de-datos + @developer-frontend + @technical-reviewer
# Ejecutar en conversación NUEVA en Antigravity
# ============================================================
# CONTEXTO: Implementar arquitectura DTE completa usando cl-sii
# Fase 1: ambiente certificación (sin certificado real aún)
# Fase 2: producción (cuando el usuario obtenga certificado)
# ============================================================

## Stack del proyecto
- Backend: FastAPI + Python 3.12 — Render (novanetsuiterp-1.onrender.com)
- BD: PostgreSQL 16 en Neon — schema commerce + nuevo schema sii
- Frontend: React 18 + TypeScript + Tailwind — Vercel
- Empresa: Innova Consulting Group SpA, RUT 76.987.654-3
- Tablas existentes: commerce.invoices, commerce.customers

---

# PARTE 1 — INSTALACIÓN Y CONFIGURACIÓN
## @developer-backend

### 1.1 Instalar dependencias
Agregar al backend/requirements.txt:
```
cl-sii>=0.22.0
lxml>=5.0.0
cryptography>=42.0.0
zeep>=4.2.1
```

### 1.2 Variables de entorno nuevas en Render
Agregar estas variables en Render → Environment:
```
SII_AMBIENTE=CERTIFICACION          # cambiar a PRODUCCION cuando haya certificado
SII_RUT_EMPRESA=76987654-3          # sin puntos, con guión
SII_CERT_PATH=/app/certs/cert.p12   # ruta del certificado (subir cuando esté disponible)
SII_CERT_PASSWORD=                  # contraseña del certificado (dejar vacío por ahora)
SII_RESOLUCION_NUMERO=0             # número de resolución SII (obtener al registrarse)
SII_RESOLUCION_FECHA=2024-01-01     # fecha de la resolución
```

### 1.3 Crear backend/app/core/sii_config.py
```python
"""Configuración del ambiente SII."""
from enum import Enum
from app.core.config import settings

class SIIAmbiente(str, Enum):
    CERTIFICACION = "CERTIFICACION"
    PRODUCCION    = "PRODUCCION"

class SIIConfig:
    ambiente: SIIAmbiente = SIIAmbiente(settings.SII_AMBIENTE)
    rut_empresa: str      = settings.SII_RUT_EMPRESA
    cert_path: str        = settings.SII_CERT_PATH
    cert_password: str    = settings.SII_CERT_PASSWORD
    resolucion_numero: int = int(settings.SII_RESOLUCION_NUMERO or 0)
    resolucion_fecha: str  = settings.SII_RESOLUCION_FECHA

    @property
    def is_produccion(self) -> bool:
        return self.ambiente == SIIAmbiente.PRODUCCION

    @property
    def sii_url(self) -> str:
        if self.is_produccion:
            return "https://palena.sii.cl"
        return "https://maullin.sii.cl"   # ambiente certificación

sii_config = SIIConfig()
```

---

# PARTE 2 — BASE DE DATOS
## @base-de-datos

### 2.1 Crear schema sii en Neon SQL Editor
```sql
CREATE SCHEMA IF NOT EXISTS sii;

-- Tipos de DTE soportados
CREATE TABLE IF NOT EXISTS sii.document_types (
    id          SMALLINT PRIMARY KEY,
    code        SMALLINT UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO sii.document_types (id, code, name, description) VALUES
(1,  33, 'Factura Afecta',          'Factura electrónica con IVA'),
(2,  34, 'Factura Exenta',          'Factura electrónica sin IVA'),
(3,  39, 'Boleta Afecta',           'Boleta electrónica con IVA'),
(4,  41, 'Boleta Exenta',           'Boleta electrónica sin IVA'),
(5,  56, 'Nota de Débito',          'Nota de débito electrónica'),
(6,  61, 'Nota de Crédito',         'Nota de crédito electrónica')
ON CONFLICT (id) DO NOTHING;

-- Folios CAF por tipo de documento
CREATE TABLE IF NOT EXISTS sii.caf_folios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type   SMALLINT NOT NULL REFERENCES sii.document_types(code),
    folio_desde     INTEGER NOT NULL,
    folio_hasta     INTEGER NOT NULL,
    folio_actual    INTEGER NOT NULL,
    caf_xml         TEXT NOT NULL,          -- XML del CAF entregado por SII
    fecha_vencimiento DATE,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_range CHECK (folio_desde <= folio_actual AND folio_actual <= folio_hasta)
);

-- DTEs emitidos
CREATE TABLE IF NOT EXISTS sii.dte_emitidos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id          UUID REFERENCES commerce.invoices(id),
    document_type       SMALLINT NOT NULL REFERENCES sii.document_types(code),
    folio               INTEGER NOT NULL,
    fecha_emision       DATE NOT NULL,
    rut_receptor        VARCHAR(20) NOT NULL,
    razon_social_receptor VARCHAR(255) NOT NULL,
    monto_neto          NUMERIC(18,0) NOT NULL DEFAULT 0,
    monto_iva           NUMERIC(18,0) NOT NULL DEFAULT 0,
    monto_total         NUMERIC(18,0) NOT NULL DEFAULT 0,
    xml_firmado         TEXT,               -- XML completo firmado (disponible con certificado)
    track_id            VARCHAR(50),        -- ID de seguimiento en SII
    estado_sii          VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE'
                        CHECK (estado_sii IN (
                            'PENDIENTE',    -- generado, aún no enviado
                            'ENVIADO',      -- enviado al SII
                            'ACEPTADO',     -- aceptado por SII
                            'ACEPTADO_REPAROS', -- aceptado con observaciones
                            'RECHAZADO',    -- rechazado por SII
                            'ANULADO'       -- anulado internamente
                        )),
    error_mensaje       TEXT,               -- mensaje de error si fue rechazado
    pdf_url             TEXT,               -- URL del PDF almacenado
    ambiente            VARCHAR(20) NOT NULL DEFAULT 'CERTIFICACION',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (document_type, folio, ambiente)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dte_invoice    ON sii.dte_emitidos(invoice_id);
CREATE INDEX IF NOT EXISTS idx_dte_estado     ON sii.dte_emitidos(estado_sii);
CREATE INDEX IF NOT EXISTS idx_dte_receptor   ON sii.dte_emitidos(rut_receptor);
CREATE INDEX IF NOT EXISTS idx_dte_fecha      ON sii.dte_emitidos(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_caf_type       ON sii.caf_folios(document_type);
```

---

# PARTE 3 — BACKEND: SERVICIOS DTE
## @developer-backend

### 3.1 Crear backend/app/services/sii_service.py
```python
"""Servicio de integración con SII para emisión de DTE."""
import logging
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.sii_config import sii_config
from app.models.sii import DteEmitido, CafFolios
from app.models.commerce import Invoice

logger = logging.getLogger(__name__)


class SIIService:

    def __init__(self, db: Session):
        self.db = db

    # ── FOLIOS ───────────────────────────────────────────────────

    def get_next_folio(self, document_type: int) -> int:
        """Obtiene y reserva el siguiente folio disponible para un tipo de DTE."""
        caf = (
            self.db.query(CafFolios)
            .filter(
                CafFolios.document_type == document_type,
                CafFolios.is_active == True,
                CafFolios.folio_actual <= CafFolios.folio_hasta,
            )
            .first()
        )

        if not caf:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "code": "NO_FOLIOS_DISPONIBLES",
                    "message": f"No hay folios disponibles para el tipo de documento {document_type}. "
                               f"Solicite más folios CAF en el SII.",
                }
            )

        folio = caf.folio_actual
        caf.folio_actual += 1

        if caf.folio_actual > caf.folio_hasta:
            caf.is_active = False
            logger.warning(f"CAF agotado para tipo {document_type}. Último folio: {folio}")

        self.db.flush()
        return folio

    def upload_caf(self, document_type: int, caf_xml: str) -> CafFolios:
        """Registra un nuevo CAF recibido del SII."""
        # Parsear el XML del CAF para extraer el rango de folios
        import xml.etree.ElementTree as ET
        root = ET.fromstring(caf_xml)

        folio_desde = int(root.findtext('.//DESDE') or 0)
        folio_hasta  = int(root.findtext('.//HASTA') or 0)
        fecha_venc   = root.findtext('.//FA')

        if not folio_desde or not folio_hasta:
            raise HTTPException(
                status_code=400,
                detail={"code": "CAF_INVALIDO", "message": "El XML del CAF no tiene rango de folios válido"}
            )

        # Desactivar CAFs anteriores del mismo tipo
        self.db.query(CafFolios).filter(
            CafFolios.document_type == document_type,
            CafFolios.is_active == True
        ).update({"is_active": False})

        caf = CafFolios(
            document_type=document_type,
            folio_desde=folio_desde,
            folio_hasta=folio_hasta,
            folio_actual=folio_desde,
            caf_xml=caf_xml,
            fecha_vencimiento=fecha_venc,
            is_active=True,
        )
        self.db.add(caf)
        self.db.flush()
        return caf

    # ── EMISIÓN DTE ──────────────────────────────────────────────

    def emitir_dte(self, invoice_id: UUID, document_type: int = 33) -> DteEmitido:
        """
        Emite un DTE para una factura existente.
        En ambiente CERTIFICACION: genera el registro pero no envía al SII.
        En ambiente PRODUCCION: firma y envía al SII.
        """
        invoice = self.db.get(Invoice, invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail={"code": "INVOICE_NOT_FOUND"})

        # Verificar que no tenga DTE previo activo
        existing = self.db.query(DteEmitido).filter(
            DteEmitido.invoice_id == invoice_id,
            DteEmitido.estado_sii.notin_(['ANULADO', 'RECHAZADO'])
        ).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail={"code": "DTE_YA_EXISTE", "message": f"Esta factura ya tiene un DTE emitido (folio {existing.folio})"}
            )

        folio = self.get_next_folio(document_type)

        dte = DteEmitido(
            invoice_id=invoice_id,
            document_type=document_type,
            folio=folio,
            fecha_emision=date.today(),
            rut_receptor=invoice.customer.rut if invoice.customer else "",
            razon_social_receptor=invoice.customer.name if invoice.customer else "",
            monto_neto=int(invoice.subtotal),
            monto_iva=int(invoice.tax_amount),
            monto_total=int(invoice.total),
            estado_sii='PENDIENTE',
            ambiente=sii_config.ambiente.value,
        )

        if sii_config.is_produccion and sii_config.cert_path:
            try:
                xml_firmado = self._generar_xml_firmado(invoice, dte)
                track_id    = self._enviar_sii(xml_firmado)
                dte.xml_firmado = xml_firmado
                dte.track_id    = track_id
                dte.estado_sii  = 'ENVIADO'
                logger.info(f"DTE enviado al SII. Folio: {folio}, TrackID: {track_id}")
            except Exception as e:
                dte.estado_sii    = 'PENDIENTE'
                dte.error_mensaje = str(e)
                logger.error(f"Error enviando DTE al SII: {e}")
        else:
            logger.info(
                f"DTE generado en ambiente {sii_config.ambiente.value}. "
                f"Folio: {folio}. Sin envío al SII (certificado no configurado)."
            )

        self.db.add(dte)
        self.db.commit()
        self.db.refresh(dte)
        return dte

    def _generar_xml_firmado(self, invoice: Invoice, dte: DteEmitido) -> str:
        """
        Genera el XML del DTE firmado con el certificado digital.
        Requiere: cl-sii instalado + certificado .p12 configurado
        """
        # TODO: implementar cuando el certificado esté disponible
        # from cl_sii.dte.data_models import DteDataL2
        # from cl_sii.dte.xml_utils import sign_dte_xml
        raise NotImplementedError(
            "La firma XML requiere certificado digital. "
            "Configure SII_CERT_PATH y SII_CERT_PASSWORD en las variables de entorno."
        )

    def _enviar_sii(self, xml_firmado: str) -> str:
        """Envía el DTE firmado al SII vía SOAP y retorna el TrackID."""
        # TODO: implementar cuando el certificado esté disponible
        raise NotImplementedError("Requiere certificado digital configurado.")

    # ── CONSULTA ESTADO ──────────────────────────────────────────

    def consultar_estado(self, dte_id: UUID) -> dict:
        """Consulta el estado de un DTE en el SII."""
        dte = self.db.get(DteEmitido, dte_id)
        if not dte:
            raise HTTPException(status_code=404, detail={"code": "DTE_NOT_FOUND"})

        if not dte.track_id or not sii_config.is_produccion:
            return {
                "folio": dte.folio,
                "estado": dte.estado_sii,
                "ambiente": dte.ambiente,
                "mensaje": "Consulta en SII no disponible en ambiente de certificación o sin TrackID",
            }

        # TODO: consultar estado real en SII cuando haya certificado
        return {"folio": dte.folio, "estado": dte.estado_sii, "track_id": dte.track_id}

    # ── ANULACIÓN ────────────────────────────────────────────────

    def anular_dte(self, dte_id: UUID) -> DteEmitido:
        """Anula un DTE emitido (genera Nota de Crédito tipo 61)."""
        dte = self.db.get(DteEmitido, dte_id)
        if not dte:
            raise HTTPException(status_code=404, detail={"code": "DTE_NOT_FOUND"})
        if dte.estado_sii in ['ANULADO', 'RECHAZADO']:
            raise HTTPException(
                status_code=409,
                detail={"code": "DTE_YA_ANULADO", "message": "Este DTE ya está anulado o rechazado"}
            )
        dte.estado_sii = 'ANULADO'
        dte.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(dte)
        return dte
```

### 3.2 Crear backend/app/routers/sii.py
```python
"""Endpoints de integración SII."""
from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.sii_config import sii_config
from app.models.users import User
from app.services.sii_service import SIIService

router = APIRouter(prefix="/sii", tags=["SII - DTE"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        from fastapi import HTTPException, status
        raise HTTPException(status_code=403, detail={"code": "FORBIDDEN", "message": "Solo administradores"})
    return current_user


@router.get("/status")
def sii_status(current_user: User = Depends(get_current_user)):
    """Estado de la configuración SII."""
    return {
        "success": True,
        "data": {
            "ambiente":          sii_config.ambiente.value,
            "rut_empresa":       sii_config.rut_empresa,
            "certificado_ok":    bool(sii_config.cert_path),
            "listo_produccion":  sii_config.is_produccion and bool(sii_config.cert_path),
            "sii_url":           sii_config.sii_url,
        }
    }


@router.post("/invoices/{invoice_id}/emitir-dte")
def emitir_dte(
    invoice_id: UUID,
    document_type: int = 33,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Emite un DTE para una factura existente.
    - document_type 33: Factura Afecta (con IVA) — más común
    - document_type 34: Factura Exenta (sin IVA)
    """
    svc = SIIService(db)
    dte = svc.emitir_dte(invoice_id, document_type)
    return {
        "success": True,
        "data": {
            "dte_id":       str(dte.id),
            "folio":        dte.folio,
            "document_type": dte.document_type,
            "estado":       dte.estado_sii,
            "ambiente":     dte.ambiente,
            "fecha_emision": str(dte.fecha_emision),
        }
    }


@router.get("/dte/{dte_id}/estado")
def estado_dte(
    dte_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Consulta el estado de un DTE en el SII."""
    svc = SIIService(db)
    return {"success": True, "data": svc.consultar_estado(dte_id)}


@router.post("/dte/{dte_id}/anular")
def anular_dte(
    dte_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Anula un DTE emitido."""
    svc = SIIService(db)
    dte = svc.anular_dte(dte_id)
    return {"success": True, "data": {"dte_id": str(dte.id), "estado": dte.estado_sii}}


@router.post("/caf/upload")
def upload_caf(
    document_type: int,
    caf_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Sube el archivo CAF entregado por el SII.
    Solo admin. El archivo es el XML que entrega el SII al solicitar folios.
    """
    import asyncio
    content = asyncio.get_event_loop().run_until_complete(caf_file.read())
    caf_xml = content.decode('utf-8')
    svc = SIIService(db)
    caf = svc.upload_caf(document_type, caf_xml)
    return {
        "success": True,
        "data": {
            "document_type": caf.document_type,
            "folio_desde":   caf.folio_desde,
            "folio_hasta":   caf.folio_hasta,
            "folios_disponibles": caf.folio_hasta - caf.folio_desde + 1,
        }
    }


@router.get("/folios/disponibles")
def folios_disponibles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Muestra los folios disponibles por tipo de documento."""
    from app.models.sii import CafFolios
    cafs = db.query(CafFolios).filter(CafFolios.is_active == True).all()
    return {
        "success": True,
        "data": [
            {
                "document_type":      c.document_type,
                "folio_actual":       c.folio_actual,
                "folio_hasta":        c.folio_hasta,
                "folios_disponibles": c.folio_hasta - c.folio_actual + 1,
                "fecha_vencimiento":  str(c.fecha_vencimiento) if c.fecha_vencimiento else None,
            }
            for c in cafs
        ]
    }
```

### 3.3 Registrar el router en main.py
```python
from app.routers.sii import router as sii_router
app.include_router(sii_router, prefix="/api/v1")
```

### 3.4 Crear modelos SQLAlchemy
Crear backend/app/models/sii.py con los modelos:
- DteEmitido → tabla sii.dte_emitidos
- CafFolios  → tabla sii.caf_folios

Seguir el patrón estándar del proyecto con UUID PK y timestamps.

---

# PARTE 4 — FRONTEND: MÓDULO DTE
## @developer-frontend

### 4.1 Badge de estado DTE en InvoicesPage
En la tabla de facturas, agregar una columna "DTE" con badge de estado:

```typescript
const DteBadge = ({ estado }: { estado?: string }) => {
  if (!estado) return (
    <span className="text-xs text-gray-400">Sin DTE</span>
  );
  const colors: Record<string, string> = {
    PENDIENTE:          'bg-yellow-100 text-yellow-800',
    ENVIADO:            'bg-blue-100 text-blue-800',
    ACEPTADO:           'bg-green-100 text-green-800',
    ACEPTADO_REPAROS:   'bg-orange-100 text-orange-800',
    RECHAZADO:          'bg-red-100 text-red-800',
    ANULADO:            'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[estado] || 'bg-gray-100'}`}>
      {estado}
    </span>
  );
};
```

### 4.2 Botón "Emitir DTE" en detalle de factura
Solo visible para rol admin. Al hacer clic llama POST /api/v1/sii/invoices/{id}/emitir-dte

```typescript
{role === 'admin' && !invoice.dte && (
  <Button
    onClick={() => handleEmitirDTE(invoice.id)}
    loading={emitting}
    variant="primary"
    size="sm"
  >
    🧾 Emitir DTE
  </Button>
)}
```

### 4.3 Crear página: frontend/src/pages/sii/SIIConfigPage.tsx
Panel de configuración SII — solo visible para admin:

Secciones:
1. **Estado del sistema** → GET /api/v1/sii/status
   - Badge: CERTIFICACIÓN (amarillo) o PRODUCCIÓN (verde)
   - Indicador: certificado configurado sí/no
   - URL del SII activo

2. **Folios disponibles** → GET /api/v1/sii/folios/disponibles
   - Tabla: Tipo documento | Folio actual | Folio hasta | Disponibles | Vencimiento
   - Alerta roja si quedan menos de 10 folios

3. **Cargar CAF** → POST /api/v1/sii/caf/upload
   - Selector de tipo (33 Factura Afecta / 34 Exenta / 61 Nota Crédito)
   - Upload del archivo XML del CAF
   - Botón "Cargar folios"

4. **Instrucciones** (acordeón):
   - Cómo obtener el certificado digital
   - Cómo solicitar folios CAF en el SII
   - Cómo pasar de certificación a producción

### 4.4 Agregar al menú lateral
```typescript
// En Sidebar.tsx, sección de admin:
{role === 'admin' && (
  <NavLink to="/sii/configuracion">
    🏛️ SII / DTE
  </NavLink>
)}
```

---

# PARTE 5 — REVISIÓN FINAL
## @technical-reviewer

Verificar antes del deploy:
- [ ] El endpoint /sii/invoices/{id}/emitir-dte requiere rol admin
- [ ] No se puede emitir DTE de una factura que ya tiene DTE activo (409)
- [ ] Los folios se incrementan atómicamente (sin condición de carrera)
- [ ] El campo caf_xml no se expone en ningún endpoint GET público
- [ ] El certificado digital nunca se almacena en la BD — solo en el filesystem
- [ ] Las variables SII_CERT_PASSWORD no aparecen en logs
- [ ] El ambiente CERTIFICACION nunca envía datos al SII real de producción

---

# ROADMAP PARA PRODUCCIÓN

Una vez que el usuario obtenga el certificado digital:

## Paso 1 — Subir el certificado a Render
```
Render → servicio → Settings → Secret Files
Ruta: /app/certs/cert.p12
Contenido: el archivo .p12 del certificado
```

## Paso 2 — Actualizar variables de entorno en Render
```
SII_AMBIENTE=PRODUCCION
SII_CERT_PATH=/app/certs/cert.p12
SII_CERT_PASSWORD=contraseña-del-certificado
SII_RESOLUCION_NUMERO=número-de-tu-resolución-SII
SII_RESOLUCION_FECHA=fecha-de-tu-resolución
```

## Paso 3 — Solicitar folios CAF en el SII
```
1. Ir a misiimovil.cl con RUT de la empresa
2. Factura Electrónica → Solicitud de Folios
3. Tipo 33 (Factura Afecta) → 100 folios
4. Descargar el XML del CAF
5. Subirlo en el ERP: SII/DTE → Cargar CAF
```

## Paso 4 — Implementar _generar_xml_firmado en sii_service.py
```python
# Usando cl-sii para generar y firmar el XML del DTE
from cl_sii.dte.data_models import DteDataL2
from cl_sii.rut import Rut
# ... implementación completa con los datos del CAF y el certificado
```

## Paso 5 — Probar en certificación antes de producción
Emitir 5 DTEs de prueba en ambiente de certificación y verificar
que el SII los acepta antes de cambiar a producción.

---

## COMMIT FINAL
```bash
git add .
git commit -m "feat: integración DTE SII Chile - arquitectura base"
git push origin main
```
