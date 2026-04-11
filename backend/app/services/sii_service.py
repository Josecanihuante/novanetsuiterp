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

    # ── FOLIOS ───────────────────────────────────────────────────────────────

    def get_next_folio(self, document_type: int) -> int:
        """Obtiene y reserva el siguiente folio disponible para un tipo de DTE."""
        caf = (
            self.db.query(CafFolios)
            .filter(
                CafFolios.document_type == document_type,
                CafFolios.is_active == True,        # noqa: E712
                CafFolios.folio_actual <= CafFolios.folio_hasta,
            )
            .with_for_update()  # bloqueo de fila para evitar condición de carrera
            .first()
        )

        if not caf:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "code": "NO_FOLIOS_DISPONIBLES",
                    "message": (
                        f"No hay folios disponibles para el tipo de documento {document_type}. "
                        "Solicite más folios CAF en el SII."
                    ),
                },
            )

        folio = caf.folio_actual
        caf.folio_actual += 1

        if caf.folio_actual > caf.folio_hasta:
            caf.is_active = False
            logger.warning(
                "CAF agotado para tipo %s. Último folio usado: %s",
                document_type, folio,
            )

        self.db.flush()
        return folio

    def upload_caf(self, document_type: int, caf_xml: str) -> CafFolios:
        """Registra un nuevo CAF recibido del SII."""
        import xml.etree.ElementTree as ET

        try:
            root = ET.fromstring(caf_xml)
        except ET.ParseError as exc:
            raise HTTPException(
                status_code=400,
                detail={"code": "CAF_XML_INVALIDO", "message": f"El XML no es válido: {exc}"},
            )

        folio_desde = int(root.findtext(".//DESDE") or 0)
        folio_hasta  = int(root.findtext(".//HASTA") or 0)
        fecha_venc   = root.findtext(".//FA")  # fecha de autorización/vencimiento

        if not folio_desde or not folio_hasta or folio_desde > folio_hasta:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "CAF_INVALIDO",
                    "message": "El XML del CAF no tiene rango de folios válido.",
                },
            )

        # Desactivar CAFs anteriores del mismo tipo
        self.db.query(CafFolios).filter(
            CafFolios.document_type == document_type,
            CafFolios.is_active == True,    # noqa: E712
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
        logger.info(
            "CAF cargado: tipo=%s folios=%s-%s", document_type, folio_desde, folio_hasta
        )
        return caf

    # ── EMISIÓN DTE ──────────────────────────────────────────────────────────

    def emitir_dte(self, invoice_id: UUID, document_type: int = 33) -> DteEmitido:
        """
        Emite un DTE para una factura existente.

        - Ambiente CERTIFICACION: genera el registro pero NO envía al SII.
        - Ambiente PRODUCCION: firma y envía al SII (requiere certificado .p12).
        """
        invoice = self.db.get(Invoice, invoice_id)
        if not invoice:
            raise HTTPException(
                status_code=404,
                detail={"code": "INVOICE_NOT_FOUND", "message": "Factura no encontrada."},
            )

        # Verificar que no tenga DTE previo activo
        existing = (
            self.db.query(DteEmitido)
            .filter(
                DteEmitido.invoice_id == invoice_id,
                DteEmitido.estado_sii.notin_(["ANULADO", "RECHAZADO"]),
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "DTE_YA_EXISTE",
                    "message": f"Esta factura ya tiene un DTE emitido (folio {existing.folio}).",
                },
            )

        folio = self.get_next_folio(document_type)

        # Extraer RUT y razón social del receptor
        rut_receptor = invoice.customer.tax_id if invoice.customer else ""
        razon_social  = invoice.customer.name if invoice.customer else ""

        dte = DteEmitido(
            invoice_id=invoice_id,
            document_type=document_type,
            folio=folio,
            fecha_emision=date.today(),
            rut_receptor=str(rut_receptor),
            razon_social_receptor=razon_social,
            monto_neto=int(invoice.subtotal),
            monto_iva=int(invoice.tax_amount),
            monto_total=int(invoice.total),
            estado_sii="PENDIENTE",
            ambiente=sii_config.ambiente.value,
        )

        if sii_config.is_produccion and sii_config.cert_path:
            try:
                xml_firmado = self._generar_xml_firmado(invoice, dte)
                track_id    = self._enviar_sii(xml_firmado)
                dte.xml_firmado = xml_firmado
                dte.track_id    = track_id
                dte.estado_sii  = "ENVIADO"
                logger.info("DTE enviado al SII. Folio: %s, TrackID: %s", folio, track_id)
            except NotImplementedError:
                raise
            except Exception as exc:
                dte.estado_sii    = "PENDIENTE"
                dte.error_mensaje = str(exc)
                logger.error("Error enviando DTE al SII: %s", exc)
        else:
            logger.info(
                "DTE generado en ambiente %s. Folio: %s. Sin envío al SII.",
                sii_config.ambiente.value, folio,
            )

        self.db.add(dte)
        self.db.commit()
        self.db.refresh(dte)
        return dte

    def _generar_xml_firmado(self, invoice: Invoice, dte: DteEmitido) -> str:
        """
        Genera el XML del DTE firmado con el certificado digital.

        Requiere: cl-sii instalado + certificado .p12 configurado.
        Implementar en Fase 2 (producción).
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

    # ── CONSULTA ESTADO ──────────────────────────────────────────────────────

    def consultar_estado(self, dte_id: UUID) -> dict:
        """Consulta el estado de un DTE (local o en SII si hay certificado)."""
        dte = self.db.get(DteEmitido, dte_id)
        if not dte:
            raise HTTPException(
                status_code=404,
                detail={"code": "DTE_NOT_FOUND", "message": "DTE no encontrado."},
            )

        if not dte.track_id or not sii_config.is_produccion:
            return {
                "folio":    dte.folio,
                "estado":   dte.estado_sii,
                "ambiente": dte.ambiente,
                "mensaje":  (
                    "Consulta en SII no disponible en ambiente de certificación "
                    "o sin TrackID asignado."
                ),
            }

        # TODO: consultar estado real en SII cuando haya certificado
        return {
            "folio":    dte.folio,
            "estado":   dte.estado_sii,
            "track_id": dte.track_id,
        }

    # ── ANULACIÓN ────────────────────────────────────────────────────────────

    def anular_dte(self, dte_id: UUID) -> DteEmitido:
        """Anula un DTE emitido (en producción generaría Nota de Crédito tipo 61)."""
        dte = self.db.get(DteEmitido, dte_id)
        if not dte:
            raise HTTPException(
                status_code=404,
                detail={"code": "DTE_NOT_FOUND", "message": "DTE no encontrado."},
            )
        if dte.estado_sii in ["ANULADO", "RECHAZADO"]:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "DTE_YA_ANULADO",
                    "message": "Este DTE ya está anulado o rechazado.",
                },
            )

        dte.estado_sii = "ANULADO"
        dte.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(dte)
        logger.info("DTE anulado: id=%s folio=%s", dte_id, dte.folio)
        return dte

    # ── LISTADO ──────────────────────────────────────────────────────────────

    def listar_dtes(
        self,
        estado: Optional[str] = None,
        document_type: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[DteEmitido]:
        """Lista los DTEs emitidos con filtros opcionales."""
        q = self.db.query(DteEmitido)
        if estado:
            q = q.filter(DteEmitido.estado_sii == estado)
        if document_type:
            q = q.filter(DteEmitido.document_type == document_type)
        return q.order_by(DteEmitido.created_at.desc()).offset(offset).limit(limit).all()
