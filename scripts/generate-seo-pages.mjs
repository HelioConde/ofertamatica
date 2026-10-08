import fs from 'node:fs'
import path from 'node:path'
import { INDEXABLE_PAGES, SEO_PAGES, SEO_FAQS, SITE_URL } from '../src/seo/seoPages.js'
import { searchTopicsFor } from '../src/seo/searchIntent.js'
import { POSTER_FORMAT_OPTIONS } from '../src/config/posterFormats.js'

const dist = path.resolve('dist')
const indexPath = path.join(dist, 'index.html')
if (!fs.existsSync(indexPath)) process.exit(0)

const baseHtml = fs.readFileSync(indexPath, 'utf8')

// O CSS das páginas editoriais pertence ao chunk lazy do Vite. Se não
// constar no HTML inicial, os guias podem aparecer momentaneamente sem
// grid, filtros e cards enquanto o React carrega o módulo assíncrono.
// Adicione o stylesheet apenas às páginas públicas (a home continua leve).
const assetDir = path.join(dist, 'assets')
const marketingCssAsset = fs.readdirSync(assetDir)
  .filter((name) => name.endsWith('.css'))
  .find((name) => {
    const css = fs.readFileSync(path.join(assetDir, name), 'utf8')
    return css.includes('.retail-guide-catalog-card') && css.includes('.seo-landing')
  })
if (!marketingCssAsset) {
  throw new Error('CSS editorial ausente do build: não é seguro publicar páginas sem estilo')
}
const marketingCssHref = '/assets/' + marketingCssAsset

const LEGACY_REDIRECTS = {
  'cartaz-de-supermercado': 'cartaz-para-supermercado',
  'cartaz-para-imprimir': 'cartaz-de-oferta-para-imprimir',
  'gerador-de-placas-com-ia': 'como-funciona',
  'cartaz-de-oferta-gratis': 'criador-de-cartaz-de-oferta',
  'cartaz-supermercado-online': 'cartaz-para-supermercado',
  'placa-de-preco-supermercado': 'cartaz-de-preco-online',
  'gerador-de-cartaz-com-ia': 'como-funciona',
  'cartazes-para-supermercado': 'cartaz-para-supermercado',
  'cartaz-supermercado': 'cartaz-para-supermercado',
  'cartazes-para-promocao': 'gerador-de-cartaz-de-promocao',
  'gerador-de-placas-promocionais': 'gerador-de-cartaz-de-promocao',
  'gerador-de-cartaz-gratis': 'criador-de-cartaz-de-oferta',
  'como-criar-cartazes-promocionais': 'como-fazer-cartaz-de-oferta',
  'guias': 'guias-para-varejo',
  'faq': 'como-funciona',
  'modelos-de-placas': 'modelos',
  'excel-para-cartazes': 'cartazes-a-partir-de-excel',
  'importar-produtos-excel': 'cartazes-a-partir-de-excel',
  'ia-para-promocoes': 'como-funciona',
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
  const organization = { '@type': 'Organization', name: 'Ofertamática', url: SITE_URL + '/', logo: SITE_URL + '/icons/icon-192.png' }
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
  const guideIndex = page.slug === 'guias-para-varejo'
    ? `<section aria-label="Guias por assunto"><h2>Guias para criar e imprimir cartazes</h2>
        <p>Veja orientações práticas de preço, formato, setor e impressão.</p>
        <ul>${SEO_PAGES.map((guide) => `<li><a href="/${esc(guide.slug)}/">${esc(guide.heading)}</a> — ${esc(guide.lead)}</li>`).join('')}</ul>
        <h2>Dúvidas frequentes</h2>
        ${SEO_FAQS.slice(0, 8).map((faq) => `<h3>${esc(faq.q)}</h3><p>${esc(faq.a)}</p>`).join('')}
      </section>`
    : ''
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
    ${guideIndex}
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

// HTML inicial usa as MESMAS classes/estrutura visível da tela React.
// Em 4G lento não mostramos uma página provisória completamente diferente.
function creatorSnapshot() {
  const display = {
    A4X8: ['8 cartazes A7', 'Imprime em 1 folha A4', 'Etiquetas grandes e gôndolas'],
    A4X4: ['4 cartazes A6', 'Imprime em 1 folha A4', 'Gôndolas e ofertas do dia'],
    A4X2_CIMA_BAIXO: ['2 cartazes por folha', 'Imprime em 1 folha A4', 'Balcão e ponta de gôndola'],
    A4X2_INVERTIDO: ['2 cartazes invertidos', 'Imprime em 1 folha A4', 'Dobra e exposição frente e verso'],
    A4X2_APP: ['2 ofertas de App', 'Folha A4 na horizontal', 'Preço exclusivo do aplicativo'],
    A4: ['1 cartaz A4', 'Folha A4 inteira', 'Ponta de gôndola e destaque'],
    A5: ['1 cartaz A5', 'Folha A5 inteira', 'Balcão e gôndolas menores'],
    A3: ['1 cartaz A3', 'Impressora compatível com A3', 'Vitrine e leitura à distância'],
  }
  const nav = [['/', 'Criar placas', 'Criar'], ['/modelos/', 'Modelos', 'Modelos'], ['/formatos/', 'Formatos', 'Formatos'], ['/como-funciona/', 'Como funciona', 'Como'], ['/guias-para-varejo/', 'Guias para varejo', 'Guias']]
  const cards = POSTER_FORMAT_OPTIONS.filter((format) => format.id !== 'SRA3').map((format) => {
    const details = display[format.id]
    if (!details) return ''
    const isSplit = format.postersPerSheet === 2 && format.rows === 2
    const isApp = format.specialLayout === 'app-offer'
    const classes = ['oferta-format-preview', isSplit ? 'is-split' : '', isApp ? 'is-app' : '', format.postersPerSheet === 4 ? 'is-four' : '', format.postersPerSheet === 8 ? 'is-eight' : ''].filter(Boolean).join(' ')
    const minis = Array.from({ length: format.postersPerSheet }, (_, i) =>
      '<div class="oferta-format-mini' + (format.invertedSlots.includes(i) ? ' is-inverted' : '') + '"><span>OFERTA</span><i></i><b><small>R$</small><em>4,99</em></b></div>'
    ).join('')
    const badge = format.id === 'A4X8' ? '<span class="format-economy">Economiza papel</span>' :
      format.id === 'A4X4' ? '<span class="format-recommended">Mais usado</span>' :
      format.id === 'A3' ? '<span class="format-impact">Maior destaque</span>' : ''
    return '<a class="format-choice ' + (format.id === 'A4X4' ? 'is-recommended ' : '') + '" href="/?formato=' + encodeURIComponent(format.id) + '" data-format-id="' + format.id + '" aria-label="Selecionar ' + details[0] + '">' +
      '<span class="format-choice-badges">' + badge + '</span><span class="format-thumb"><span class="' + classes + '">' + minis + '</span></span>' +
      '<span class="format-copy"><strong>' + details[0] + '</strong><small class="format-sheet">' + details[1] + '</small><span class="format-use">' + details[2] + '</span>' +
      '<span class="format-meta">' + format.cartSize + ' por cartaz</span><span class="format-card-action">Selecionar <span aria-hidden="true">→</span></span></span></a>'
  }).join('')
  return '<div class="app format-mode"><header class="site-header"><div class="nav-shell">' +
    '<a class="brand" href="/" aria-label="Ofertamática"><img class="brand-icon" src="/icons/icon-192.png?v=20261008b" width="36" height="36" alt=""><span>Ofertamática</span></a>' +
    '<nav class="main-nav" aria-label="Navegação principal">' + nav.map(([href, label, short], i) => '<a class="nav-link' + (i === 0 ? ' active' : '') + '" href="' + href + '"' + (i === 0 ? ' aria-current="page"' : '') + '><span class="nav-label-full">' + label + '</span><span class="nav-label-mobile">' + short + '</span></a>').join('') + '</nav>' +
    '<div class="nav-meta"><span class="free-pill">Grátis</span><span class="nav-note">sem cadastro</span></div></div></header>' +
    '<main class="format-page format-home-refresh" id="formatos"><section class="format-dialog">' +
    '<header class="format-dialog-head format-dialog-head-clean"><div class="format-home-intro"><div class="format-home-intro-copy">' +
    '<span class="eyebrow two-click-kicker">GERADOR GRÁTIS DE CARTAZES PARA VAREJO</span><h1>Escolha o formato da sua placa de oferta</h1>' +
    '<p>Selecione o tamanho, adicione seus produtos e imprima cartazes de preço em A4, A5 ou A3. Sem cadastro.</p>' +
    '<div class="format-trust-row" aria-label="Vantagens do Ofertamática"><span>Grátis e sem cadastro</span><span>Lista, Excel, CSV ou TXT</span><span>PDF no tamanho correto</span></div></div>' +
    '<a class="format-paper-guide-link" href="/qual-papel-usar-para-cartaz/"><span class="format-paper-icon" aria-hidden="true">▤</span><span><b>Dúvida sobre o papel?</b><small>Confira folhas, gramaturas e impressão</small></span><strong aria-hidden="true">→</strong></a>' +
    '</div></header>' +
    '<section class="format-home-chooser" aria-labelledby="format-picker-title"><div class="format-home-section-title"><div><h2 id="format-picker-title">Selecione o tamanho do cartaz</h2><p>8 opções de impressão · clique em uma para começar</p></div><span>1. Formato <i aria-hidden="true">→</i> 2. Produtos <i aria-hidden="true">→</i> 3. PDF</span></div>' +
    '<div class="format-grid">' + cards + '</div></section>' +
    '<aside class="format-ad-card format-ad-zone" aria-label="Área de publicidade"></aside>' +
    '<nav class="format-trust-links" aria-label="Atalhos e informações"><a href="/modelos/">Modelos de cartazes</a><a href="/qual-papel-usar-para-cartaz/">Qual papel usar?</a><a href="/como-funciona/">Como funciona</a>' +
    '<details class="format-more-links"><summary>Mais informações</summary><div><a href="/guias-para-varejo/">Guias para varejo</a><a href="/fale-conosco/">Ajuda e contato</a><a href="/privacidade/">Privacidade</a><a href="/termos/">Termos de uso</a></div></details></nav></section></main>' +
    '<aside id="ofertamatica-load-warning" hidden role="alert" style="position:fixed;bottom:12px;left:12px;right:12px;z-index:9999;margin:auto;max-width:600px;padding:14px;border:1px solid #afc9f3;border-radius:12px;background:white;box-shadow:0 6px 36px #0002"><strong>O criador está demorando para carregar.</strong> <a href="/" style="color:#1d63e9;font-weight:800">Recarregar</a></aside></div>' +
    '<script>window.setTimeout(function(){var e=document.getElementById("ofertamatica-load-warning");if(e)e.hidden=false},12000)</script>'
}

// A raiz continua sendo o criador. O snapshot existe apenas no HTML inicial para
// buscadores e navegadores sem JavaScript; o React substitui esse conteúdo ao carregar.
fs.writeFileSync(
  indexPath,
  baseHtml.replace('<div id="root"></div>', `<div id="root">${creatorSnapshot()}</div>`),
)

for (const page of INDEXABLE_PAGES) {
  let html = replaceMeta(baseHtml, page)
  // A folha do marketing fica disponível no primeiro paint das rotas diretas.
  // Evita FOUC mesmo que o bundle JavaScript demore para hidratar a página.
  if (!html.includes('href="' + marketingCssHref + '"')) {
    html = html.replace('</head>', '<link rel="stylesheet" data-ofertamatica-editorial href="' + marketingCssHref + '" /></head>')
  }
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
