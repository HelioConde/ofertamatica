import fs from 'node:fs'
import path from 'node:path'
import { INDEXABLE_PAGES, SEO_FAQS, SITE_URL } from '../src/seo/seoPages.js'

const dist = path.resolve('dist')
const indexPath = path.join(dist, 'index.html')
if (!fs.existsSync(indexPath)) process.exit(0)

const baseHtml = fs.readFileSync(indexPath, 'utf8')

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

function replaceMeta(html, page) {
  const canonical = `${SITE_URL}/${page.slug}/`
  return html
    .replace(/<title>.*?<\/title>/s, `<title>${esc(page.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${esc(page.description)}" />`)
    .replace(/<meta name="keywords" content="[^"]*"\s*\/>/, `<meta name="keywords" content="${esc(page.keywords)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(page.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(page.description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
}

function structuredData(page) {
  const canonical = `${SITE_URL}/${page.slug}/`
  const graph = [
    {
      '@type': 'WebPage',
      name: page.heading,
      description: page.description,
      url: canonical,
      isPartOf: { '@type': 'WebSite', name: 'Ofertamática', url: SITE_URL + '/' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ofertamática', item: SITE_URL + '/' },
        { '@type': 'ListItem', position: 2, name: page.heading, item: canonical },
      ],
    },
  ]

  // FAQ estruturada somente onde as perguntas também aparecem visivelmente na página.
  if (page.kind === 'seo') {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: SEO_FAQS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    })
  }

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  }).replaceAll('<', '\\u003c')
}

function snapshot(page) {
  const benefits = page.benefits.map((item) => `<li>${esc(item)}</li>`).join('')
  return `<main style="font-family:Arial,sans-serif;max-width:1080px;margin:60px auto;padding:0 22px;color:#1f2d47"><p style="font-weight:700;color:#1d63e9">${esc(page.eyebrow)}</p><h1 style="font-size:48px;line-height:1.05">${esc(page.heading)}</h1><p style="font-size:18px;line-height:1.7">${esc(page.lead)}</p><ul>${benefits}</ul><p><a href="/" style="color:#1d63e9;font-weight:700">Criar meu cartaz no Ofertamática</a></p></main>`
}

function creatorSnapshot() {
  return `<main style="font-family:Arial,sans-serif;max-width:1120px;margin:34px auto;padding:0 22px;color:#1f2d47">
    <p style="font-weight:800;color:#168451;letter-spacing:.06em">2 CLIQUES · PLACA PRONTA</p>
    <h1 style="font-size:44px;line-height:1.05;margin:10px 0">Escolha o formato, cole a lista e gere suas placas</h1>
    <p style="font-size:17px;line-height:1.65;max-width:820px">O Ofertamática abre direto no gerador: primeiro você escolhe o formato e depois cola ou importa a lista para gerar. Grátis, sem cadastro obrigatório e com personalização opcional depois do resultado.</p>
    <ul style="line-height:1.8"><li>Primeira placa pronta em 2 cliques</li><li>Criação em lote para supermercado e varejo</li><li>Importação TXT, CSV e Excel</li><li>A4, A5, A3 e SRA3</li></ul>
  </main>`
}

// A raiz continua sendo o criador. O snapshot existe apenas no HTML inicial para
// buscadores e navegadores sem JavaScript; o React substitui esse conteúdo ao carregar.
fs.writeFileSync(
  indexPath,
  baseHtml.replace('<div id="root"></div>', `<div id="root">${creatorSnapshot()}</div>`),
)

for (const page of INDEXABLE_PAGES) {
  let html = replaceMeta(baseHtml, page)
  html = html.replace('</head>', `<script type="application/ld+json">${structuredData(page)}</script></head>`)
  html = html.replace('<div id="root"></div>', `<div id="root">${snapshot(page)}</div>`)
  const dir = path.join(dist, page.slug)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html)
}

const urls = [
  { url: SITE_URL + '/', priority: '1.0' },
  ...INDEXABLE_PAGES.map((page) => ({ url: `${SITE_URL}/${page.slug}/`, priority: page.kind === 'public' ? '0.9' : '0.8' })),
]
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(({ url, priority }) => `  <url><loc>${url}</loc><changefreq>weekly</changefreq><priority>${priority}</priority></url>`),
  '</urlset>',
].join('\n')

fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)
