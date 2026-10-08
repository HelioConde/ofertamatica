import fs from 'node:fs'
import path from 'node:path'
import { INDEXABLE_PAGES, SITE_URL } from '../src/seo/seoPages.js'
import { searchTopicsFor } from '../src/seo/searchIntent.js'

const dist = path.resolve('dist')
const indexPath = path.join(dist, 'index.html')
if (!fs.existsSync(indexPath)) process.exit(0)

const baseHtml = fs.readFileSync(indexPath, 'utf8')

const LEGACY_REDIRECTS = {
  'cartaz-de-supermercado': 'cartaz-para-supermercado',
  'cartaz-para-imprimir': 'cartaz-de-oferta-para-imprimir',
  'gerador-de-placas-com-ia': 'criador-de-cartaz-de-oferta',
  'cartaz-de-oferta-gratis': 'criador-de-cartaz-de-oferta',
  'cartaz-supermercado-online': 'cartaz-para-supermercado',
  'placa-de-preco-supermercado': 'cartaz-de-preco-online',
  'gerador-de-cartaz-com-ia': 'criador-de-cartaz-de-oferta',
}


const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

function replaceMeta(html, page) {
  const canonical = `${SITE_URL}/${page.slug}/`
  return html
    .replace(/<html lang="pt-BR">/, '<html lang="pt-BR">')
    .replace(/<title>.*?<\/title>/s, `<title>${esc(page.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${esc(page.description)}" />`)
    .replace(/<meta name="keywords" content="[^"]*"\s*\/>/, `<meta name="keywords" content="${esc(page.keywords)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(page.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(page.description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta property="og:type" content="[^"]*"\s*\/>/, `<meta property="og:type" content="${page.paperChoices ? 'article' : 'website'}" />`)
    .replace('</head>', `<meta name="twitter:card" content="summary" /><meta name="twitter:title" content="${esc(page.title)}" /><meta name="twitter:description" content="${esc(page.description)}" /></head>`)
}

function structuredData(page) {
  const canonical = `${SITE_URL}/${page.slug}/`
  const organization = { '@type': 'Organization', name: 'Ofertamática', url: SITE_URL + '/' }
  const pageType = page.slug === 'sobre'
    ? 'AboutPage'
    : page.slug === 'fale-conosco'
      ? 'ContactPage'
      : 'WebPage'
  const graph = [
    {
      '@type': pageType,
      name: page.heading,
      description: page.description,
      url: canonical,
      ...(page.updatedAt ? { dateModified: '2026-10-04' } : {}),
      publisher: organization,
      isPartOf: { '@type': 'WebSite', name: 'Ofertamática', url: SITE_URL + '/', publisher: organization },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ofertamática', item: SITE_URL + '/' },
        { '@type': 'ListItem', position: 2, name: page.heading, item: canonical },
      ],
    },
  ]

  if (page.paperChoices) {
    graph.push({
      '@type': 'Article',
      headline: page.heading,
      description: page.description,
      mainEntityOfPage: canonical,
      inLanguage: 'pt-BR',
      author: organization,
      publisher: organization,
    })
  }

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  }).replaceAll('<', '\\u003c')
}

function snapshot(page) {
  const benefits = page.benefits.map((item) => `<li>${esc(item)}</li>`).join('')
  const sections = (page.sections || []).map((section) => `
    <section style="margin-top:24px">
      <h2 style="font-size:24px;margin-bottom:8px">${esc(section.title)}</h2>
      <p style="font-size:16px;line-height:1.7">${esc(section.text)}</p>
    </section>`).join('')
  const tips = (page.tips || []).length
    ? `<section style="margin-top:28px"><h2 style="font-size:24px">Pontos práticos</h2><ul style="line-height:1.8">${page.tips.map((tip) => `<li>${esc(tip)}</li>`).join('')}</ul></section>`
    : ''
  const storeUse = (page.storeUse || []).length
    ? `<section style="margin-top:28px"><h2 style="font-size:24px">Na rotina da loja</h2><ul style="line-height:1.8">${page.storeUse.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></section>`
    : ''
  const helpfulLinks = (page.links || []).map((link) => `<p><a href="${esc(link.href)}" style="color:#1d63e9;font-weight:700">${esc(link.label)}</a> — ${esc(link.note)}</p>`).join('')
  const searchContent = searchTopicsFor(page.slug).map((topic) => `
    <section style="margin-top:28px">
      <h2 style="font-size:24px;margin-bottom:8px">${esc(topic.title)}</h2>
      <p style="font-size:16px;line-height:1.7">${esc(topic.text)}</p>
      <p><a href="${esc(topic.link)}">${esc(topic.linkLabel)}</a></p>
    </section>`).join('')
  const updated = page.updatedAt ? `<p style="color:#7b8798;font-size:14px">${esc(page.updatedAt)}</p>` : ''

  const paperChoices = page.paperChoices?.length ? `
    <section style="margin-top:26px">
      <h2 style="font-size:24px">Tipo de papel e gramatura para cartazes</h2>
      <ul style="line-height:1.7">${page.paperChoices.map((item) => `<li><strong>${esc(item.label)}:</strong> ${esc(item.paper)}, ${esc(item.weight)} — ${esc(item.why)}</li>`).join('')}</ul>
    </section>` : ''
  const paperFormats = page.formatChoices?.length ? `
    <section style="margin-top:26px">
      <h2 style="font-size:24px">Comparação de tamanhos de papel A4, A5 e A3</h2>
      <table style="width:100%;border-collapse:collapse;text-align:left">
        <thead><tr><th>Layout</th><th>Folha</th><th>Cartaz</th><th>Onde usar</th></tr></thead>
        <tbody>${page.formatChoices.map((item) => `<tr><th scope="row">${esc(item.name)}</th><td>${esc(item.sheet)}</td><td>${esc(item.area)}</td><td>${esc(item.use)}</td></tr>`).join('')}</tbody>
      </table>
    </section>` : ''
  const paperPrintSteps = page.printSteps?.length ? `
    <section style="margin-top:26px">
      <h2 style="font-size:24px">Passo a passo para imprimir o tamanho certo</h2>
      <ol style="line-height:1.8">${page.printSteps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>
    </section>` : ''
  const paperFaq = page.faq?.length ? `
    <section style="margin-top:26px">
      <h2 style="font-size:24px">Perguntas frequentes sobre papel e impressão</h2>
      ${page.faq.map((item) => `<h3>${esc(item.q)}</h3><p style="line-height:1.7">${esc(item.a)}</p>`).join('')}
    </section>` : ''

  return `<main style="font-family:Arial,sans-serif;max-width:1080px;margin:60px auto;padding:0 22px;color:#1f2d47">
    <p style="font-weight:700;color:#1d63e9">${esc(page.eyebrow)}</p>
    <h1 style="font-size:48px;line-height:1.05">${esc(page.heading)}</h1>
    <p style="font-size:18px;line-height:1.7">${esc(page.lead)}</p>
    ${updated}
    <ul style="line-height:1.8">${benefits}</ul>
    ${sections}
    ${paperChoices}
    ${paperFormats}
    ${paperPrintSteps}
    ${paperFaq}
    ${searchContent}
    ${tips}
    ${storeUse}
    ${helpfulLinks}
    <nav style="margin-top:32px;padding-top:20px;border-top:1px solid #e1e7ef">
      <a href="/qual-papel-usar-para-cartaz/" style="margin-right:16px;color:#1d63e9">Qual papel usar para cartazes</a>
      <a href="/sobre/" style="margin-right:16px;color:#1d63e9">Sobre</a>
      <a href="/fale-conosco/" style="margin-right:16px;color:#1d63e9">Fale conosco</a>
      <a href="/privacidade/" style="margin-right:16px;color:#1d63e9">Privacidade</a>
      <a href="/termos/" style="color:#1d63e9">Termos</a>
    </nav>
    <p><a href="/" style="color:#1d63e9;font-weight:700">Criar meu cartaz no Ofertamática</a></p>
  </main>`
}

function creatorSnapshot() {
  return `<main style="font-family:Arial,sans-serif;max-width:1120px;margin:34px auto;padding:0 22px;color:#1f2d47">
    <p style="font-weight:800;color:#168451;letter-spacing:.06em">CARTAZ DE OFERTA PRONTO EM 2 CLIQUES</p>
    <h1 style="font-size:44px;line-height:1.05;margin:10px 0">Escolha o tamanho da sua placa.</h1>
    <p style="font-size:17px;line-height:1.65;max-width:820px">Crie placas para mercado online e cartazes de oferta grátis. Do A7 para gôndola ao A3 para vitrine, escolha o formato, cole sua lista e gere as placas.</p>
    <ul style="line-height:1.8"><li>Primeira placa pronta em 2 cliques</li><li>Criação em lote para supermercado e varejo</li><li>Importação TXT, CSV e Excel</li><li>A4, A5 e A3</li></ul>
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
  // O schema base descreve a aplicação da home, não cada página interna.
  html = html.replace(/<script id="ofertamatica-page-schema" type="application\/ld\+json">[\s\S]*?<\/script>/, '')
  html = html.replace('</head>', `<script id="ofertamatica-page-schema" type="application/ld+json">${structuredData(page)}</script></head>`)
  html = html.replace('<div id="root"></div>', `<div id="root">${snapshot(page)}</div>`)
  const dir = path.join(dist, page.slug)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html)
}

// Endereços antigos ainda aparecem como páginas de referência no Search Console.
// Servir um redirecionamento real no HTML, em vez de devolver silenciosamente a home.
for (const [legacy, destination] of Object.entries(LEGACY_REDIRECTS)) {
  const target = `${SITE_URL}/${destination}/`
  const redirect = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${target}"><meta http-equiv="refresh" content="0;url=${target}"><title>Página movida | Ofertamática</title></head><body><main><h1>Página movida</h1><p>O conteúdo mudou de endereço. <a href="${target}">Acesse a página atual</a>.</p></main><script>location.replace(${JSON.stringify(target)})</script></body></html>`
  const dir = path.join(dist, legacy)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), redirect)
}

const urls = [
  { url: SITE_URL + '/', priority: '1.0' },
  ...INDEXABLE_PAGES.map((page) => ({ url: `${SITE_URL}/${page.slug}/`, priority: page.kind === 'public' ? '0.9' : '0.8' })),
]
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(({ url }) => `  <url><loc>${url}</loc></url>`),
  '</urlset>',
].join('\n')

fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)
