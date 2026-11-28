"""Parse uploaded Excel / CSV files into plain JSON-able sheets for the Excel Folders page."""

import csv
import datetime
import io
import zipfile
from decimal import Decimal

from openpyxl import load_workbook
from rest_framework import status

from .exceptions import ApiError

MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_TOTAL_ROWS = 50_000
MAX_COLUMNS = 200

EXCEL_EXTENSIONS = ('.xlsx', '.xlsm')
CSV_EXTENSIONS = ('.csv',)
SUPPORTED_EXTENSIONS = EXCEL_EXTENSIONS + CSV_EXTENSIONS


def _cell_value(value):
    """Convert a cell to something JSON can hold, keeping numbers as numbers."""
    if value is None:
        return ''
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    if isinstance(value, datetime.datetime):
        if value.time() == datetime.time(0, 0):
            return value.date().isoformat()
        return value.isoformat(sep=' ', timespec='minutes')
    if isinstance(value, (datetime.date, datetime.time)):
        return value.isoformat()
    if isinstance(value, float):
        return int(value) if value.is_integer() else value
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, int):
        return value
    return str(value).strip()


def _is_blank(row):
    return all(cell == '' for cell in row)


def _build_sheet(name, raw_rows, budget):
    """Turn raw rows into {name, headers, rows}; the first non-empty row becomes the header."""
    rows = []
    for raw in raw_rows:
        row = [_cell_value(v) for v in raw[:MAX_COLUMNS]]
        if not _is_blank(row):
            rows.append(row)
        if len(rows) > budget + 1:  # +1 for the header row
            raise ApiError(
                f'This file has too many rows. The limit is {MAX_TOTAL_ROWS:,} rows per file.',
                status.HTTP_400_BAD_REQUEST,
            )

    if not rows:
        return {'name': name, 'headers': [], 'rows': []}

    width = max(len(r) for r in rows)
    # Drop columns that are empty in every row (common at the right edge of Excel sheets).
    used = [c for c in range(width) if any(c < len(r) and r[c] != '' for r in rows)]
    rows = [[r[c] if c < len(r) else '' for c in used] for r in rows]

    header_row, data_rows = rows[0], rows[1:]
    headers, seen = [], {}
    for idx, value in enumerate(header_row):
        label = str(value).strip() or f'Column {idx + 1}'
        seen[label] = seen.get(label, 0) + 1
        headers.append(label if seen[label] == 1 else f'{label} ({seen[label]})')

    return {'name': name, 'headers': headers, 'rows': data_rows}


def _parse_excel(content):
    try:
        workbook = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    except (zipfile.BadZipFile, KeyError, ValueError, OSError):
        raise ApiError('This file could not be read as an Excel workbook. Is it damaged or password-protected?')

    sheets, remaining = [], MAX_TOTAL_ROWS
    try:
        for worksheet in workbook.worksheets:
            sheet = _build_sheet(worksheet.title, worksheet.iter_rows(values_only=True), remaining)
            remaining -= len(sheet['rows'])
            sheets.append(sheet)
    finally:
        workbook.close()
    return sheets


def _parse_csv(content, filename):
    for encoding in ('utf-8-sig', 'cp1252'):
        try:
            text = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise ApiError('This CSV file uses an unsupported text encoding.')

    try:
        dialect = csv.Sniffer().sniff(text[:4096], delimiters=',;\t')
    except csv.Error:
        dialect = csv.excel
    reader = csv.reader(io.StringIO(text), dialect)
    name = filename.rsplit('.', 1)[0][:31] or 'Sheet1'
    return [_build_sheet(name, (list(r) for r in reader), MAX_TOTAL_ROWS)]


def parse_upload(uploaded_file):
    """Return (content_bytes, sheets) for an uploaded file, or raise ApiError."""
    filename = uploaded_file.name or ''
    lower = filename.lower()

    if lower.endswith('.xls'):
        raise ApiError('Old .xls files are not supported. Open the file in Excel and use "Save As" → .xlsx.')
    if not lower.endswith(SUPPORTED_EXTENSIONS):
        raise ApiError('Please upload an Excel (.xlsx) or CSV (.csv) file.')
    if uploaded_file.size > MAX_FILE_BYTES:
        raise ApiError(f'File is too large. The maximum size is {MAX_FILE_BYTES // (1024 * 1024)} MB.')

    content = uploaded_file.read()
    if not content:
        raise ApiError('The uploaded file is empty.')

    sheets = _parse_csv(content, filename) if lower.endswith(CSV_EXTENSIONS) else _parse_excel(content)
    if not any(sheet['headers'] for sheet in sheets):
        raise ApiError('The uploaded file does not contain any data.')
    return content, sheets
