import fs from 'node:fs'
import path from 'node:path'
import { INDEXABLE_PAGES, SEO_PAGES, SEO_FAQS, SITE_URL } from '../src/seo/seoPages.js'
import { searchTopicsFor } from '../src/seo/searchIntent.js'
import { HOME_GUIDANCE, HOME_LIMITATIONS, calculatePrintPlan } from '../src/seo/homePrintHelp.js'
import { POSTER_FORMAT_OPTIONS } from '../src/config/posterFormats.js'
import { POSTER_MODEL_PRESETS } from '../src/config/posterModelPresets.js'
import { curatedModelsForSlug } from '../src/config/modelEditorialCollections.js'
import { calculatorStaticExample } from '../src/seo/retailCalculators.js'
import { inspectRetailList, REVIEW_SAMPLE } from '../src/seo/retailListReview.js'

const dist = path.resolve('dist')
const indexPath = path.join(dist, 'index.html')
if (!fs.existsSync(indexPath)) process.exit(0)

const originalHtml = fs.readFileSync(indexPath, 'utf8')
const bootstrapPath = path.join(dist, 'consent-bootstrap.js')
if (!fs.existsSync(bootstrapPath)) throw new Error('Inicializador de consentimento ausente do build')
const bootstrapCode = fs.readFileSync(bootstrapPath, 'utf8')
const consentTag = '<script src="/consent-bootstrap.js"></script>'
if (!originalHtml.includes(consentTag)) {
  throw new Error('O Consent Mode não está antes do AdSense no HTML inicial')
}
// Evita requisição de JS síncrono antes do primeiro paint. A ordem de execução
// é preservada: consentimento negado por padrão ANTES das tags do Google.
// Mantém o arquivo externo no dist para abas antigas com HTML em cache.
const safeInlineBootstrap = bootstrapCode.split('</script').join('<' + String.fromCharCode(92) + '/script')
const baseHtml = originalHtml.replace(
  consentTag,
  '<script data-ofertamatica-consent-bootstrap="inline">' + safeInlineBootstrap + '</script>',
)

// O CSS das páginas editoriais pertence ao chunk lazy do Vite. Se não
// constar no HTML inicial, os guias podem aparecer momentaneamente sem
// grid, filtros e cards enquanto o React carrega o módulo assíncrono.
// Adicione o stylesheet apenas às páginas públicas (a home continua leve).
// Captura real usada SOMENTE quando o usuário expande o tutorial do editor.
// Reaproveita a imagem de QA versionada: não há dependência de host externo.
const editorScreenshot = path.resolve('screenshots/site/editor-livre-desktop.png')
if (fs.existsSync(editorScreenshot)) {
  const tutorialDir = path.join(dist, 'tutorials')
  fs.mkdirSync(tutorialDir, { recursive: true })
  fs.copyFileSync(editorScreenshot, path.join(tutorialDir, 'editor-livre-desktop.png'))
}

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
    // O HTML base já tem Twitter Cards: substitua sem duplicar tags.
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${esc(page.title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${esc(page.description)}" />`)
}

function structuredData(page) {
  const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  const updated = String(page.updatedAt || '').match(/(\d{1,2}) de ([a-zç]+) de (\d{4})/i)
  const month = updated ? monthNames.indexOf(updated[2].toLocaleLowerCase('pt-BR')) : -1
  const dateModified = updated && month >= 0
    ? updated[3] + '-' + String(month + 1).padStart(2, '0') + '-' + updated[1].padStart(2, '0')
    : null
  const canonical = `${SITE_URL}/${page.slug}/`
  const organization = { '@type': 'Organization', name: 'Ofertamática', url: SITE_URL + '/', logo: SITE_URL + '/icons/icon-192.png', email: 'atendimento@ofertamatica.com.br', contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: 'atendimento@ofertamatica.com.br', availableLanguage: 'Portuguese' } }
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
      ...(dateModified ? { dateModified } : {}),
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

  if (page.howTo?.steps?.length) {
    // Schema.org descreve conteúdo que também fica visível na página.
    // Não há garantia de rich result: o objetivo é consistência semântica.
    graph.push({
      '@type': 'HowTo',
      name: page.howTo.title,
      inLanguage: 'pt-BR',
      step: page.howTo.steps.map((item, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: item.title,
        text: item.text,
        url: canonical + (page.slug === 'modelos' ? '#fundos-para-imprimir' : '#guia-editor-livre'),
      })),
    })
  }

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


function modelExamplesSnapshot() {
  const priority = [
    'foto-esquerda', 'foto-direita', 'foto-central',
    'oferta-dia', 'hortifruti', 'padaria', 'de-por', 'atacado',
  ]
  const cards = priority.map((id) => POSTER_MODEL_PRESETS.find((model) => model.id === id))
    .filter(Boolean)
    .map((model) =>
      '<li style="padding:17px;border:1px solid #dce6f4;border-radius:10px;min-width:0;display:block">' +
      (model.sampleImage ? '<img src="' + esc(model.sampleImage) + '" alt="Ilustração de ' + esc(model.product) + '" loading="lazy" width="95" height="95" style="object-fit:contain;float:right;margin-left:10px"/>' : '') +
      '<strong style="display:block;font-size:17px">' + esc(model.name) + '</strong>' +
      '<p style="font-size:13px;color:#52647e">' + esc(model.category) + ' · Exemplo fictício: ' + esc(model.product) + ' — R$ ' + esc(model.value) + '</p>' +
      '<p style="font-size:14px;line-height:1.6">' + esc(model.note) + '</p>' +
      '</li>'
    ).join('')
  return '<section style="margin-top:30px" aria-labelledby="modelos-exemplos">' +
    '<h2 id="modelos-exemplos">Exemplos de modelos com produto, preço e finalidade</h2>' +
    '<p>O catálogo permite comparar estilos de cartaz antes de criar uma oferta. Os produtos e preços exibidos abaixo são apenas exemplos: não representam promoções reais. No editor, substitua por sua lista e confira os valores.</p>' +
    '<ul style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;padding:0;list-style:none">' + cards + '</ul>' +
    '<h2>Cartazes com foto do produto</h2>' +
    '<p>Você pode escolher um modelo com imagem à esquerda, à direita ou centralizada. Após abrir o editor, selecione o produto na tabela, entre em Estilo e Fotos e envie PNG, JPG ou WebP. A foto é processada localmente no navegador. Confira se o preço continua visível e use somente imagens que você tem autorização para utilizar.</p>' +
    '<p><a href="/?formato=A4">Criar um cartaz A4 com foto</a></p></section>'
}

function listReviewSnapshot(page) {
  if (page.slug !== 'cartazes-a-partir-de-excel') return ''
  const report = inspectRetailList(REVIEW_SAMPLE)
  const rows = report.rows.map((row) => '<tr><th scope="row" style="text-align:left;padding:8px">' + esc(row.name) +
    '</th><td style="padding:8px">' + esc(row.unit) + '</td><td style="padding:8px">' + esc(row.price) +
    '</td><td style="padding:8px">' + esc(row.ready ? 'Sem alertas' : row.issues.join(', ')) + '</td></tr>').join('')
  return '<section aria-labelledby="review-list-title" style="margin-top:30px;padding:20px;border:1px solid #d9e4f2;border-radius:12px">' +
    '<h2 id="review-list-title">Teste uma lista do Excel antes de gerar os cartazes</h2>' +
    '<p>O verificador usa o mesmo interpretador do editor para sinalizar preços ausentes, unidades não definidas e possíveis produtos repetidos. Funciona localmente no navegador e não consulta preços do caixa.</p>' +
    '<p><strong>Exemplo ilustrativo:</strong> ' + report.total + ' produtos reconhecidos, ' + report.ready +
    ' sem alertas e ' + report.attention + ' para revisão.</p>' +
    '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:550px">' +
    '<thead><tr><th>Produto</th><th>Unidade</th><th>Preço</th><th>Conferência</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p>Ative o JavaScript para colar a sua própria lista e verificar os itens antes de abrir o gerador.</p>' +
    '<p><a href="/?formato=A4">Abrir criador de cartazes A4</a></p></section>'
}

function curatedModelsSnapshot(page) {
  const collection = curatedModelsForSlug(page.slug)
  if (!collection) return ''
  const cards = collection.models.map((id) => POSTER_MODEL_PRESETS.find((model) => model.id === id))
    .filter(Boolean).map((model) =>
      '<li style="border:1px solid #d7e2ee;border-radius:12px;padding:15px;background:' + esc(model.background) + ';color:' + esc(model.text) + '">' +
      '<strong style="display:block;background:' + esc(model.header) + ';color:' + esc(model.headerText) + ';padding:8px;font-size:15px">' + esc(model.label) + '</strong>' +
      '<p style="font-weight:700">' + esc(model.name) + '</p><p>' + esc(model.product) + '</p>' +
      '<strong style="display:block;font-size:25px;color:' + esc(model.price) + '">R$ ' + esc(model.value) + '</strong>' +
      '<p style="font-size:12px">' + esc(model.note) + '</p></li>').join('')
  return '<section aria-labelledby="curated-collection-title" style="margin-top:24px">' +
    '<h2 id="curated-collection-title">' + esc(collection.heading) + '</h2>' +
    '<p>' + esc(collection.intro) + '</p>' +
    '<ul style="display:grid;grid-template-columns:repeat(auto-fit,minmax(195px,1fr));gap:12px;padding:0;list-style:none">' + cards + '</ul>' +
    '<p>' + esc(collection.note) + '</p>' +
    '<p><a href="/modelos/">Ver todos os modelos e escolher a arte no editor</a></p></section>'
}

function retailCalculatorSnapshot(page) {
  const example = calculatorStaticExample(page.slug)
  if (!example) return ''
  return '<section class="retail-calculator-fallback" style="margin-top:26px;padding:18px;border:1px solid #d8e5f5;border-radius:12px" aria-label="Simulação de preço em uma oferta">' +
    '<h2>' + esc(example.title) + '</h2>' +
    '<p>' + esc(example.input) + '</p>' +
    '<p><strong>' + esc(example.output) + '</strong></p>' +
    '<p>' + esc(example.note) + '</p>' +
    '<p>Abra esta página com JavaScript habilitado para alterar os números e fazer sua própria simulação.</p>' +
    '</section>'
}

function snapshot(page) {
  const benefits = page.benefits.map((item) => `<li>${esc(item)}</li>`).join('')
  const sections = (page.sections || []).map((section) => `
    <section style="margin-top:24px">
      <h2 style="font-size:24px;margin-bottom:8px">${esc(section.title)}</h2>
      <p style="font-size:16px;line-height:1.7">${esc(section.text)}</p>
    </section>`).join('')
  const howToContent = page.howTo?.steps?.length
    ? `<section id="${page.slug === 'modelos' ? 'fundos-para-imprimir' : 'guia-editor-livre'}" style="margin-top:26px" aria-label="${esc(page.howTo.title)}">
        <h2 style="font-size:24px">${esc(page.howTo.title)}</h2>
        <ol style="line-height:1.8">${page.howTo.steps.map((step) => `<li><strong>${esc(step.title)}</strong> — ${esc(step.text)}</li>`).join('')}</ol>
        <p>${page.slug === 'modelos' ? '<a href="/modelos/#fundos-para-imprimir">Abrir a impressão de fundos prontos</a>' : '<a href="/editor-livre/#guia-editor-livre">Abrir o editor e seguir o tutorial</a>'}</p>
      </section>`
    : ''
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
        <p>Quer passar da orientação para a prática? <a href="/editor-livre/">Abra o editor livre de cartazes</a> para ajustar textos e preços ou <a href="/modelos/">escolha um modelo para imprimir</a>. Ambos funcionam sem cadastro.</p>
        <ul>${SEO_PAGES.map((guide) => `<li><a href="/${esc(guide.slug)}/">${esc(guide.heading)}</a> — ${esc(guide.lead)}</li>`).join('')}</ul>
        <h2>Dúvidas frequentes</h2>
        ${SEO_FAQS.slice(0, 8).map((faq) => `<h3>${esc(faq.q)}</h3><p>${esc(faq.a)}</p>`).join('')}
      </section>`
    : ''
  const toolCta = page.slug === 'conheca-validade-zero' ? '<p><a href="/validade-zero/" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#1d63e9;color:#fff;padding:12px 18px;border-radius:9px;font-weight:700">Abrir Validade Zero ↗</a> <span>Nova identidade visual · aplicativo independente · abre em outra aba</span></p>' : ''
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
    ${toolCta}
    <ul style="line-height:1.8">${benefits}</ul>
    ${sections}
    ${curatedModelsSnapshot(page)}
    ${retailCalculatorSnapshot(page)}
    ${listReviewSnapshot(page)}
    ${howToContent}
    ${page.slug === 'modelos' ? modelExamplesSnapshot() : ''}
    ${guideIndex}
    ${paperChoices}
    ${paperFormats}
    ${paperPrintSteps}
    ${paperFaq}
    ${searchContent}
    ${tips}
    ${storeUse}
    ${helpfulLinks}
    <nav aria-label="Páginas principais da Ofertamática" style="margin-top:32px;padding-top:20px;border-top:1px solid #e1e7ef">
      <a href="/" style="margin-right:16px;color:#1d63e9">Criar placas</a>
      <a href="/modelos/" style="margin-right:16px;color:#1d63e9">Modelos de cartazes de oferta</a>
      <a href="/formatos/" style="margin-right:16px;color:#1d63e9">Formatos para imprimir</a>
      <a href="/como-funciona/" style="margin-right:16px;color:#1d63e9">Como funciona</a>
      <a href="/guias-para-varejo/" style="margin-right:16px;color:#1d63e9">Guias para varejo</a>
      <a href="/validade-zero/" style="margin-right:16px;color:#1d63e9">Validade Zero</a>
      <a href="/qual-papel-usar-para-cartaz/" style="margin-right:16px;color:#1d63e9">Qual papel usar para cartazes</a>
      <a href="/sobre/" style="margin-right:16px;color:#1d63e9">Sobre</a>
      <a href="/fale-conosco/" style="margin-right:16px;color:#1d63e9">Fale conosco</a>
      <a href="/privacidade/" style="margin-right:16px;color:#1d63e9">Privacidade</a>
      <a href="/termos/" style="color:#1d63e9">Termos</a>
    </nav>
    <p><a href="/" style="color:#1d63e9;font-weight:700">Criar meu cartaz no Ofertamática</a></p>
  </main>`
}


function homePrintHelpSnapshot() {
  const plan = calculatePrintPlan(37, 'A4X4')
  const steps = HOME_GUIDANCE.map((item) =>
    '<li><strong>' + esc(item.title) + '</strong><p>' + esc(item.text) + '</p></li>'
  ).join('')
  return '<section class="home-print-help" aria-labelledby="home-print-help-title">' +
    '<header class="home-print-help-heading"><span>ANTES DE IMPRIMIR</span>' +
    '<h2 id="home-print-help-title">Planeje suas placas sem desperdiçar papel</h2>' +
    '<p>Um guia rápido para quem prepara dezenas de ofertas: calcule as folhas, confira os dados e imprima no tamanho certo. O gerador continua disponível logo acima, sem cadastro.</p></header>' +
    '<div class="home-print-help-grid"><div class="home-print-plan">' +
    '<h3>Quantas folhas preciso para minhas ofertas?</h3>' +
    '<div class="home-print-plan-result"><span>Exemplo: ' + plan.quantity + ' cartazes, quatro por folha A4</span>' +
    '<strong>' + plan.sheets + ' folhas ' + plan.option.paper + '</strong>' +
    '<small>' + plan.freeSlots + ' posições ficam livres na última folha.</small></div>' +
    '<p>Faça a conta dividindo a quantidade de ofertas pelo número de cartazes por folha e arredondando para cima. A estimativa não inclui provas ou reimpressões.</p>' +
    '<a href="/qual-papel-usar-para-cartaz/">Veja quais papéis e gramaturas são adequados</a></div>' +
    '<div class="home-print-guide"><h3>Da lista do estoque ao cartaz impresso</h3>' +
    '<ol>' + steps + '</ol></div></div>' +
    '<aside class="home-print-boundary"><strong>O que a ferramenta faz — e o que você deve conferir</strong>' +
    '<p>' + esc(HOME_LIMITATIONS) + '</p>' +
    '<nav aria-label="Continuar aprendendo a criar cartazes">' +
    '<a href="/como-funciona/">Como funciona</a> ' +
    '<a href="/placas-para-hortifruti/">Preços por kg no hortifruti</a> ' +
    '<a href="/placas-para-padaria/">Placas para padaria</a>' +
    '</nav></aside></section>'
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
  const nav = [['/', 'Criar placas', 'Criar'], ['/modelos/', 'Modelos', 'Modelos'], ['/editor-livre/', 'Editor livre', 'Editor'], ['/formatos/', 'Formatos', 'Formatos'], ['/como-funciona/', 'Como funciona', 'Como'], ['/guias-para-varejo/', 'Guias para varejo', 'Guias'], ['/validade-zero/', 'Validade Zero', 'Validade Zero']]
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
    '<nav class="main-nav" aria-label="Navegação principal">' + nav.map(([href, label, short], i) => '<a class="nav-link' + (i === 0 ? ' active' : '') + '" href="' + href + '"' + (i === 0 ? ' aria-current="page"' : '') + (href === '/validade-zero/' ? ' target="_blank" rel="noopener noreferrer"' : '') + '><span class="nav-label-full">' + label + '</span><span class="nav-label-mobile">' + short + '</span></a>').join('') + '</nav>' +
    '<div class="nav-meta"><span class="free-pill">Grátis</span><span class="nav-note">sem cadastro</span></div></div></header>' +
    '<main class="format-page format-home-refresh" id="formatos"><section class="format-dialog">' +
    '<header class="format-dialog-head format-dialog-head-clean"><div class="format-home-intro"><div class="format-home-intro-copy">' +
    '<span class="eyebrow two-click-kicker">CARTAZES DE OFERTA GRÁTIS</span><h1>Escolha o formato da sua placa de oferta</h1>' +
    '<p>Escolha A4, A5 ou A3, cole seus produtos e imprima suas ofertas. Sem cadastro.</p>' +
    '<div class="format-trust-row" aria-label="Vantagens do Ofertamática"><span>Grátis e sem cadastro</span><span>Lista, Excel, CSV ou TXT</span><span>PDF no tamanho correto</span></div></div>' +
    '<a class="format-paper-guide-link" href="/qual-papel-usar-para-cartaz/"><span class="format-paper-icon" aria-hidden="true">▤</span><span><b>Dúvida sobre o papel?</b><small>Confira folhas, gramaturas e impressão</small></span><strong aria-hidden="true">→</strong></a>' +
    '</div></header>' +
    '<section class="format-home-chooser" aria-labelledby="format-picker-title"><div class="format-home-section-title"><div><h2 id="format-picker-title">Selecione o tamanho do cartaz</h2><p>8 opções de impressão · clique em uma para começar</p></div><span>1. Formato <i aria-hidden="true">→</i> 2. Produtos <i aria-hidden="true">→</i> 3. PDF</span></div>' +
    '<div class="format-grid">' + cards + '</div></section>' +
    '<aside class="format-ad-card format-ad-zone" aria-label="Área de publicidade"></aside>' +
    '<nav class="format-trust-links" aria-label="Atalhos e informações"><a href="/modelos/">Modelos de cartazes</a><a href="/qual-papel-usar-para-cartaz/">Qual papel usar?</a><a href="/como-funciona/">Como funciona</a>' +
    '<details class="format-more-links"><summary>Mais informações</summary><div><a href="/guias-para-varejo/">Guias para varejo</a><a href="/validade-zero/" target="_blank" rel="noopener noreferrer" aria-label="Abrir Validade Zero em nova aba">Validade Zero ↗</a><a href="/conheca-validade-zero/">Conhecer a ferramenta</a><a href="/fale-conosco/">Ajuda e contato</a><a href="/privacidade/">Privacidade</a><a href="/termos/">Termos de uso</a></div></details></nav></section>' + homePrintHelpSnapshot() + '</main>' +
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
  { url: SITE_URL + '/validade-zero/', priority: '0.7' },
]
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(({ url }) => `  <url><loc>${url}</loc></url>`),
  '</urlset>',
].join('\n')

fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /monitoramento/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)
