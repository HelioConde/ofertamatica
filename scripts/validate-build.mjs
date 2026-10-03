import fs from 'node:fs'
import path from 'node:path'
import { INDEXABLE_PAGES, SITE_URL } from '../src/seo/seoPages.js'

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

expect(fs.existsSync(path.join(dist, '.htaccess')), '.htaccess não foi copiado para dist')

if (failures.length) {
  console.error('\nFalhas de validação do build:')
  failures.forEach((failure) => console.error(' - ' + failure))
  process.exit(1)
}

console.log(`Build validado: raiz + ${INDEXABLE_PAGES.length} páginas, sitemap, ads.txt, GTM e assets OK.`)
