"""
Paquete de modelos SQLAlchemy.
Importar aquí todos los modelos para que Alembic los detecte automáticamente.
"""
from app.models.account import Account, Period  # noqa: F401
from app.models.customer import Customer, Vendor  # noqa: F401
from app.models.invoice import Invoice, InvoiceItem  # noqa: F401
from app.models.journal import JournalEntry, JournalLine  # noqa: F401
from app.models.product import Product, StockMovement  # noqa: F401
from app.models.tax import PpmPayment, TaxConfig, TaxResult  # noqa: F401
from app.models.user import User  # noqa: F401

__all__ = [
    "User",
    "Account",
    "Period",
    "JournalEntry",
    "JournalLine",
    "Customer",
    "Vendor",
    "Invoice",
    "InvoiceItem",
    "Product",
    "StockMovement",
    "TaxConfig",
    "PpmPayment",
    "TaxResult",
]
