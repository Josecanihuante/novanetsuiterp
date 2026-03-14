"""Paquete de la API v1."""
from fastapi import APIRouter

from app.api.v1 import (
    accounts,
    auth,
    bsc,
    customers,
    financial,
    import_netsuite,
    inventory,
    invoices,
    journal,
    taxes,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(bsc.router)
api_router.include_router(financial.router)
api_router.include_router(accounts.router)
api_router.include_router(journal.router)
api_router.include_router(import_netsuite.router)
api_router.include_router(invoices.router)
api_router.include_router(customers.router)
api_router.include_router(inventory.router)
api_router.include_router(taxes.router)
