"""Exportação CSV com escaping correto e BOM UTF-8 (para o Excel respeitar acentos)."""
import csv
import io


def _val(v):
    if v is None:
        return ''
    if hasattr(v, 'isoformat'):  # datetime/date
        return v.isoformat()
    return v


def to_csv(rows: list[dict], columns: list[str]) -> str:
    buf = io.StringIO()
    buf.write('﻿')  # BOM UTF-8
    writer = csv.DictWriter(buf, fieldnames=columns, extrasaction='ignore')
    writer.writeheader()
    for r in rows:
        writer.writerow({c: _val(r.get(c)) for c in columns})
    return buf.getvalue()
