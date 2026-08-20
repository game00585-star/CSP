import json
import math
import sys
from pathlib import Path

import openpyxl


def text(value):
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).replace("\u00a0", " ").strip()


def number(value):
    try:
        value = float(value)
        return value if math.isfinite(value) else 0
    except (TypeError, ValueError):
        return 0


def unit(value):
    value = text(value)
    return {"กก.": "กิโลกรัม", "กก": "กิโลกรัม"}.get(value, value or "หน่วย")


def extract(path, warehouse):
    sheet = openpyxl.load_workbook(path, data_only=True, read_only=True).active
    products = []
    for row_number, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), 2):
        code = text(row[1] if len(row) > 1 else None)
        name = text(row[3] if len(row) > 3 else None)
        if not code or not name:
            continue
        min_index, max_index = (18, 19) if warehouse == "IN" else (15, 16)
        products.append(
            {
                "id": f"XLS-{warehouse}-{len(products) + 1:04d}",
                "barcode": "",
                "productCode": code,
                "productName": name,
                "warehouseGroup": warehouse,
                "unit": unit(row[6] if len(row) > 6 else None),
                "packSize": number(row[4] if len(row) > 4 else None),
                "currentStock": number(row[5] if len(row) > 5 else None),
                "minStock": number(row[min_index] if len(row) > min_index else None),
                "maxStock": number(row[max_index] if len(row) > max_index else None),
                "active": True,
                "note": text(row[-1] if row else None),
                "sourceFile": Path(path).name,
                "sourceRow": row_number,
                "createdAt": "2026-08-20T00:00:00",
                "updatedAt": "2026-08-20T00:00:00",
            }
        )
    return products


in_products = extract(sys.argv[1], "IN")
pk_products = extract(sys.argv[2], "PK")
payload = (
    "// Generated from the approved PK.xlsx and IN.xlsx source files.\n"
    "// Product identity intentionally includes both productCode and productName so duplicate codes remain separate.\n"
    f"export const pkInCatalogVersion='2026-08-20-pk-in-v1';\n"
    f"export const pkProducts={json.dumps(pk_products, ensure_ascii=False, separators=(',', ':'))};\n"
    f"export const inProducts={json.dumps(in_products, ensure_ascii=False, separators=(',', ':'))};\n"
    "export const pkInCatalogProducts=[...pkProducts,...inProducts];\n"
)
Path(sys.argv[3]).write_text(payload, encoding="utf-8")
print(json.dumps({"PK": len(pk_products), "IN": len(in_products)}, ensure_ascii=False))
