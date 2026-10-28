import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { INDEXABLE_PAGES, SEO_PAGES } from '../src/seo/seoPages.js'

const read = (path) => readFileSync(path, 'utf8')
const ad = read('src/components/AdUnit.jsx')
const home = read('src/App.jsx')
const marketing = read('src/components/SiteMarketing.jsx')
const index = read('dist/index.html')
const publisher = 'ca-pub-9514218545388169'

assert.match(ad, /VITE_ADSENSE_APPROVED === 'true'/, 'Exibição de anúncios exige aprovação explícita')
assert.match(ad, /AD_SLOTS_APPROVED\s*\?/, 'Slots sem aprovação devem ficar vazios')
assert.ok(!home.includes('<AdUnit'), 'Não mostrar publicidade na seleção de formatos')
assert.ok(!marketing.includes("!isLegal && !isTrust) ? <AdUnit"), 'Não solicitar anúncios em páginas de navegação/institucionais')
assert.ok(marketing.includes('page.sections?.length >= 2'), 'Publicidade futura só em guias desenvolvidos')
assert.ok(marketing.includes("page.storeUse?.length >= 2"), 'Guia precisa ter aplicação prática')
assert.ok(index.includes(publisher), 'Script de identificação publisher não pode desaparecer')
assert.ok(index.includes('data-ofertamatica-adsense'), 'CMP do AdSense precisa continuar identificável')
assert.ok(index.indexOf('data-ofertamatica-consent-bootstrap="inline"') < index.indexOf('adsbygoogle.js'),
  'Consentimento precisa preceder código AdSense')
assert.ok(SEO_PAGES.length >= 8, 'Apenas auditar URLs efetivamente publicadas; não inventar conteúdo')
for (const page of INDEXABLE_PAGES) {
  const html = read('dist/' + page.slug + '/index.html')
  assert.ok(html.includes(page.heading), 'Título editorial ausente: ' + page.slug)
  assert.ok(html.includes(page.description), 'Descrição da página ausente: ' + page.slug)
}
console.log('Política AdSense: publisher mantido, slots bloqueados por aprovação, navegação sem anúncios e páginas verificadas.')
