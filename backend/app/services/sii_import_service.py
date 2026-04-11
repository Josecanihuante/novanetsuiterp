"""
Servicio de importación del Registro de Compras y Ventas desde el SII.

El SII permite descargar el RCV en formato CSV desde:
misiimovil.cl → Servicios Online → Registro de Compras y Ventas → Descargar

Formato del CSV (columnas habituales del SII):
RUT Proveedor | Razón Social | Tipo DTE | Folio | Fecha Emisión | Monto Neto | IVA | Monto Total
"""
import csv
import io
import logging
from datetime import datetime
from uuid import uuid4, UUID
from typing import Optional

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.invoice_mapping import PurchaseInvoice
from app.models.commerce import Vendor
from app.services.accounting_engine import AccountingEngine

logger = logging.getLogger(__name__)


class SIIImportService:

    def __init__(self, db: Session):
        self.db = db

    def import_rcv_csv(
        self,
        csv_content: str,
        period_month: int,
        period_year: int,
        auto_contabilizar: bool = False,
        created_by: Optional[UUID] = None,
    ) -> dict:
        """
        Importa el Registro de Compras del SII desde un archivo CSV.

        Args:
            csv_content:       Contenido del archivo CSV descargado del SII.
            period_month:      Mes del período (1-12).
            period_year:       Año del período.
            auto_contabilizar: Si True, genera asientos en borrador automáticamente.
            created_by:        UUID del usuario que importa (para los asientos).

        Returns:
            dict con estadísticas: importadas, duplicadas, errores.
        """
        stats: dict = {
            "total_procesadas": 0,
            "importadas":       0,
            "duplicadas":       0,
            "errores":          0,
            "contabilizadas":   0,
            "detalle_errores":  [],
        }

        batch_id = uuid4()
        reader   = csv.DictReader(io.StringIO(csv_content), delimiter=";")

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
                        engine.contabilizar_compra(
                            purchase, posted=False, created_by=created_by
                        )
                        stats["contabilizadas"] += 1
                    except Exception as exc:
                        logger.warning(
                            "No se pudo contabilizar folio %s: %s", purchase.folio, exc
                        )

            except Exception as exc:
                stats["errores"] += 1
                stats["detalle_errores"].append(
                    {
                        "fila":  stats["total_procesadas"],
                        "error": str(exc),
                        "datos": dict(row),
                    }
                )
                logger.error(
                    "Error procesando fila %s: %s", stats["total_procesadas"], exc
                )

        self.db.commit()
        logger.info(
            "Importación RCV completada: %s importadas, %s duplicadas, %s errores",
            stats["importadas"], stats["duplicadas"], stats["errores"],
        )
        return stats

    def _process_row(
        self,
        row: dict,
        batch_id: UUID,
        period_month: int,
        period_year: int,
    ) -> "PurchaseInvoice | None":
        """Procesa una fila del CSV del SII y retorna el objeto PurchaseInvoice o None si duplicado."""

        # Mapeo flexible de nombres de columna (el SII puede cambiarlos según versión)
        rut_emisor = self._clean_rut(
            row.get("RUT Proveedor")
            or row.get("rut_proveedor")
            or row.get("RUT")
            or ""
        )
        razon_social = (
            row.get("Razón Social")
            or row.get("razon_social")
            or row.get("Nombre")
            or "Sin nombre"
        ).strip()

        doc_type   = int(row.get("Tipo DTE") or row.get("tipo_dte") or 33)
        folio      = int(row.get("Folio") or row.get("folio") or 0)
        fecha_str  = row.get("Fecha Emisión") or row.get("fecha_emision") or ""
        monto_neto = self._parse_amount(row.get("Monto Neto") or row.get("neto") or "0")
        monto_iva  = self._parse_amount(row.get("IVA") or row.get("iva") or "0")
        monto_total= self._parse_amount(row.get("Monto Total") or row.get("total") or "0")

        if not rut_emisor or not folio:
            raise ValueError(f"RUT o folio vacío: rut={rut_emisor!r}, folio={folio!r}")

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

        fecha_dt = self._parse_date(fecha_str)

        # Buscar proveedor existente por RUT
        vendor = (
            self.db.query(Vendor)
            .filter(Vendor.tax_id == rut_emisor)
            .first()
        )

        return PurchaseInvoice(
            document_type=doc_type,
            folio=folio,
            fecha_emision=fecha_dt,
            rut_emisor=rut_emisor,
            razon_social_emisor=razon_social,
            vendor_id=vendor.id if vendor else None,
            monto_neto=monto_neto,
            monto_iva=monto_iva,
            monto_total=monto_total,
            status="pendiente",
            source="sii_import",
            sii_import_batch_id=batch_id,
        )

    @staticmethod
    def _clean_rut(rut: str) -> str:
        """Normaliza RUT: elimina puntos, conserva guión, pone en mayúsculas."""
        return rut.strip().replace(".", "").replace(" ", "").upper()

    @staticmethod
    def _parse_amount(value: str) -> float:
        """
        Parsea montos en formato chileno SII:
        '1.234.567'  → 1 234 567.0
        '1.234.567,89' → 1 234 567.89
        """
        cleaned = (
            str(value)
            .strip()
            .replace("$", "")
            .replace(" ", "")
        )
        # Si hay coma, asumimos que es separador decimal (1.234.567,89)
        if "," in cleaned:
            cleaned = cleaned.replace(".", "").replace(",", ".")
        else:
            # Sin coma: los puntos son separadores de miles
            cleaned = cleaned.replace(".", "")
        try:
            return float(cleaned) if cleaned else 0.0
        except ValueError:
            return 0.0

    @staticmethod
    def _parse_date(date_str: str) -> datetime:
        """Parsea fechas en formato DD/MM/YYYY, YYYY-MM-DD o DD-MM-YYYY."""
        date_str = date_str.strip()
        for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        # Si no parsea, usar ahora
        return datetime.utcnow()
