"""Verificação de HTML da produção sem analisar conteúdo privado nem expor HTML de falha."""
from __future__ import annotations
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path


def inspect_production_html(html: str) -> dict:
    normalized = "".join(
        char for char in unicodedata.normalize("NFKD", html.lower())
        if not unicodedata.combining(char)
    )
    has_html = re.search(r"<html(?:\\s|>)", normalized) is not None
    has_root = re.search(r"""<div\\s+id=(["'])root\\1""", html, re.IGNORECASE) is not None
    has_brand = "ofertamatica" in normalized
    title = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    title_text = re.sub(r"<[^>]+>", "", title.group(1)).strip()[:120] if title else ""
    result = {
        "status": "ready" if has_html and has_root and has_brand else "unexpected_content",
        "has_html": has_html,
        "has_root": has_root,
        "has_brand": has_brand,
        "title": title_text,
        "bytes": len(html.encode("utf-8")),
        "sha256": hashlib.sha256(html.encode("utf-8")).hexdigest(),
    }
    return result


def main() -> int:
    if len(sys.argv) != 3:
        print("Uso: check-production-html.py <entrada.html> <diagnostico.json>", file=sys.stderr)
        return 2
    source = Path(sys.argv[1])
    destination = Path(sys.argv[2])
    try:
        document = source.read_text(encoding="utf-8", errors="replace")
        result = inspect_production_html(document)
    except OSError as exc:
        result = {"status": "read_error", "error_type": type(exc).__name__}
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Verificação de identidade:", result["status"], "| detalhes em", destination)
    if result["status"] != "ready":
        print(
            "HTML inesperado. Verifique status, redirects e camada de cache da hospedagem. "
            "Nenhum corpo HTML será exposto nos logs.",
            file=sys.stderr,
        )
    return 0 if result["status"] == "ready" else 1


if __name__ == "__main__":
    raise SystemExit(main())
