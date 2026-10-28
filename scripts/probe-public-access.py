"""Diagnóstico de acesso público: sem dados pessoais, cookies ou simulação do Googlebot."""
from __future__ import annotations

import hashlib
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

BASE = "https://ofertamatica.com.br"
PATHS = ["/", "/modelos/", "/placas-para-hortifruti/", "/robots.txt", "/ads.txt"]
HTML_PATHS = {"/", "/modelos/", "/placas-para-hortifruti/"}


def fold(value: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", value.casefold())
                   if not unicodedata.combining(c))


def classify(path: str, status: int, content_type: str, body: bytes) -> dict:
    # Avoid ever writing bodies, IP addresses, cookies or full response headers.
    snippet = body[:150000].decode("utf-8", errors="replace")
    normalized = fold(snippet)
    match = re.search(r"<title[^>]*>(.*?)</title>", snippet, re.I | re.S)
    title = re.sub(r"<[^>]+>", "", match.group(1)).strip()[:100] if match else ""
    if "verificacao de seguranca" in fold(title) or (
        "verificacao de seguranca" in normalized[:12000]
        and 'id="root"' not in snippet
    ):
        outcome = "security_challenge"
    elif status != 200:
        outcome = "http_error"
    elif path in HTML_PATHS:
        has_root = bool(re.search(r"""<div\s+id=(["'])root\1""", snippet, re.I))
        outcome = "ok" if has_root and "ofertamatica" in normalized and "html" in content_type.lower() else "unexpected_html"
    elif path == "/robots.txt":
        outcome = "ok" if "user-agent:" in normalized and "sitemap:" in normalized else "unexpected_text"
    elif path == "/ads.txt":
        outcome = "ok" if "google.com, pub-9514218545388169, direct" in normalized else "unexpected_text"
    else:
        outcome = "unexpected_path"
    return {
        "path": path, "outcome": outcome, "http_status": status,
        "title": title, "body_bytes": len(body),
        "body_sha256": hashlib.sha256(body).hexdigest(),
        "content_type": content_type.split(";")[0].strip()[:70],
    }


def probe(path: str) -> dict:
    request = Request(BASE + path, headers={
        "User-Agent": "Ofertamatica-PublicAvailabilityCheck/1.0",
        "Accept": "text/html,text/plain;q=0.8,*/*;q=0.1",
    })
    try:
        with urlopen(request, timeout=20) as response:
            return classify(path, response.status, response.headers.get("content-type", ""), response.read(250000))
    except HTTPError as exc:
        return classify(path, exc.code, exc.headers.get("content-type", ""), exc.read(250000))
    except (URLError, TimeoutError, OSError) as exc:
        return {"path": path, "outcome": "network_error", "error_type": type(exc).__name__}


def main() -> int:
    report_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("performance/public-access")
    report_dir.mkdir(parents=True, exist_ok=True)
    checks = [probe(path) for path in PATHS]
    report = {
        "checked_at_utc": datetime.now(timezone.utc).isoformat(),
        "base": BASE,
        "checks": checks,
        "note": "Verificação externa independente; não imita Googlebot nem prova acesso de rastreadores do Google.",
    }
    output = report_dir / "public-crawl-health.json"
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    for check in checks:
        print(f"{check['path']}: {check['outcome']} (HTTP {check.get('http_status', 'n/a')})")
    print("Relatório:", output)
    if any(check["outcome"] == "security_challenge" for check in checks):
        print("ALERTA: página de verificação de segurança substituiu o conteúdo. "
              "Ver docs/ADSENSE_ACESSO_HOSPEDAGEM.md. Verifique regras WAF com a hospedagem.",
              file=sys.stderr)
    return 0 if all(check["outcome"] == "ok" for check in checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
