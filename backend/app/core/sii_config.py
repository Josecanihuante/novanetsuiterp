"""Configuración del ambiente SII."""
from enum import Enum
from app.core.config import settings


class SIIAmbiente(str, Enum):
    CERTIFICACION = "CERTIFICACION"
    PRODUCCION    = "PRODUCCION"


class SIIConfig:
    ambiente: SIIAmbiente          = SIIAmbiente(settings.SII_AMBIENTE)
    rut_empresa: str               = settings.SII_RUT_EMPRESA
    cert_path: str                 = settings.SII_CERT_PATH
    cert_password: str             = settings.SII_CERT_PASSWORD
    resolucion_numero: int         = int(settings.SII_RESOLUCION_NUMERO or 0)
    resolucion_fecha: str          = settings.SII_RESOLUCION_FECHA

    @property
    def is_produccion(self) -> bool:
        return self.ambiente == SIIAmbiente.PRODUCCION

    @property
    def sii_url(self) -> str:
        if self.is_produccion:
            return "https://palena.sii.cl"
        return "https://maullin.sii.cl"   # ambiente certificación


sii_config = SIIConfig()
