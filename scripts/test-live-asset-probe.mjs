import assert from 'node:assert/strict'
import { browserAssetUrl, validAssetMime, unexpectedDocumentClass } from './live-asset-probe.mjs'

const origin = 'https://ofertamatica.com.br'
assert.equal(browserAssetUrl('/assets/index-abc123.js', origin).href, origin + '/assets/index-abc123.js')
assert.equal(browserAssetUrl('/assets/index-xyz987.css', origin).search, '')
assert.throws(() => browserAssetUrl('/assets/../index.html', origin), /inválida/)
assert.throws(() => browserAssetUrl('https://example.com/evil.js', origin), /inválida/)
assert.throws(() => browserAssetUrl('/assets/index-abc.js?build-check=123', origin), /inválida/)

assert.equal(validAssetMime('/assets/index-abc.js', 200, 'application/javascript; charset=utf-8'), true)
assert.equal(validAssetMime('/assets/index-abc.js', 200, 'text/javascript'), true)
assert.equal(validAssetMime('/assets/index-abc.css', 200, 'text/css; charset=utf-8'), true)
assert.equal(validAssetMime('/assets/index-abc.js', 200, 'text/html'), false)
assert.equal(validAssetMime('/assets/index-abc.css', 200, 'text/html'), false)
assert.equal(validAssetMime('/assets/index-abc.css', 404, 'text/css'), false)

const securityPage = '<html><head><title>Verificação de segurança</title></head><body>Confira seu navegador</body></html>'
const appShell = '<html><head><title>Ofertamática</title></head><body><div id="root"></div></body></html>'
assert.equal(unexpectedDocumentClass('text/html', securityPage), 'possivel_desafio_waf')
assert.equal(unexpectedDocumentClass('text/html', appShell), 'html_do_aplicativo_em_vez_de_asset')
assert.equal(unexpectedDocumentClass('text/html', '<html>Not found</html>'), 'html_inesperado_em_vez_de_asset')
assert.equal(unexpectedDocumentClass('text/plain', 'denied'), 'mime_incorreto')

console.log('QA assets: URLs reais sem cache-buster e diagnósticos seguros de MIME/WAF passaram.')
