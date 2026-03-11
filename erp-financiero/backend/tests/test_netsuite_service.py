"""Tests para netsuite_service — fixture en memoria con openpyxl."""
from io import BytesIO

import pytest
from openpyxl import Workbook

from app.services.netsuite_service import COLUMNAS, parse_netsuite_excel


def _build_excel(rows: list[list]) -> bytes:
    """Crea un archivo Excel en memoria con los encabezados de NetSuite y las filas dadas."""
    wb = Workbook()
    ws = wb.active
    ws.append(COLUMNAS)
    for row in rows:
        ws.append(row)
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ── Fila válida de ejemplo ────────────────────────────────────────────────────
VALID_ROW = [
    "1100", "Caja", "Asset", "03/10/2025", "DOC-001",
    "Proveedor X", "Pago servicios", 5000.0, 0.0, 5000.0, "CLP",
    "Filial Chile", "Contabilidad", "Clase A",
]


def _make_dataset() -> bytes:
    """
    5 filas válidas + 1 con Debit no numérico + 1 con Date en formato YYYY-MM-DD.
    Resulta en valid_rows=5 y errors=2.
    """
    valid_rows = [VALID_ROW[:] for _ in range(5)]
    row_bad_debit = VALID_ROW[:]
    row_bad_debit[7] = "no_es_numero"   # columna Debit
    row_bad_date = VALID_ROW[:]
    row_bad_date[3] = "2025-03-10"      # formato YYYY-MM-DD en lugar de MM/DD/YYYY

    return _build_excel(valid_rows + [row_bad_debit, row_bad_date])


def test_parse_valid_and_errors():
    """Verifica: valid_rows=5 y errors=2."""
    file_bytes = _make_dataset()
    result = parse_netsuite_excel(file_bytes)
    assert result["valid_count"] == 5
    assert result["error_count"] == 2
    assert result["total_rows"] == 7


def test_error_debit_no_numerico():
    """El error de Debit no numérico se reporta con código de columna correcto."""
    file_bytes = _make_dataset()
    result = parse_netsuite_excel(file_bytes)
    cols_con_error = [e["column"] for e in result["errors"]]
    assert "Debit" in cols_con_error


def test_error_date_formato_incorrecto():
    """El error de Date con formato YYYY-MM-DD se reporta correctamente."""
    file_bytes = _make_dataset()
    result = parse_netsuite_excel(file_bytes)
    cols_con_error = [e["column"] for e in result["errors"]]
    assert "Date" in cols_con_error


def test_valid_rows_estructura():
    """Las filas válidas tienen los campos mínimos requeridos."""
    file_bytes = _build_excel([VALID_ROW])
    result = parse_netsuite_excel(file_bytes)
    assert result["valid_count"] == 1
    row = result["valid_rows"][0]
    assert "account_code" in row
    assert "account_type" in row
    assert "debit" in row
    assert "credit" in row
    assert row["debit"] == 5000.0
    assert row["credit"] == 0.0


def test_columnas_faltantes_lanza_error():
    """Si faltan columnas requeridas, debe lanzar ValueError."""
    wb = Workbook()
    ws = wb.active
    ws.append(["Account", "Account Name"])  # encabezado incompleto
    ws.append(["1100", "Caja"])
    buf = BytesIO()
    wb.save(buf)
    file_bytes = buf.getvalue()

    with pytest.raises(ValueError, match="Columnas faltantes"):
        parse_netsuite_excel(file_bytes)


def test_tipo_map_aplicado():
    """El TIPO_MAP convierte 'Asset' → 'asset'."""
    file_bytes = _build_excel([VALID_ROW])
    result = parse_netsuite_excel(file_bytes)
    assert result["valid_rows"][0]["account_type"] == "asset"
