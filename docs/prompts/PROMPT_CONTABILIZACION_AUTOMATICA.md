# PROMPT — Contabilización Automática de Facturas
# Agentes: @developer-backend + @base-de-datos + @developer-frontend + @technical-reviewer
# Ejecutar en conversación NUEVA en Antigravity
# ============================================================
# OBJETIVO:
# 1. Al emitir una factura de venta → generar asiento contable automático
# 2. Importar facturas recibidas desde el Registro de Compras SII
# 3. Panel de mapeo de cuentas contables configurable por admin
# ============================================================

## Contexto del proyecto
- Backend: FastAPI + Python 3.12 — Render
- BD: PostgreSQL 16 en Neon
- Schemas existentes: accounting, commerce, sii
- Tablas clave:
  - accounting.journal_entries  → asientos contables
  - accounting.journal_lines    → líneas de asiento
  - accounting.accounts         → plan de cuentas
  - accounting.periods          → períodos contables
  - commerce.invoices           → facturas emitidas
  - commerce.vendors            → proveedores
  - sii.dte_emitidos            → DTEs emitidos

## Cuentas del plan de cuentas existente (usar estos códigos)
- 1-1-001  Caja y Bancos (BCI Cta Cte)
- 1-1-002  Cuentas por Cobrar Clientes       ← débito en ventas
- 1-1-004  IVA Crédito Fiscal                ← débito en compras
- 2-1-001  Cuentas por Pagar Proveedores     ← crédito en compras
- 2-1-002  IVA Débito Fiscal                 ← crédito en ventas
- 4-1-001  Honorarios Consultoría Estratégica
- 4-1-002  Honorarios Consultoría Digital
- 4-1-003  Honorarios Capacitación y Talleres
- 4-1-004  Servicios Outsourcing CFO
- 5-1-001  Honorarios Consultores Externos
- 5-1-002  Viáticos y Gastos de Terreno
- 6-1-001  Remuneraciones Planta
- 6-1-002  Arriendo Oficinas
- 6-1-003  Servicios Básicos y Telecom

---

# PARTE 1 — BASE DE DATOS
## @base-de-datos

### 1.1 Ejecutar en Neon SQL Editor

```sql
-- ── Tabla de mapeo de cuentas contables por tipo de factura ──────────────────
CREATE TABLE IF NOT EXISTS accounting.invoice_account_mapping (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mapping_type    VARCHAR(20) NOT NULL
                    CHECK (mapping_type IN ('sale', 'purchase', 'credit_note')),
    -- Cuentas para facturas de VENTA (débito CxC / crédito Ingresos + IVA DF)
    account_receivable_id   UUID REFERENCES accounting.accounts(id), -- CxC Clientes
    account_income_id       UUID REFERENCES accounting.accounts(id), -- cuenta de ingreso
    account_iva_debito_id   UUID REFERENCES accounting.accounts(id), -- IVA Débito Fiscal
    -- Cuentas para facturas de COMPRA (débito Gasto + IVA CF / crédito CxP)
    account_payable_id      UUID REFERENCES accounting.accounts(id), -- CxP Proveedores
    account_expense_id      UUID REFERENCES accounting.accounts(id), -- cuenta de gasto
    account_iva_credito_id  UUID REFERENCES accounting.accounts(id), -- IVA Crédito Fiscal
    -- Metadata
    description     VARCHAR(255),
    is_default      BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_by      UUID REFERENCES users.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsqueda por tipo
CREATE INDEX IF NOT EXISTS idx_mapping_type
    ON accounting.invoice_account_mapping(mapping_type, is_active);

-- ── Tabla de facturas recibidas (compras desde SII) ───────────────────────────
CREATE TABLE IF NOT EXISTS commerce.purchase_invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Datos del DTE recibido
    document_type       SMALLINT NOT NULL DEFAULT 33,
    folio               INTEGER NOT NULL,
    fecha_emision       DATE NOT NULL,
    fecha_recepcion     DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Emisor (proveedor)
    rut_emisor          VARCHAR(20) NOT NULL,
    razon_social_emisor VARCHAR(255) NOT NULL,
    vendor_id           UUID REFERENCES commerce.vendors(id),
    -- Montos
    monto_neto          NUMERIC(18,2) NOT NULL DEFAULT 0,
    monto_iva           NUMERIC(18,2) NOT NULL DEFAULT 0,
    monto_total         NUMERIC(18,2) NOT NULL DEFAULT 0,
    -- Contabilización
    journal_entry_id    UUID REFERENCES accounting.journal_entries(id),
    period_id           UUID REFERENCES accounting.periods(id),
    account_mapping_id  UUID REFERENCES accounting.invoice_account_mapping(id),
    -- Estado
    status              VARCHAR(30) NOT NULL DEFAULT 'pendiente'
                        CHECK (status IN ('pendiente','contabilizada','anulada')),
    -- Origen
    source              VARCHAR(20) NOT NULL DEFAULT 'sii_import'
                        CHECK (source IN ('sii_import','manual')),
    sii_import_batch_id UUID,               -- ID del lote de importación SII
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (document_type, folio, rut_emisor)
);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_rut
    ON commerce.purchase_invoices(rut_emisor);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_fecha
    ON commerce.purchase_invoices(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status
    ON commerce.purchase_invoices(status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_vendor
    ON commerce.purchase_invoices(vendor_id);

-- ── Agregar columna journal_entry_id a commerce.invoices ──────────────────────
ALTER TABLE commerce.invoices
ADD COLUMN IF NOT EXISTS journal_entry_id UUID REFERENCES accounting.journal_entries(id);

ALTER TABLE commerce.invoices
ADD COLUMN IF NOT EXISTS account_mapping_id UUID
    REFERENCES accounting.invoice_account_mapping(id);

-- ── Insertar mapeo por defecto para ventas ────────────────────────────────────
-- (se completa con los UUIDs reales de las cuentas después del deploy)
-- Ejecutar DESPUÉS de que el backend esté desplegado y las cuentas existan:
/*
INSERT INTO accounting.invoice_account_mapping
    (mapping_type, description, is_default,
     account_receivable_id, account_income_id, account_iva_debito_id)
SELECT
    'sale',
    'Mapeo por defecto — Honorarios Consultoría',
    true,
    (SELECT id FROM accounting.accounts WHERE code = '1-1-002'),
    (SELECT id FROM accounting.accounts WHERE code = '4-1-001'),
    (SELECT id FROM accounting.accounts WHERE code = '2-1-002')
WHERE NOT EXISTS (
    SELECT 1 FROM accounting.invoice_account_mapping
    WHERE mapping_type = 'sale' AND is_default = true
);
*/
```

---

# PARTE 2 — BACKEND: SERVICIO DE CONTABILIZACIÓN
## @developer-backend

### 2.1 Crear backend/app/services/accounting_engine.py

```python
"""
Motor de contabilización automática de facturas.
Genera asientos contables según el mapeo de cuentas configurado.
"""
import logging
from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.accounting import (
    JournalEntry, JournalLine, Period, Account,
    InvoiceAccountMapping
)
from app.models.commerce import Invoice, PurchaseInvoice

logger = logging.getLogger(__name__)

ENTRY_PREFIX = {
    'sale':        'VTA',
    'purchase':    'CMP',
    'credit_note': 'NC',
}


class AccountingEngine:

    def __init__(self, db: Session):
        self.db = db

    # ── UTILIDADES ───────────────────────────────────────────────────────────

    def get_active_period(self, target_date: date) -> Period:
        """Obtiene el período contable activo para una fecha dada."""
        period = (
            self.db.query(Period)
            .filter(
                Period.start_date <= target_date,
                Period.end_date   >= target_date,
                Period.is_closed  == False,
            )
            .first()
        )
        if not period:
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "NO_PERIOD_AVAILABLE",
                    "message": f"No existe un período contable abierto para la fecha {target_date}. "
                               f"Verifique que el período esté creado y no esté cerrado.",
                }
            )
        return period

    def get_default_mapping(self, mapping_type: str) -> 'InvoiceAccountMapping':
        """Obtiene el mapeo de cuentas por defecto para un tipo de documento."""
        mapping = (
            self.db.query(InvoiceAccountMapping)
            .filter(
                InvoiceAccountMapping.mapping_type == mapping_type,
                InvoiceAccountMapping.is_default   == True,
                InvoiceAccountMapping.is_active    == True,
            )
            .first()
        )
        if not mapping:
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "NO_ACCOUNT_MAPPING",
                    "message": f"No existe un mapeo de cuentas por defecto para tipo '{mapping_type}'. "
                               f"Configure el mapeo en Contabilidad → Mapeo de Cuentas.",
                }
            )
        return mapping

    def get_account(self, account_id: UUID, role: str) -> Account:
        """Obtiene una cuenta contable y valida que exista."""
        account = self.db.get(Account, account_id)
        if not account:
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "ACCOUNT_NOT_FOUND",
                    "message": f"La cuenta contable para '{role}' no existe en el plan de cuentas.",
                }
            )
        return account

    # ── FACTURAS DE VENTA ────────────────────────────────────────────────────

    def contabilizar_venta(
        self,
        invoice: Invoice,
        mapping_id: UUID | None = None,
        posted: bool = True,
    ) -> JournalEntry:
        """
        Genera el asiento contable para una factura de venta emitida.

        Asiento tipo:
        DEBE   CxC Clientes          → monto_total
        HABER  Ingresos (cuenta 4-x) → monto_neto
        HABER  IVA Débito Fiscal     → monto_iva
        """
        if invoice.journal_entry_id:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "ALREADY_POSTED",
                    "message": "Esta factura ya tiene un asiento contable generado.",
                }
            )

        period  = self.get_active_period(invoice.invoice_date)
        mapping = (
            self.db.get(InvoiceAccountMapping, mapping_id)
            if mapping_id
            else self.get_default_mapping('sale')
        )

        # Validar cuentas
        cxc     = self.get_account(mapping.account_receivable_id, 'CxC Clientes')
        ingreso = self.get_account(mapping.account_income_id,     'Ingresos')
        iva_df  = self.get_account(mapping.account_iva_debito_id, 'IVA Débito Fiscal')

        # Crear asiento
        entry_number = self._next_entry_number('VTA', invoice.invoice_date)
        entry = JournalEntry(
            entry_number=entry_number,
            entry_date=invoice.invoice_date,
            description=(
                f"Factura {invoice.invoice_number} — "
                f"{invoice.customer.name if invoice.customer else 'Cliente'}"
            ),
            source='invoice',
            period_id=period.id,
            is_posted=posted,
        )
        self.db.add(entry)
        self.db.flush()

        # Líneas del asiento
        lines = [
            JournalLine(
                journal_entry_id=entry.id,
                account_id=cxc.id,
                debit=Decimal(str(invoice.total)),
                credit=Decimal('0'),
                description=f"CxC {invoice.invoice_number}",
            ),
            JournalLine(
                journal_entry_id=entry.id,
                account_id=ingreso.id,
                debit=Decimal('0'),
                credit=Decimal(str(invoice.subtotal)),
                description=f"Ingreso {invoice.invoice_number}",
            ),
            JournalLine(
                journal_entry_id=entry.id,
                account_id=iva_df.id,
                debit=Decimal('0'),
                credit=Decimal(str(invoice.tax_amount)),
                description=f"IVA DF {invoice.invoice_number}",
            ),
        ]
        for line in lines:
            self.db.add(line)

        # Vincular asiento a la factura
        invoice.journal_entry_id  = entry.id
        invoice.account_mapping_id = mapping.id

        self.db.flush()
        logger.info(
            f"Asiento {entry_number} generado para factura {invoice.invoice_number} "
            f"| Total: {invoice.total} | Período: {period.name}"
        )
        return entry

    # ── FACTURAS DE COMPRA ───────────────────────────────────────────────────

    def contabilizar_compra(
        self,
        purchase: PurchaseInvoice,
        mapping_id: UUID | None = None,
        posted: bool = False,   # compras quedan en borrador por defecto para revisión
    ) -> JournalEntry:
        """
        Genera el asiento contable para una factura de compra recibida.

        Asiento tipo:
        DEBE   Gasto (cuenta 5-x o 6-x)  → monto_neto
        DEBE   IVA Crédito Fiscal         → monto_iva
        HABER  CxP Proveedores            → monto_total
        """
        if purchase.journal_entry_id:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "ALREADY_POSTED",
                    "message": "Esta factura de compra ya tiene un asiento contable.",
                }
            )

        period  = self.get_active_period(purchase.fecha_emision)
        mapping = (
            self.db.get(InvoiceAccountMapping, mapping_id)
            if mapping_id
            else self.get_default_mapping('purchase')
        )

        gasto   = self.get_account(mapping.account_expense_id,    'Gasto')
        iva_cf  = self.get_account(mapping.account_iva_credito_id,'IVA Crédito Fiscal')
        cxp     = self.get_account(mapping.account_payable_id,    'CxP Proveedores')

        entry_number = self._next_entry_number('CMP', purchase.fecha_emision)
        entry = JournalEntry(
            entry_number=entry_number,
            entry_date=purchase.fecha_emision,
            description=(
                f"Factura recibida {purchase.folio} — {purchase.razon_social_emisor}"
            ),
            source='purchase_invoice',
            period_id=period.id,
            is_posted=posted,
        )
        self.db.add(entry)
        self.db.flush()

        lines = [
            JournalLine(
                journal_entry_id=entry.id,
                account_id=gasto.id,
                debit=Decimal(str(purchase.monto_neto)),
                credit=Decimal('0'),
                description=f"Gasto factura {purchase.folio} — {purchase.razon_social_emisor}",
            ),
            JournalLine(
                journal_entry_id=entry.id,
                account_id=iva_cf.id,
                debit=Decimal(str(purchase.monto_iva)),
                credit=Decimal('0'),
                description=f"IVA CF factura {purchase.folio}",
            ),
            JournalLine(
                journal_entry_id=entry.id,
                account_id=cxp.id,
                debit=Decimal('0'),
                credit=Decimal(str(purchase.monto_total)),
                description=f"CxP {purchase.razon_social_emisor}",
            ),
        ]
        for line in lines:
            self.db.add(line)

        purchase.journal_entry_id  = entry.id
        purchase.account_mapping_id = mapping.id
        purchase.status            = 'contabilizada'

        self.db.flush()
        logger.info(
            f"Asiento {entry_number} generado para compra folio {purchase.folio} "
            f"| Total: {purchase.monto_total}"
        )
        return entry

    # ── HELPERS ──────────────────────────────────────────────────────────────

    def _next_entry_number(self, prefix: str, entry_date: date) -> str:
        """Genera el siguiente número de asiento: VTA-2025-0001."""
        year = entry_date.year
        last = (
            self.db.query(JournalEntry)
            .filter(JournalEntry.entry_number.like(f"{prefix}-{year}-%"))
            .order_by(JournalEntry.entry_number.desc())
            .first()
        )
        seq = 1
        if last:
            try:
                seq = int(last.entry_number.split('-')[-1]) + 1
            except (ValueError, IndexError):
                seq = 1
        return f"{prefix}-{year}-{str(seq).zfill(4)}"
```

### 2.2 Integrar con el servicio de facturas de venta

En `backend/app/services/invoice_service.py`, al crear o actualizar
una factura con status 'issued', llamar automáticamente al motor:

```python
from app.services.accounting_engine import AccountingEngine

def create_invoice(db: Session, data: InvoiceCreate, current_user: User) -> Invoice:
    # ... lógica existente de creación ...

    # Contabilización automática cuando se emite
    if invoice.status == 'issued':
        engine = AccountingEngine(db)
        try:
            engine.contabilizar_venta(invoice, posted=True)
        except Exception as e:
            logger.warning(f"Contabilización automática fallida: {e}")
            # No bloquear la emisión si falla la contabilización

    db.commit()
    db.refresh(invoice)
    return invoice
```

### 2.3 Crear backend/app/services/sii_import_service.py

```python
"""
Servicio de importación del Registro de Compras y Ventas desde el SII.
El SII permite descargar el RCV en formato CSV desde:
misiimovil.cl → Registro de Compras y Ventas → Descargar
"""
import csv
import io
import logging
from datetime import date, datetime
from uuid import uuid4, UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.commerce import PurchaseInvoice, Vendor
from app.services.accounting_engine import AccountingEngine

logger = logging.getLogger(__name__)


class SIIImportService:

    def __init__(self, db: Session):
        self.db  = db

    def import_rcv_csv(
        self,
        csv_content: str,
        period_month: int,
        period_year: int,
        auto_contabilizar: bool = False,
    ) -> dict:
        """
        Importa el Registro de Compras del SII desde un archivo CSV.

        Formato del CSV del SII (Registro de Compras):
        RUT Proveedor | Razón Social | Tipo Doc | Folio | Fecha | Neto | IVA | Total

        Args:
            csv_content: contenido del archivo CSV descargado del SII
            period_month: mes del período (1-12)
            period_year: año del período
            auto_contabilizar: si True, genera asientos automáticamente

        Returns:
            dict con estadísticas: importadas, duplicadas, errores
        """
        stats = {
            "total_procesadas":  0,
            "importadas":        0,
            "duplicadas":        0,
            "errores":           0,
            "contabilizadas":    0,
            "detalle_errores":   [],
        }

        batch_id = uuid4()
        reader   = csv.DictReader(io.StringIO(csv_content), delimiter=';')

        for row in reader:
            stats["total_procesadas"] += 1
            try:
                purchase = self._process_row(row, batch_id, period_month, period_year)
                if purchase is None:
                    stats["duplicadas"] += 1
                    continue

                self.db.add(purchase)
                self.db.flush()
                stats["importadas"] += 1

                if auto_contabilizar:
                    try:
                        engine = AccountingEngine(self.db)
                        engine.contabilizar_compra(purchase, posted=False)
                        stats["contabilizadas"] += 1
                    except Exception as e:
                        logger.warning(f"No se pudo contabilizar folio {purchase.folio}: {e}")

            except Exception as e:
                stats["errores"] += 1
                stats["detalle_errores"].append({
                    "fila": stats["total_procesadas"],
                    "error": str(e),
                    "datos": dict(row),
                })
                logger.error(f"Error procesando fila {stats['total_procesadas']}: {e}")

        self.db.commit()
        logger.info(
            f"Importación RCV completada: {stats['importadas']} importadas, "
            f"{stats['duplicadas']} duplicadas, {stats['errores']} errores"
        )
        return stats

    def _process_row(
        self,
        row: dict,
        batch_id: UUID,
        period_month: int,
        period_year: int,
    ) -> 'PurchaseInvoice | None':
        """Procesa una fila del CSV del SII."""

        # Mapeo de columnas del CSV del SII
        # El SII puede usar distintos nombres — ajustar si es necesario
        rut_emisor   = self._clean_rut(
            row.get('RUT Proveedor') or row.get('rut_proveedor') or row.get('RUT') or ''
        )
        razon_social = (
            row.get('Razón Social') or row.get('razon_social') or
            row.get('Nombre') or 'Sin nombre'
        ).strip()
        doc_type     = int(row.get('Tipo DTE') or row.get('tipo_dte') or 33)
        folio        = int(row.get('Folio') or row.get('folio') or 0)
        fecha_str    = row.get('Fecha Emisión') or row.get('fecha_emision') or ''
        monto_neto   = self._parse_amount(row.get('Monto Neto') or row.get('neto') or '0')
        monto_iva    = self._parse_amount(row.get('IVA') or row.get('iva') or '0')
        monto_total  = self._parse_amount(row.get('Monto Total') or row.get('total') or '0')

        if not rut_emisor or not folio:
            raise ValueError(f"RUT o folio vacío: rut={rut_emisor}, folio={folio}")

        # Verificar duplicado
        existing = (
            self.db.query(PurchaseInvoice)
            .filter(
                PurchaseInvoice.document_type == doc_type,
                PurchaseInvoice.folio         == folio,
                PurchaseInvoice.rut_emisor    == rut_emisor,
            )
            .first()
        )
        if existing:
            return None

        # Parsear fecha
        fecha = self._parse_date(fecha_str)

        # Buscar proveedor existente
        vendor = (
            self.db.query(Vendor)
            .filter(Vendor.rut == rut_emisor)
            .first()
        )

        return PurchaseInvoice(
            document_type=doc_type,
            folio=folio,
            fecha_emision=fecha,
            fecha_recepcion=date.today(),
            rut_emisor=rut_emisor,
            razon_social_emisor=razon_social,
            vendor_id=vendor.id if vendor else None,
            monto_neto=monto_neto,
            monto_iva=monto_iva,
            monto_total=monto_total,
            status='pendiente',
            source='sii_import',
            sii_import_batch_id=batch_id,
        )

    @staticmethod
    def _clean_rut(rut: str) -> str:
        """Normaliza el RUT: elimina puntos, deja guión."""
        return rut.strip().replace('.', '').replace(' ', '').upper()

    @staticmethod
    def _parse_amount(value: str) -> float:
        """Parsea montos chilenos: '1.234.567' → 1234567.0"""
        cleaned = str(value).strip().replace('.', '').replace(',', '.').replace('$', '').replace(' ', '')
        try:
            return float(cleaned) if cleaned else 0.0
        except ValueError:
            return 0.0

    @staticmethod
    def _parse_date(date_str: str) -> date:
        """Parsea fechas en formato DD/MM/YYYY o YYYY-MM-DD."""
        date_str = date_str.strip()
        for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y'):
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        return date.today()
```

### 2.4 Crear backend/app/routers/accounting_engine_router.py

```python
"""Endpoints del motor de contabilización y mapeo de cuentas."""
from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.services.accounting_engine import AccountingEngine
from app.services.sii_import_service import SIIImportService

router = APIRouter(prefix="/accounting-engine", tags=["Motor Contabilización"])


def require_admin_or_contador(current_user: User = Depends(get_current_user)) -> User:
    from fastapi import HTTPException
    if current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail={"code": "FORBIDDEN"})
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    from fastapi import HTTPException
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail={"code": "FORBIDDEN"})
    return current_user


# ── CONTABILIZACIÓN MANUAL ────────────────────────────────────────────────────

@router.post("/invoices/{invoice_id}/contabilizar")
def contabilizar_venta(
    invoice_id: UUID,
    mapping_id: UUID | None = None,
    posted: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_contador),
):
    """Contabiliza manualmente una factura de venta."""
    from app.models.commerce import Invoice
    invoice = db.get(Invoice, invoice_id)
    if not invoice:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND"})

    engine = AccountingEngine(db)
    entry  = engine.contabilizar_venta(invoice, mapping_id=mapping_id, posted=posted)
    db.commit()
    return {
        "success": True,
        "data": {
            "entry_number": entry.entry_number,
            "entry_id":     str(entry.id),
            "is_posted":    entry.is_posted,
        }
    }


@router.post("/purchase-invoices/{purchase_id}/contabilizar")
def contabilizar_compra(
    purchase_id: UUID,
    mapping_id: UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_contador),
):
    """Contabiliza una factura de compra importada del SII."""
    from app.models.commerce import PurchaseInvoice
    purchase = db.get(PurchaseInvoice, purchase_id)
    if not purchase:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND"})

    engine = AccountingEngine(db)
    entry  = engine.contabilizar_compra(purchase, mapping_id=mapping_id, posted=False)
    db.commit()
    return {
        "success": True,
        "data": {
            "entry_number": entry.entry_number,
            "entry_id":     str(entry.id),
            "is_posted":    entry.is_posted,
        }
    }


# ── IMPORTACIÓN RCV SII ───────────────────────────────────────────────────────

@router.post("/sii/import-rcv")
async def import_rcv(
    csv_file: UploadFile = File(...),
    period_month: int = Query(..., ge=1, le=12),
    period_year:  int = Query(..., ge=2020, le=2030),
    auto_contabilizar: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_contador),
):
    """
    Importa el Registro de Compras del SII desde archivo CSV.

    Para descargar el CSV del SII:
    1. Ir a misiimovil.cl
    2. Servicios Online → Registro de Compras y Ventas
    3. Seleccionar mes y año
    4. Descargar → Compras → formato CSV
    """
    content = await csv_file.read()
    csv_str = content.decode('utf-8-sig')  # utf-8-sig maneja el BOM de Excel

    svc   = SIIImportService(db)
    stats = svc.import_rcv_csv(csv_str, period_month, period_year, auto_contabilizar)
    return {"success": True, "data": stats}


@router.get("/purchase-invoices")
def list_purchase_invoices(
    status: str | None = None,
    month: int | None = Query(None, ge=1, le=12),
    year:  int | None = Query(None, ge=2020, le=2030),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista facturas de compra importadas del SII."""
    from app.models.commerce import PurchaseInvoice
    from sqlalchemy import extract
    q = db.query(PurchaseInvoice)
    if status:
        q = q.filter(PurchaseInvoice.status == status)
    if month:
        q = q.filter(extract('month', PurchaseInvoice.fecha_emision) == month)
    if year:
        q = q.filter(extract('year', PurchaseInvoice.fecha_emision) == year)
    total = q.count()
    items = q.order_by(PurchaseInvoice.fecha_emision.desc()).offset(skip).limit(limit).all()
    return {"success": True, "data": items, "total": total}


# ── MAPEO DE CUENTAS ──────────────────────────────────────────────────────────

@router.get("/account-mappings")
def list_mappings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista todos los mapeos de cuentas contables."""
    from app.models.accounting import InvoiceAccountMapping
    mappings = db.query(InvoiceAccountMapping).filter(
        InvoiceAccountMapping.is_active == True
    ).all()
    return {"success": True, "data": mappings}


@router.post("/account-mappings")
def create_mapping(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Crea un nuevo mapeo de cuentas contables."""
    from app.models.accounting import InvoiceAccountMapping
    mapping = InvoiceAccountMapping(**data, created_by=current_user.id)
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    return {"success": True, "data": mapping}


@router.put("/account-mappings/{mapping_id}")
def update_mapping(
    mapping_id: UUID,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Actualiza un mapeo de cuentas contables."""
    from app.models.accounting import InvoiceAccountMapping
    mapping = db.get(InvoiceAccountMapping, mapping_id)
    if not mapping:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND"})
    for k, v in data.items():
        setattr(mapping, k, v)
    db.commit()
    db.refresh(mapping)
    return {"success": True, "data": mapping}
```

### 2.5 Registrar el router en main.py
```python
from app.routers.accounting_engine_router import router as accounting_engine_router
app.include_router(accounting_engine_router, prefix="/api/v1")
```

---

# PARTE 3 — FRONTEND
## @developer-frontend

### 3.1 Crear página: frontend/src/pages/accounting/RegistroComprasPage.tsx

Página con 3 tabs:

**Tab 1 — Importar RCV**
- Instrucciones paso a paso para descargar el CSV del SII
- Upload del archivo CSV
- Selector de mes y año del período
- Checkbox "Contabilizar automáticamente al importar"
- Botón "Importar"
- Resultado: tabla con stats (importadas / duplicadas / errores)

**Tab 2 — Facturas recibidas**
- Tabla de purchase_invoices con columnas:
  Fecha | RUT Emisor | Razón Social | Folio | Neto | IVA | Total | Estado
- Filtros: mes, año, estado (pendiente / contabilizada)
- Badge de estado: pendiente=amarillo, contabilizada=verde
- Botón "Contabilizar" por fila (solo para pendientes, rol admin/contador)
- Selector de cuenta de gasto al contabilizar (dropdown del plan de cuentas)

**Tab 3 — Mapeo de cuentas**
Solo visible para admin. Formulario para configurar:

VENTAS (Facturas emitidas):
- Cuenta CxC (débito) → select del plan de cuentas
- Cuenta de Ingresos (crédito) → select del plan de cuentas
- Cuenta IVA Débito Fiscal (crédito) → select del plan de cuentas

COMPRAS (Facturas recibidas):
- Cuenta de Gasto (débito) → select del plan de cuentas
- Cuenta IVA Crédito Fiscal (débito) → select del plan de cuentas
- Cuenta CxP Proveedores (crédito) → select del plan de cuentas

Botón "Guardar mapeo por defecto"

### 3.2 Indicador de contabilización en InvoicesPage

En la tabla de facturas emitidas, agregar columna "Asiento":
```typescript
const AsientoBadge = ({ journalEntryId }: { journalEntryId?: string }) => {
  if (!journalEntryId) return (
    <span className="text-xs text-yellow-600 font-medium">⚠ Sin asiento</span>
  );
  return (
    <span className="text-xs text-green-600 font-medium">✓ Contabilizada</span>
  );
};
```

### 3.3 Agregar al menú lateral
```typescript
// En Sidebar bajo "Contabilidad":
<NavLink to="/accounting/registro-compras">
  📥 Registro de Compras
</NavLink>
```

### 3.4 Instrucciones SII en el componente de importación

```typescript
const SIIDownloadInstructions = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <h3 className="font-semibold text-blue-800 mb-2">
      📋 Cómo descargar el Registro de Compras del SII
    </h3>
    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
      <li>Ir a <strong>misiimovil.cl</strong> e iniciar sesión con RUT de la empresa</li>
      <li>Ir a <strong>Servicios Online → Registro de Compras y Ventas</strong></li>
      <li>Seleccionar el mes y año que deseas importar</li>
      <li>Hacer clic en <strong>Compras → Descargar</strong> → formato <strong>CSV</strong></li>
      <li>Subir el archivo descargado en el formulario de abajo</li>
    </ol>
  </div>
);
```

---

# PARTE 4 — REVISIÓN FINAL
## @technical-reviewer

Verificar antes del deploy:
- [ ] El asiento automático de venta solo se genera si invoice.status == 'issued'
- [ ] No se puede contabilizar dos veces la misma factura (verificar journal_entry_id)
- [ ] El SELECT FOR UPDATE en folios evita race conditions
- [ ] Las compras importadas quedan en borrador (is_posted=False) hasta revisión manual
- [ ] El mapeo de cuentas por defecto se puede cambiar sin afectar asientos ya generados
- [ ] El CSV del SII se procesa con utf-8-sig para manejar BOM de Excel
- [ ] Los montos se parsean correctamente: puntos como miles, no como decimales
- [ ] Viewer no puede contabilizar ni importar (solo ver)
- [ ] El endpoint de importación valida que el archivo sea CSV

---

## COMMIT FINAL
```bash
git add .
git commit -m "feat: contabilización automática facturas + importación RCV SII"
git push origin main
```

## PASO MANUAL POST-DEPLOY
Después del deploy, insertar el mapeo por defecto en Neon SQL Editor:
```sql
INSERT INTO accounting.invoice_account_mapping
    (mapping_type, description, is_default,
     account_receivable_id, account_income_id, account_iva_debito_id)
SELECT
    'sale',
    'Mapeo por defecto — Honorarios Consultoría',
    true,
    (SELECT id FROM accounting.accounts WHERE code = '1-1-002'),
    (SELECT id FROM accounting.accounts WHERE code = '4-1-001'),
    (SELECT id FROM accounting.accounts WHERE code = '2-1-002')
WHERE NOT EXISTS (
    SELECT 1 FROM accounting.invoice_account_mapping
    WHERE mapping_type = 'sale' AND is_default = true
);

INSERT INTO accounting.invoice_account_mapping
    (mapping_type, description, is_default,
     account_payable_id, account_expense_id, account_iva_credito_id)
SELECT
    'purchase',
    'Mapeo por defecto — Gastos generales',
    true,
    (SELECT id FROM accounting.accounts WHERE code = '2-1-001'),
    (SELECT id FROM accounting.accounts WHERE code = '5-1-001'),
    (SELECT id FROM accounting.accounts WHERE code = '1-1-004')
WHERE NOT EXISTS (
    SELECT 1 FROM accounting.invoice_account_mapping
    WHERE mapping_type = 'purchase' AND is_default = true
);
```
