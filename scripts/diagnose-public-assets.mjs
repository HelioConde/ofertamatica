import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'

// Diagnóstico PASSIVO de conteúdo servido a visitantes HTTP externos.
// Nunca executa desafio, desabilita proteção, envia segredos ou troca HTML.
// Hash SHA-256 compara o arquivo recebido ao build local; MIME sozinho não basta.
const origin = process.env.OFERTAMATICA_ORIGIN || 'https://ofertamatica.com.br'
const htmlPath = resolve('dist/index.html')
if (!existsSync(htmlPath)) {
  console.log('[public-assets] dist/index.html indisponível: execute npm run build primeiro')
  process.exit(0)
}
const html = readFileSync(htmlPath, 'utf8')
const refs = [...new Set([
  ...Array.from(html.matchAll(/<script\b[^>]*type=["']module["'][^>]*src=["'](\/assets\/[^"']+\.js)["']/gi), m => m[1]),
  ...Array.from(html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["'](\/assets\/[^"']+\.css)["']/gi), m => m[1]),
])]
const classification = (status, type, body, resource, localSha) => {
  const isJs = resource.endsWith('.js')
  const expectedMime = isJs ? /javascript|ecmascript/i : /text\/css/i
  if (status !== 200) return 'http_error'
  if (/text\/html/i.test(type)) {
    const sample = body.subarray(0, 20000).toString('utf8').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    return /verificacao de seguranca|checking your browser|just a moment|security verification|captcha|anti.?bot/.test(sample)
      ? 'security_challenge'
      : 'html_instead_of_asset'
  }
  if (!expectedMime.test(type)) return 'wrong_content_type'
  const sha = createHash('sha256').update(body).digest('hex')
  return sha === localSha ? 'valid_asset_sha256' : 'unexpected_asset_bytes'
}
const reports = []
for (const resource of refs) {
  const local = resolve('dist', resource.slice(1))
  if (!local.startsWith(resolve('dist') + '/') || !existsSync(local)) {
    reports.push({ path: resource, variant: 'local', result: 'missing_local_asset' })
    continue
  }
  const sha = createHash('sha256').update(readFileSync(local)).digest('hex')
  for (const variant of ['browser_url', 'cache_busted_url']) {
    const url = new URL(resource, origin)
    if (variant === 'cache_busted_url') url.searchParams.set('build-check', String(Date.now()))
    try {
      const response = await fetch(url, {
        headers: variant === 'cache_busted_url'
          ? { 'cache-control': 'no-cache', 'user-agent': 'Ofertamatica-Production-Assets-QA/1.0' }
          : { accept: resource.endsWith('.js') ? 'application/javascript,*/*;q=0.8' : 'text/css,*/*;q=0.8' },
        signal: AbortSignal.timeout(16000),
      })
      const bytes = Buffer.from(await response.arrayBuffer())
      reports.push({
        path: resource,
        variant,
        status: response.status,
        mime: (response.headers.get('content-type') || '').split(';')[0],
        bytes: bytes.byteLength,
        result: classification(response.status, response.headers.get('content-type') || '', bytes, resource, sha),
      })
    } catch (e) {
      reports.push({ path: resource, variant, result: 'network_error', errorType: e.name || 'Error' })
    }
  }
}
for (const row of reports) {
  console.log('[public-assets]', JSON.stringify(row))
  if (row.result === 'security_challenge') console.log('::warning::Proteção HTTP substituiu ' + row.path + ' (' + row.variant + ') por HTML')
  if (row.result === 'html_instead_of_asset') console.log('::warning::Servidor retornou HTML em vez de ' + row.path + ' (' + row.variant + ')')
}
const folder = 'artifacts/public-access'
mkdirSync(folder, { recursive: true })
writeFileSync(folder + '/asset-delivery-diagnostics.json', JSON.stringify({
  checkedAtUTC: new Date().toISOString(),
  origin,
  reports,
  note: 'Evidências sem IP, cookies, cabeçalhos de autenticação ou corpo HTML. Hash do recurso verificado, não publicado.',
}, null, 2) + '\n')
console.log('[public-assets] Diagnóstico concluído sem modificar a produção; falhas da rede não aprovam deploy.')
