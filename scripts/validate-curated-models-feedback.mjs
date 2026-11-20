import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { POSTER_MODEL_PRESETS } from '../src/config/posterModelPresets.js'
import { brlCents, inspectDePor } from '../src/poster-engine/priceComparison.js'
import { curatedModelsForSlug, CURATED_POSTER_COLLECTIONS } from '../src/config/modelEditorialCollections.js'
import { INDEXABLE_PAGES } from '../src/seo/seoPages.js'

// Preços no De/Por devem ser reais, numéricos e estritamente decrescentes.
assert.equal(brlCents('R$ 1.299,90'), 129990)
assert.equal(brlCents('19,90'), 1990)
assert.equal(brlCents('19.90'), 1990)
assert.equal(brlCents('19abc'), null)
assert.equal(inspectDePor('24,90', '18,90').valid, true)
assert.equal(inspectDePor('24,90', '18,90').discountPercent, 24)
assert.equal(inspectDePor('18,90', '18,90').valid, false)
assert.equal(inspectDePor('9,90', '18,90').valid, false)
assert.equal(inspectDePor('abc', '18,90').valid, false)

const ids = new Set(POSTER_MODEL_PRESETS.map((model) => model.id))
for (const slug of Object.keys(CURATED_POSTER_COLLECTIONS)) {
  const c = curatedModelsForSlug(slug)
  assert.ok(c.models.length >= 3, 'Mínimo três modelos úteis: ' + slug)
  assert.ok(c.models.every((id) => ids.has(id)), 'Modelo inexistente em ' + slug)
  assert.ok(c.models.every((id) => POSTER_MODEL_PRESETS.find((model) => model.id === id).product), 'Exemplos reais por modelo')
  assert.ok(INDEXABLE_PAGES.some((page) => page.slug === slug), 'Página não publicada: ' + slug)
  const path = 'dist/' + slug + '/index.html'
  assert.ok(existsSync(path), 'Falta HTML estático de ' + slug)
  const html = readFileSync(path, 'utf8')
  assert.ok(html.includes('curated-collection-title'), 'HTML sem modelos úteis: ' + slug)
  for (const id of c.models) {
    const model = POSTER_MODEL_PRESETS.find((m) => m.id === id)
    assert.ok(html.includes(model.name), 'HTML não mostra modelo ' + id + ' em ' + slug)
  }
  assert.ok(html.includes('R$'), 'Falta exemplo visível de preço na prévia de ' + slug)
  assert.ok(/fict[ií]ci|demonstrativ|preços de exemplo/i.test(html), 'Falta transparência nos preços demonstrativos: ' + slug)
}
const newBlackFridayModels = [
  'black-friday-etiqueta',
  'black-friday-de-por',
  'black-friday-relampago',
  'black-friday-kit',
  'black-friday-premium',
  'black-friday-estouro',
]
const blackFridayCollection = CURATED_POSTER_COLLECTIONS['cartaz-black-friday']
for (const id of newBlackFridayModels) {
  const model = POSTER_MODEL_PRESETS.find((preset) => preset.id === id)
  assert.ok(model, 'Modelo Black Friday não cadastrado: ' + id)
  assert.ok(blackFridayCollection.models.includes(id), 'Modelo ausente da coleção Black Friday: ' + id)
  assert.ok(model.headerFooterStyle.startsWith('bf-'), 'Tema editável não associado: ' + id)
  if (model.offerMode === 'de-por') assert.ok(model.previewRegularPrice, 'De/Por precisa de preço anterior demonstrativo: ' + id)
}
const blackFridayCss = readFileSync('src/styles/black-friday-models.css', 'utf8')
for (const id of newBlackFridayModels) {
  const theme = POSTER_MODEL_PRESETS.find((preset) => preset.id === id).headerFooterStyle
  assert.ok(blackFridayCss.includes('data-poster-theme="' + theme + '"'), 'CSS ausente para ' + id)
}
assert.ok(readFileSync('src/components/posters/PosterCard.jsx', 'utf8').includes('data-poster-theme'), 'Prévia e impressão devem compartilhar a arte editável')

const bf = readFileSync('dist/cartaz-black-friday/index.html', 'utf8')
for (const id of newBlackFridayModels) {
  const model = POSTER_MODEL_PRESETS.find((preset) => preset.id === id)
  assert.ok(bf.includes(model.name), 'Página Black Friday sem o modelo ' + id)
}

const economicalModels = ["black-friday-economico","black-friday-branco-impacto","esquenta-black-friday-antecipada","esquenta-black-friday-de-por","esquenta-black-friday-semana","esquenta-black-friday-especial"]
assert.ok(economicalModels.filter((id) => id.startsWith('esquenta-black-friday-')).length >= 4, 'Mínimo de quatro opções Esquenta Black Friday')
for (const id of economicalModels) {
  const model = POSTER_MODEL_PRESETS.find((item) => item.id === id)
  assert.ok(model, 'Modelo econômico não cadastrado: ' + id)
  assert.equal(model.background.toLowerCase(), '#ffffff', 'Fundo branco obrigatório: ' + id)
  assert.equal(model.price.toLowerCase(), '#111111', 'Preço preto obrigatório: ' + id)
  assert.equal(model.text.toLowerCase(), '#111111', 'Texto preto obrigatório: ' + id)
  assert.ok(model.headerFooterStyle.startsWith('bf-eco-'), 'Modelo não usa tema econômico: ' + id)
  assert.ok(blackFridayCss.includes('data-poster-theme="' + model.headerFooterStyle + '"'), 'CSS econômico não encontrado: ' + id)
  assert.ok(blackFridayCollection.models.includes(id), 'Modelo não está na galeria de Black Friday: ' + id)
  assert.ok(CURATED_POSTER_COLLECTIONS['placas-sazonais'].models.includes(id), 'Modelo não está em placas sazonais: ' + id)
  assert.ok(bf.includes(model.name), 'Modelo econômico não publicado no HTML: ' + id)
}
assert.equal(POSTER_MODEL_PRESETS.find((item) => item.id === 'esquenta-black-friday-de-por').offerMode, 'de-por')

const blackFridayPage = INDEXABLE_PAGES.find((page) => page.slug === 'cartaz-black-friday')
assert.ok(blackFridayPage, 'Página Black Friday não cadastrada')
assert.ok(bf.includes('<title>' + blackFridayPage.title + '</title>'), 'HTML Black Friday deve usar o título do catálogo SEO')
// Alinhamento entre metadados, HTML pré-renderizado e galeria interativa.
assert.ok(bf.includes('<meta name="description" content="' + blackFridayPage.description + '"'), 'Meta description Black Friday divergente')
assert.ok(bf.includes('<link rel="canonical" href="https://ofertamatica.com.br/cartaz-black-friday/"'), 'Canonical Black Friday incorreta')
assert.equal((bf.match(/id="modelos-black-friday"/g) || []).length, 1, 'Âncora de modelos duplicada ou ausente no HTML indexável')
assert.ok(bf.includes('href="#modelos-black-friday"'), 'CTA da galeria ausente no HTML estático')
assert.ok(bf.indexOf('id="modelos-black-friday"') < bf.indexOf('Como criar um cartaz Black Friday grátis, passo a passo'), 'Coleção indexável precisa aparecer antes do tutorial longo')
assert.ok(bf.indexOf('Black Friday · Branco econômico') < bf.indexOf('Black Friday · Etiqueta neon'), 'Modelos econômicos precisam aparecer primeiro')
const blackFridayRuntime = readFileSync('src/components/SiteMarketing.jsx', 'utf8')
assert.match(blackFridayRuntime, /id=\{blackFriday \? 'modelos-black-friday'/)
assert.match(blackFridayRuntime, /href="#modelos-black-friday"/)
assert.match(blackFridayRuntime, /!isBlackFriday \? <SeoPosterExample/)
assert.match(blackFridayRuntime, /href="\/cartaz-black-friday\/"/)
assert.match(bf, /placas-sazonais/)
assert.match(readFileSync('dist/placas-sazonais/index.html','utf8'), /HALLOWEEN/)
assert.match(readFileSync('dist/placas-sazonais/index.html','utf8'), /OFERTAS DE NATAL/)
assert.match(readFileSync('dist/index.html','utf8'), /placas-sazonais/)
assert.ok(existsSync('dist/placas-para-acougue/index.html'), 'Redirecionamento antigo de açougue ausente')
assert.match(readFileSync('dist/placas-para-acougue/index.html','utf8'), /cartazes-para-acougue/)
const homeJs = readFileSync('src/App.jsx','utf8')
const creatorJs = readFileSync('src/CreatorApp.jsx','utf8')
const popup = readFileSync('src/components/FeedbackNudge.jsx','utf8')
const deferred = readFileSync('src/components/DeferredFeedbackNudge.jsx','utf8')
assert.match(homeJs, /<DeferredFeedbackNudge/)
assert.match(creatorJs, /<DeferredFeedbackNudge/)
assert.match(deferred, /lazy\(\(\) => import\('\.\/FeedbackNudge'\)\)/)
assert.match(deferred, /OPEN_AFTER_MS = 16000/)
assert.match(deferred, /PRELOAD_AHEAD_MS = 4000/)
assert.match(popup, /openAt/)
assert.match(popup, /mailto:/)
assert.match(popup, /Deixe seu feedback/)
assert.match(popup, /maxLength=\{400\}/)
assert.ok(!popup.includes('fetch('), 'Feedback não envia formulário silenciosamente')
assert.match(readFileSync('src/styles/feedback-nudge.css','utf8'), /@media print/)
console.log('SEO e modelos: coleções editáveis, páginas com prévia, alias antigo e convite de feedback validados.')
