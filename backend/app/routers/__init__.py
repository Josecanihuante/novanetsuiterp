"""Paquete de la API v1."""
from fastapi import APIRouter

from app.routers import (
    accounts,
    accounting_engine_router,
    auth,
    bsc,
    customers,
    financial,
    import_netsuite,
    inventory,
    invoices,
    journal,
    periods,
    sii,
    taxes,
    user_management,
    users,
    vendors,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(periods.router)
api_router.include_router(bsc.router)
api_router.include_router(financial.router)
api_router.include_router(accounts.router)
api_router.include_router(journal.router)
api_router.include_router(import_netsuite.router)
api_router.include_router(invoices.router)
api_router.include_router(customers.router)
api_router.include_router(vendors.router)
api_router.include_router(inventory.router)
api_router.include_router(taxes.router)
api_router.include_router(sii.router)
api_router.include_router(accounting_engine_router.router)
api_router.include_router(user_management.router)
