import fs from 'node:fs'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

// FTP production guard: the app must never switch its index.html before all
// referenced hashed JS and CSS are readable by users on the real host.
const ORIGIN = process.env.OFERTAMATICA_ORIGIN || 'https://ofertamatica.com.br'
const buildIndex = fs.readFileSync(path.resolve('dist/index.html'), 'utf8')
const mode = process.argv[2]
if (!['--assets-only', '--html-and-assets'].includes(mode)) {
  console.error('Use --assets-only or --html-and-assets')
  process.exit(2)
}

function assetReferences(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
  const styles = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
  return [...new Set([...scripts, ...styles])]
    .filter((item) => /^\/assets\/.+\.(js|css)(\?.*)?$/.test(item))
}

const references = assetReferences(buildIndex)
if (!references.some((item) => item.endsWith('.js')) ||
    !references.some((item) => item.endsWith('.css'))) {
  console.error('Build sem referências ao bundle JS/CSS de produção. Não publicar.')
  process.exit(1)
}
for (const resource of references) {
  const local = path.resolve('dist', resource.replace(/^\//, '').split('?')[0])
  if (!local.startsWith(path.resolve('dist') + path.sep) || !fs.existsSync(local)) {
    throw new Error('O HTML aponta para arquivo ausente no build: ' + resource)
  }
}

async function attemptCheck() {
  const problems = []
  for (const resource of references) {
    try {
      const url = new URL(resource, ORIGIN)
      url.searchParams.set('build-check', String(Date.now()))
      const response = await fetch(url, {
        headers: { 'cache-control': 'no-cache', 'user-agent': 'Ofertamatica-Production-Assets-QA/1.0' },
        signal: AbortSignal.timeout(18000),
      })
      const type = response.headers.get('content-type') || ''
      const js = resource.includes('.js')
      if (!response.ok ||
          (js && !/javascript|ecmascript/i.test(type)) ||
          (!js && !/text\/css/i.test(type))) {
        problems.push(resource + ': status=' + response.status + ', tipo=' + (type || '(ausente)'))
      }
      await response.body?.cancel()
    } catch (error) {
      problems.push(resource + ': ' + (error?.message || String(error)))
    }
  }
  if (mode === '--html-and-assets') {
    try {
      const url = new URL('/', ORIGIN)
      url.searchParams.set('html-check', String(Date.now()))
      const response = await fetch(url, {
        headers: { 'cache-control': 'no-cache', 'user-agent': 'Ofertamatica-Production-HTML-QA/1.0' },
        signal: AbortSignal.timeout(18000),
      })
      const html = await response.text()
      if (!response.ok || !/text\/html/i.test(response.headers.get('content-type') || '')) {
        problems.push('HTML principal indisponível: HTTP ' + response.status)
      }
      for (const resource of references) {
        if (!html.includes(resource)) {
          problems.push('HTML publicado ainda não contém o asset: ' + resource)
        }
      }
    } catch (error) {
      problems.push('HTML principal: ' + (error?.message || String(error)))
    }
  }
  return problems
}

const MAX_ATTEMPTS = 8
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const problems = await attemptCheck()
  if (!problems.length) {
    console.log('OK: ' + references.length + ' assets JS/CSS publicados' +
      (mode === '--html-and-assets' ? ' e index.html usando o bundle correto.' : ', seguros para a troca do HTML.'))
    process.exit(0)
  }
  console.warn('Verificação ' + attempt + '/' + MAX_ATTEMPTS + ': ' + problems.join(' | '))
  if (attempt < MAX_ATTEMPTS) await sleep(8000)
}
console.error('Deploy inseguro: falta JS/CSS ou o HTML referencia outra versão. Interrompendo.')
process.exitCode = 1
