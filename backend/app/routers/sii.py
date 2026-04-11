"""Endpoints de integración SII / DTE Chile."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.sii_config import sii_config
from app.models.sii import CafFolios, DteEmitido
from app.models.users import User
from app.services.sii_service import SIIService

router = APIRouter(prefix="/sii", tags=["SII - DTE"])


# ── Guard de rol ─────────────────────────────────────────────────────────────

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Solo administradores pueden realizar esta acción."},
        )
    return current_user


# ── Estado de configuración SII ──────────────────────────────────────────────

@router.get("/status")
def sii_status(current_user: User = Depends(get_current_user)):
    """Retorna el estado actual de la configuración SII."""
    return {
        "success": True,
        "data": {
            "ambiente":         sii_config.ambiente.value,
            "rut_empresa":      sii_config.rut_empresa,
            "certificado_ok":   bool(sii_config.cert_path),
            "listo_produccion": sii_config.is_produccion and bool(sii_config.cert_path),
            "sii_url":          sii_config.sii_url,
        },
    }


# ── Emisión de DTE ───────────────────────────────────────────────────────────

@router.post("/invoices/{invoice_id}/emitir-dte")
def emitir_dte(
    invoice_id: UUID,
    document_type: int = Query(default=33, description="33=Factura Afecta | 34=Factura Exenta"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Emite un DTE para una factura existente.

    - `document_type=33` Factura Electrónica Afecta (con IVA) — más habitual.
    - `document_type=34` Factura Electrónica Exenta (sin IVA).

    En ambiente **CERTIFICACION** genera el registro sin enviar al SII.
    En ambiente **PRODUCCION** (con certificado) firma y envía al SII.
    """
    svc = SIIService(db)
    dte = svc.emitir_dte(invoice_id, document_type)
    return {
        "success": True,
        "data": {
            "dte_id":        str(dte.id),
            "folio":         dte.folio,
            "document_type": dte.document_type,
            "estado":        dte.estado_sii,
            "ambiente":      dte.ambiente,
            "fecha_emision": str(dte.fecha_emision),
        },
    }


# ── Consulta de estado ───────────────────────────────────────────────────────

@router.get("/dte/{dte_id}/estado")
def estado_dte(
    dte_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Consulta el estado actual de un DTE (local o consultando al SII)."""
    svc = SIIService(db)
    return {"success": True, "data": svc.consultar_estado(dte_id)}


# ── Listado de DTEs ──────────────────────────────────────────────────────────

@router.get("/dte")
def listar_dtes(
    estado: Optional[str] = Query(default=None, description="Filtrar por estado"),
    document_type: Optional[int] = Query(default=None, description="Filtrar por tipo"),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista los DTEs emitidos con filtros opcionales."""
    svc = SIIService(db)
    dtes = svc.listar_dtes(estado=estado, document_type=document_type, limit=limit, offset=offset)
    return {
        "success": True,
        "data": [
            {
                "id":            str(d.id),
                "invoice_id":    str(d.invoice_id) if d.invoice_id else None,
                "document_type": d.document_type,
                "folio":         d.folio,
                "fecha_emision": str(d.fecha_emision),
                "rut_receptor":  d.rut_receptor,
                "razon_social":  d.razon_social_receptor,
                "monto_total":   int(d.monto_total),
                "estado_sii":    d.estado_sii,
                "track_id":      d.track_id,
                "ambiente":      d.ambiente,
                "created_at":    d.created_at.isoformat(),
            }
            for d in dtes
        ],
    }


# ── Anulación de DTE ─────────────────────────────────────────────────────────

@router.post("/dte/{dte_id}/anular")
def anular_dte(
    dte_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Anula un DTE emitido. Solo administradores."""
    svc = SIIService(db)
    dte = svc.anular_dte(dte_id)
    return {
        "success": True,
        "data": {"dte_id": str(dte.id), "estado": dte.estado_sii},
    }


# ── Carga de CAF ─────────────────────────────────────────────────────────────

@router.post("/caf/upload")
async def upload_caf(
    document_type: int = Query(description="Tipo de documento (33, 34, 39, 41, 56, 61)"),
    caf_file: UploadFile = File(..., description="Archivo XML del CAF entregado por el SII"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Sube el archivo CAF (Código de Autorización de Folios) entregado por el SII.

    Solo disponible para administradores.
    El archivo es el XML que entrega el SII al procesar tu solicitud de folios.
    """
    if not caf_file.filename or not caf_file.filename.lower().endswith(".xml"):
        raise HTTPException(
            status_code=400,
            detail={"code": "ARCHIVO_INVALIDO", "message": "El archivo debe ser un .xml"},
        )
    content = await caf_file.read()
    caf_xml = content.decode("utf-8")
    svc = SIIService(db)
    caf = svc.upload_caf(document_type, caf_xml)
    return {
        "success": True,
        "data": {
            "document_type":      caf.document_type,
            "folio_desde":        caf.folio_desde,
            "folio_hasta":        caf.folio_hasta,
            "folios_disponibles": caf.folio_hasta - caf.folio_desde + 1,
            "fecha_vencimiento":  str(caf.fecha_vencimiento) if caf.fecha_vencimiento else None,
        },
    }


# ── Folios disponibles ───────────────────────────────────────────────────────

@router.get("/folios/disponibles")
def folios_disponibles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Muestra los folios disponibles por tipo de documento."""
    cafs = (
        db.query(CafFolios)
        .filter(CafFolios.is_active == True)    # noqa: E712
        .all()
    )
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
        ],
    }
