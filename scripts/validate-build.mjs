import fs from 'node:fs'
import path from 'node:path'
import { INDEXABLE_PAGES, SITE_URL } from '../src/seo/seoPages.js'
import { SEARCH_INTENT_CLUSTERS } from '../src/seo/searchIntent.js'

const dist = path.resolve('dist')
const failures = []
const expect = (condition, message) => { if (!condition) failures.push(message) }

const read = (relative) => {
  const file = path.join(dist, relative)
  expect(fs.existsSync(file), `Arquivo ausente: dist/${relative}`)
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
}

const index = read('index.html')
expect(index.includes('GTM-5RGPM6HD'), 'GTM não encontrado no index.html')
expect(!index.includes('gtag/js?id=G-K8YWSXBHS7'), 'GA4 direto voltou ao index.html; use o GTM como fonte única')
expect(index.includes('ca-pub-9514218545388169'), 'Publisher AdSense ausente do index.html')
expect(index.includes('href="https://ofertamatica.com.br/"'), 'Canonical da raiz incorreto')
expect(!index.includes('src="./assets/'), 'Assets relativos detectados no index.html')
expect(!index.includes('href="./assets/'), 'CSS/assets relativos detectados no index.html')
expect(!index.includes('ESCOLHA SEU CAMINHO'), 'Copy antiga da landing voltou ao build')
expect(index.includes('rel="manifest" href="/manifest.webmanifest"'), 'Manifest PWA não está ligado ao index.html')
expect(index.includes('/icons/icon-192.png'), 'Ícone PWA 192 ausente do index.html')

const ads = read('ads.txt').trim()
expect(
  ads === 'google.com, pub-9514218545388169, DIRECT, f08c47fec0942fa0',
  'ads.txt diferente do registro autorizado'
)

const sitemap = read('sitemap.xml')
expect(sitemap.includes(`<loc>${SITE_URL}/</loc>`), 'Raiz ausente do sitemap')

for (const page of INDEXABLE_PAGES) {
  const relative = `${page.slug}/index.html`
  const html = read(relative)
  const canonical = `${SITE_URL}/${page.slug}/`
  expect(html.includes(canonical), `Canonical ausente/incorreto em ${relative}`)
  expect(html.includes(page.title), `Title estático ausente em ${relative}`)
  expect(sitemap.includes(`<loc>${canonical}</loc>`), `URL ausente do sitemap: ${canonical}`)
  expect(!html.includes('src="./assets/'), `Asset relativo detectado em ${relative}`)
}

for (const legacy of ['cartaz-de-supermercado', 'cartaz-para-imprimir', 'gerador-de-placas-com-ia']) {
  const html = read(`${legacy}/index.html`)
  expect(html.includes('http-equiv="refresh"'), `Redirecionamento HTML ausente: ${legacy}`)
  expect(!sitemap.includes(`<loc>${SITE_URL}/${legacy}/</loc>`), `URL antiga indevida no sitemap: ${legacy}`)
}
// O guia de papel precisa ser uma página única com conteúdo indexável no HTML inicial.
const paperGuideHtml = read('qual-papel-usar-para-cartaz/index.html')
expect(paperGuideHtml.includes('Qual papel usar para imprimir cartazes de oferta?'), 'Guia de papel sem H1 específico')
expect(paperGuideHtml.includes('75–90 g/m²'), 'Guia de papel sem orientação de gramatura')
expect(paperGuideHtml.includes('8 cartazes A7'), 'Guia de papel sem comparação de folhas A4 e cartazes menores')
expect(paperGuideHtml.includes('Qual a melhor gramatura de papel'), 'FAQ de papel ausente do HTML indexável')
expect(paperGuideHtml.includes('"@type":"Article"'), 'Schema Article ausente do guia de papel')
expect(paperGuideHtml.includes('name="twitter:description"'), 'Social metadata ausente do guia de papel')
expect(sitemap.includes('qual-papel-usar-para-cartaz'), 'Guia de papel ausente do sitemap')

expect(read('cartazes-para-acougue/index.html').includes('Cartazes de ofertas para açougue'), 'Landing de açougue sem conteúdo específico')
expect(read('.htaccess').includes('^cartaz-para-imprimir/?$'), '301 para URL antiga de impressão ausente')
// Uma página útil por intenção, não 100 URLs quase iguais ou uma lista de keywords no HTML.
const terms = SEARCH_INTENT_CLUSTERS.flatMap((topic) => topic.keywords)
expect(SEARCH_INTENT_CLUSTERS.length === 10, 'Esperados dez grupos de intenção SEO')
expect(terms.length === 100, 'O inventário deve conter as 100 buscas recebidas')
expect(new Set(terms).size === 100, 'Existem buscas repetidas no inventário SEO')
const indexable = new Set(INDEXABLE_PAGES.map((page) => page.slug))
for (const topic of SEARCH_INTENT_CLUSTERS) {
  expect(topic.keywords.length === 10, `Grupo incompleto: ${topic.name}`)
  expect(indexable.has(topic.target), `Destino SEO inexistente: ${topic.target}`)
  const html = read(`${topic.target}/index.html`)
  expect(html.includes(topic.title), `Título editorial ausente: ${topic.target}`)
  expect(html.includes(topic.text), `Conteúdo editorial ausente: ${topic.target}`)
  expect(html.includes(topic.link), `Link interno ausente: ${topic.target}`)
}
expect(read('como-funciona/index.html').includes('inteligência artificial está em desenvolvimento'), 'Não anunciar IA como recurso pronto')

// Regressões verificadas a partir dos achados do Search Console e AdSense.
const htaccess = read('.htaccess')
expect(htaccess.includes('^www\\.ofertamatica\\.com\\.br$'), 'Redirecionamento 301 do www ausente')
expect(htaccess.includes('RewriteRule ^ - [R=404,L]'), 'Rotas desconhecidas precisam responder 404')
expect(htaccess.includes('^(login|registro)/?$ - [G,L]'), 'Páginas antigas de cadastro precisam responder 410')
for (const [legacy, target] of [
  ['cartazes-para-supermercado', 'cartaz-para-supermercado'],
  ['excel-para-cartazes', 'cartazes-a-partir-de-excel'],
  ['gerador-de-cartaz-gratis', 'criador-de-cartaz-de-oferta'],
  ['gerador-de-placas-com-ia', 'como-funciona'],
]) {
  const redirectHtml = read(legacy + '/index.html')
  expect(redirectHtml.includes(SITE_URL + '/' + target + '/'), 'Redirecionamento HTML incorreto: ' + legacy)
  expect(htaccess.includes('^' + legacy + '/?$ /' + target + '/ [R=301,L]'), 'Redirecionamento HTTP 301 ausente: ' + legacy)
  expect(!sitemap.includes('<loc>' + SITE_URL + '/' + legacy + '/</loc>'), 'URL antiga no sitemap: ' + legacy)
}
expect(read('guias-para-varejo/index.html').includes('/placas-para-padaria/'), 'Hub sem link para padaria')
expect(read('guias-para-varejo/index.html').includes('/cartazes-a-partir-de-excel/'), 'Hub sem link para Excel')
expect(read('placas-para-padaria/index.html').includes('Como escrever o preço do pão'), 'Guia de padaria incompleto')
expect(read('cartazes-a-partir-de-excel/index.html').includes('Prepare a planilha'), 'Guia de Excel incompleto')
expect(read('placas-para-padaria/index.html').includes('/icons/icon-192.png'), 'Logo institucional ausente')
expect(index.includes('/guias-para-varejo/'), 'Home sem links HTML para os guias')
const sitemapUrls = sitemap.split('<loc>').slice(1).map((chunk) => chunk.split('</loc>')[0])
expect(sitemapUrls.length === INDEXABLE_PAGES.length + 1, 'Quantidade incorreta de URLs no sitemap')
expect(new Set(sitemapUrls).size === sitemapUrls.length, 'O sitemap contém URLs duplicadas')
const assetDir = path.join(dist, 'assets')
let cssContents = ''
if (fs.existsSync(assetDir)) {
  const cssFiles = fs.readdirSync(assetDir).filter((file) => file.endsWith('.css'))
  cssContents = cssFiles.map((file) => read('assets/' + file)).join('\n')
  expect(cssContents.includes('format-ad-zone'), 'CSS dos anúncios separados ausente')
} else {
  expect(false, 'Assets do build ausentes')
}

// Lighthouse: arquivos de descoberta e carregamento de fontes.
const llms = read('llms.txt')
expect(llms.startsWith('# Ofertamática'), 'llms.txt precisa de um H1 Markdown')
expect(llms.includes('https://ofertamatica.com.br/modelos/'), 'llms.txt não contém links úteis')
for (const manifestPath of ['ai-catalog.json', '.well-known/ai-catalog.json']) {
  const raw = read(manifestPath)
  try {
    const manifest = JSON.parse(raw)
    expect(manifest.specVersion === '1.0', 'Versão ARD inválida: ' + manifestPath)
    expect(manifest.host?.displayName === 'Ofertamática', 'Editor do catálogo ausente: ' + manifestPath)
    expect(Array.isArray(manifest.entries) && manifest.entries.length > 0, 'Catálogo sem recursos: ' + manifestPath)
    for (const entry of manifest.entries || []) {
      expect(/^urn:air:[a-zA-Z0-9.-]+(:[a-zA-Z0-9._-]+)+$/.test(entry.identifier), 'Identificador de catálogo inválido')
      expect(entry.url?.startsWith(SITE_URL + '/'), 'Catálogo com URL não pertencente ao site')
    }
  } catch {
    expect(false, 'JSON de catálogo inválido: ' + manifestPath)
  }
}
expect(cssContents.includes('font-display:swap'), 'Fontes ainda podem bloquear o texto inicial')
expect(!cssContents.includes('font-display:block'), 'Fonte está configurada com font-display:block')

// O CSS de prévias e as páginas de marketing devem ficar fora do carregamento inicial.
const entrySource = fs.readFileSync('src/main.jsx', 'utf8')
const appSource = fs.readFileSync('src/App.jsx', 'utf8')
const posterSheetSource = fs.readFileSync('src/components/posters/PosterSheet.jsx', 'utf8')
expect(!entrySource.includes("import './styles/posters.css'"), 'CSS de impressão voltou para a home')
expect(posterSheetSource.includes("import '../../styles/posters.css'"), 'CSS de impressão não acompanha o PosterSheet')
expect(appSource.includes("lazy(() => import('./components/SiteMarketing')"), 'Marketing deve carregar por rota')
expect(appSource.includes("lazy(() => import('./components/posters/PosterSheet')"), 'Prévia de impressão deve carregar sob demanda')

expect(fs.existsSync(path.join(dist, '.htaccess')), '.htaccess não foi copiado para dist')
expect(fs.existsSync(path.join(dist, 'manifest.webmanifest')), 'manifest.webmanifest não foi copiado para dist')
expect(fs.existsSync(path.join(dist, 'sw.js')), 'sw.js não foi copiado para dist')
expect(fs.existsSync(path.join(dist, 'icons', 'icon-192.png')), 'Ícone PWA 192x192 não foi copiado para dist')
expect(fs.existsSync(path.join(dist, 'icons', 'icon-512.png')), 'Ícone PWA 512x512 não foi copiado para dist')

if (failures.length) {
  console.error('\nFalhas de validação do build:')
  failures.forEach((failure) => console.error(' - ' + failure))
  process.exit(1)
}

console.log('Build validado: raiz + ' + INDEXABLE_PAGES.length + ' páginas, sitemap, ads.txt, SEO e assets OK.')
