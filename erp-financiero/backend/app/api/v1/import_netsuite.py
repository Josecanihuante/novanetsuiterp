"""Router Importación NetSuite (Preview + Confirm)."""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.repositories.account_repository import AccountRepository, PeriodRepository
from app.repositories.journal_repository import JournalRepository
from app.schemas.journal import JournalEntryCreate, JournalLineCreate
from app.services.netsuite_service import parse_netsuite_excel
from datetime import datetime, timezone

router = APIRouter(prefix="/import", tags=["Import"])


def _rbac_write(user: User):
    if user.role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Sin permisos para importar."}},
        )


@router.post(
    "/netsuite/preview",
    response_model=dict,
    summary="Vista previa de importación NetSuite",
)
async def netsuite_preview(
    file: UploadFile = File(..., description="Archivo .xlsx exportado desde NetSuite"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Parsea el Excel y retorna un preview con las filas válidas y los errores
    encontrados, sin insertar nada en la base de datos.
    """
    _rbac_write(current_user)

    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"success": False, "error": {"code": "INVALID_FILE_TYPE", "message": "Solo se aceptan archivos .xlsx"}},
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"success": False, "error": {"code": "EMPTY_FILE", "message": "El archivo está vacío."}},
        )

    try:
        result = parse_netsuite_excel(file_bytes)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"success": False, "error": {"code": "INVALID_STRUCTURE", "message": str(e)}},
        )

    return {"success": True, "data": result}


@router.post(
    "/netsuite/confirm",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Confirmar e importar batch NetSuite",
)
def netsuite_confirm(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Recibe el batch previamente validado (valid_rows) y lo inserta en journal_entries.
    Agrupa las filas por Document Number para crear un asiento por documento.
    """
    _rbac_write(current_user)

    valid_rows: list[dict] = body.get("valid_rows", [])
    period_id: str = body.get("period_id", "")

    if not valid_rows:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"success": False, "error": {"code": "NO_VALID_ROWS", "message": "No hay filas válidas para importar."}},
        )

    period_repo = PeriodRepository(db)
    period = period_repo.get_by_id(period_id)
    if not period:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"code": "PERIOD_NOT_FOUND", "message": "Período no encontrado."}},
        )

    account_repo = AccountRepository(db)
    journal_repo = JournalRepository(db)

    # Agrupar por Document Number
    docs: dict[str, list] = {}
    for row in valid_rows:
        doc = row.get("document_number") or "SIN_DOCUMENTO"
        docs.setdefault(doc, []).append(row)

    created_ids = []
    for doc_number, rows in docs.items():
        # Asegurar que las cuentas existan (upsert simple)
        for row in rows:
            if row.get("account_code") and not account_repo.get_by_code(str(row["account_code"])):
                from app.schemas.account import AccountCreate
                account_repo.create(AccountCreate(
                    code=str(row["account_code"]),
                    name=row.get("account_name") or str(row["account_code"]),
                    account_type=row.get("account_type", "expense"),
                ))

        lines = []
        for row in rows:
            acct = account_repo.get_by_code(str(row["account_code"]))
            if acct:
                lines.append(JournalLineCreate(
                    account_id=acct.id,
                    debit=row.get("debit", 0) or 0,
                    credit=row.get("credit", 0) or 0,
                    description=row.get("description"),
                ))

        if not lines:
            continue

        entry_data = JournalEntryCreate(
            period_id=period_id,
            entry_number=f"NS-{doc_number}",
            entry_date=datetime.now(timezone.utc),
            description=f"Importado desde NetSuite — Doc: {doc_number}",
            status="draft",
            lines=lines,
        )
        try:
            entry = journal_repo.create(entry_data, created_by=current_user.id)
            created_ids.append(entry.id)
        except Exception:
            continue  # No abortar el batch completo por un asiento inválido

    return {
        "success": True,
        "data": {
            "created_entries": len(created_ids),
            "entry_ids": created_ids,
            "message": f"{len(created_ids)} asiento(s) importado(s) correctamente.",
        },
    }
