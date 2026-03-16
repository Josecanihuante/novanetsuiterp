"""Paquete de la API v1."""
from fastapi import APIRouter

from app.routers.accounts import router as accounts_router
from app.routers.auth import router as auth_router
from app.routers.bsc import router as bsc_router
from app.routers.bsc_snapshots import router as bsc_snapshots_router
from app.routers.customers import router as customers_router
from app.routers.financial import router as financial_router
from app.routers.import_netsuite import router as import_netsuite_router
from app.routers.inventory import router as inventory_router
from app.routers.invoices import router as invoices_router
from app.routers.journal import router as journal_router
from app.routers.journal_entries import router as journal_entries_router
from app.routers.periods import router as periods_router
from app.routers.ppm_payments import router as ppm_payments_router
from app.routers.tax_results import router as tax_results_router
from app.routers.taxes import router as taxes_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(bsc_router)
api_router.include_router(financial_router)
api_router.include_router(accounts_router)
api_router.include_router(journal_router)
api_router.include_router(journal_entries_router)
api_router.include_router(import_netsuite_router)
api_router.include_router(invoices_router)
api_router.include_router(customers_router)
api_router.include_router(inventory_router)
api_router.include_router(taxes_router)
api_router.include_router(periods_router)
api_router.include_router(ppm_payments_router)
api_router.include_router(bsc_snapshots_router)
api_router.include_router(tax_results_router)