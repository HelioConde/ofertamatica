// Auditoria de navegabilidade real do HTML entregue ao Googlebot.
// Falhas devem impedir a publicação de links 404, canonicals divergentes
// e sitemaps que anunciem páginas ausentes.
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { INDEXABLE_PAGES, SITE_URL } from '../src/seo/seoPages.js'

const dist = path.resolve('dist')
const routes = ['/', ...INDEXABLE_PAGES.map((page) => '/' + page.slug + '/'), '/validade-zero/']
const routeSet = new Set(routes)
// O app integra o mesmo sitemap/SEO, com HTML inicial próprio e canonical direto.
const allowedLinks = routeSet
assert.equal(routeSet.size, routes.length, 'Slugs SEO duplicados')
const htmlFor = (route) => path.join(dist, route === '/' ? 'index.html' : route.slice(1) + 'index.html')
const canonicalFor = (route) => SITE_URL + route
const sitemapFile = path.join(dist, 'sitemap.xml')
assert.ok(fs.existsSync(sitemapFile), 'Sitemap ausente')
const sitemap = fs.readFileSync(sitemapFile, 'utf8')
const entries = [...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((match) => match[1].trim())
assert.equal(entries.length, routes.length, 'Sitemap deve conter apenas as URLs indexáveis previstas')
assert.equal(new Set(entries).size, entries.length, 'Sitemap com URLs repetidas')
for (const route of routes) {
  assert.ok(entries.includes(canonicalFor(route)), 'Sitemap sem URL canônica: ' + route)
}
for (const url of entries) {
  assert.ok(routes.some((route) => canonicalFor(route) === url), 'Sitemap anuncia URL não prevista: ' + url)
}

const graph = new Map()
const titlesByText = new Map()
const descriptionsByText = new Map()
let linksChecked = 0
for (const route of routes) {
  const file = htmlFor(route)
  assert.ok(fs.existsSync(file), 'HTML indexável ausente: ' + file)
  const html = fs.readFileSync(file, 'utf8')
  const expectedCanonical = canonicalFor(route)
  const canonicalMatches = [...html.matchAll(/<link\b[^>]*\brel="canonical"[^>]*>/gi)]
  assert.equal(canonicalMatches.length, 1, 'Canonical ausente ou duplicada: ' + route)
  assert.ok(canonicalMatches[0][0].includes('href="' + expectedCanonical + '"'), 'Canonical incorreta: ' + route)
  assert.ok(html.includes('<meta property="og:url" content="' + expectedCanonical + '"'), 'OG URL incorreta: ' + route)
  assert.equal((html.match(/<title>[^<]+<\/title>/gi) || []).length, 1, 'Título único ausente: ' + route)
  assert.ok(html.includes('<meta name="description" content="'), 'Meta descrição ausente: ' + route)
  const titles = [...html.matchAll(/<title>([^<]+)<\/title>/gi)]
  const title = titles[0]?.[1]?.trim() || ''
  const descriptions = [...html.matchAll(/<meta\s+name="description"\s+content="([^"]*)"\s*\/?\s*>/gi)]
  assert.equal(descriptions.length, 1, 'Meta descrição duplicada: ' + route)
  const description = descriptions[0]?.[1]?.trim() || ''
  assert.ok(title.length >= 15 && title.length <= 85, 'Título vazio, genérico ou excessivo: ' + route)
  assert.ok(description.length >= 65 && description.length <= 190, 'Descrição insuficiente ou longa demais: ' + route)
  assert.ok(!/\b(lorem ipsum|em construção|coming soon)\b/i.test(html), 'Conteúdo provisório em página indexável: ' + route)
  for (const [map, text, label] of [[titlesByText, title, 'Título'], [descriptionsByText, description, 'Descrição']]) {
    const previous = map.get(text.toLocaleLowerCase('pt-BR'))
    assert.ok(!previous, label + ' SEO duplicado entre ' + previous + ' e ' + route)
    map.set(text.toLocaleLowerCase('pt-BR'), route)
  }
  assert.ok(html.includes('<meta name="robots" content="index,follow'), 'Robots de página pública incorreto: ' + route)
  assert.equal((html.match(/<h1\b/gi) || []).length, 1, 'H1 único ausente do HTML inicial: ' + route)
  // Só <a href> é uma aresta de descoberta; texto em JS, JSON ou imagens
  // não pode ser contado como navegação para motores de busca.
  const outbound = new Set()
  for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
    const href = match[1].replaceAll('&amp;', '&')
    if (!href.startsWith('/')) continue
    const target = new URL(href, SITE_URL)
    const pathname = target.pathname
    assert.ok(allowedLinks.has(pathname), 'Link interno quebra navegação: ' + route + ' -> ' + href)
    if (routeSet.has(pathname)) outbound.add(pathname)
    linksChecked++
  }
  graph.set(route, outbound)
}

// Uma URL canônica presente no sitemap mas sem caminho de links a partir da
// home tem descoberta fraca e aumenta o risco de "Detectada, não indexada".
const reached = new Set(['/'])
const queue = ['/']
while (queue.length) {
  const current = queue.shift()
  for (const next of graph.get(current) || []) {
    if (reached.has(next)) continue
    reached.add(next)
    queue.push(next)
  }
}
const orphaned = routes.filter((route) => !reached.has(route))
assert.deepEqual(orphaned, [], 'Páginas sem caminho HTML desde a home: ' + orphaned.join(', '))
console.log('Grafo SEO aprovado: ' + routes.length + ' páginas canônicas, ' + linksChecked + ' links internos e nenhuma órfã.')
