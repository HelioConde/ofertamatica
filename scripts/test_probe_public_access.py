import unittest
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sys
path = Path(__file__).with_name("probe-public-access.py")
spec = spec_from_file_location("probe_public_access", path)
module = module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)
classify = module.classify


class TestPublicAccess(unittest.TestCase):
    def test_real_html(self):
        content = '<!doctype html><html><title>Ofertamática</title><div id="root"></div></html>'.encode()
        result = classify("/", 200, "text/html; charset=utf-8", content)
        self.assertEqual(result["outcome"], "ok")
        self.assertNotIn("body", result)

    def test_challenge_returns_200(self):
        html = '<html><head><title>Verificação de segurança</title></head><body>Confira seu navegador</body></html>'
        self.assertEqual(classify("/", 200, "text/html", html.encode())["outcome"], "security_challenge")

    def test_challenge_in_body(self):
        html = '<html><head><title>Aguarde</title></head><body>Verificação de segurança</body></html>'
        self.assertEqual(classify("/modelos/", 200, "text/html", html.encode())["outcome"], "security_challenge")

    def test_lost_html(self):
        self.assertEqual(classify("/", 200, "text/html", b'<html>Indisponivel</html>')["outcome"], "unexpected_html")

    def test_robots(self):
        self.assertEqual(classify("/robots.txt", 200, "text/plain", b'User-agent: *\nAllow: /\nSitemap: https://ofertamatica.com.br/sitemap.xml')["outcome"], "ok")

    def test_ads(self):
        self.assertEqual(classify("/ads.txt", 200, "text/plain", b'google.com, pub-9514218545388169, DIRECT, f08c47fec0942fa0')["outcome"], "ok")

    def test_http_failure(self):
        self.assertEqual(classify("/", 503, "text/html", b'<html>Service unavailable</html>')["outcome"], "http_error")


if __name__ == "__main__":
    unittest.main()
