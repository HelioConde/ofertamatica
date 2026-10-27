"""Testes da inspeção pré-Lighthouse, incluindo HTML de falha 200 sem aplicação."""
import unittest
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

file = Path(__file__).with_name("check-production-html.py")
spec = spec_from_file_location("check_production_html", file)
module = module_from_spec(spec)
spec.loader.exec_module(module)


class TestCheckProductionHTML(unittest.TestCase):
    def test_real_shell_with_accent(self):
        html = '<!doctype html><html lang="pt-BR"><head><title>Ofertamática</title></head><body><div id="root"></div></body></html>'
        result = module.inspect_production_html(html)
        self.assertEqual(result["status"], "ready")
        self.assertTrue(result["has_root"])

    def test_unexpected_but_200(self):
        html = '<html><head><title>Website temporariamente indisponível</title></head><body>Erro do proxy</body></html>'
        result = module.inspect_production_html(html)
        self.assertEqual(result["status"], "unexpected_content")
        self.assertFalse(result["has_brand"])

    def test_branded_error_without_root(self):
        html = '<html><head><title>Ofertamatica - manutenção</title></head><body>Volte depois</body></html>'
        result = module.inspect_production_html(html)
        self.assertEqual(result["status"], "unexpected_content")
        self.assertFalse(result["has_root"])

    def test_root_with_single_quotes(self):
        html = "<html><head><title>Ofertamatica</title></head><body><div class='root'><div id='root'></div></div></body></html>"
        self.assertEqual(module.inspect_production_html(html)["status"], "ready")


if __name__ == "__main__":
    unittest.main()
