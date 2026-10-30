import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { POSTER_MODEL_PRESETS } from '../src/config/posterModelPresets.js'
import { curatedModelsForSlug, CURATED_POSTER_COLLECTIONS } from '../src/config/modelEditorialCollections.js'
import { INDEXABLE_PAGES } from '../src/seo/seoPages.js'

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
const bf = readFileSync('dist/cartaz-black-friday/index.html', 'utf8')
assert.match(bf, /Cartaz Black Friday e Placa para Imprimir Grátis/)
assert.match(bf, /placas-sazonais/)
assert.match(readFileSync('dist/placas-sazonais/index.html','utf8'), /HALLOWEEN/)
assert.match(readFileSync('dist/placas-sazonais/index.html','utf8'), /OFERTAS DE NATAL/)
assert.match(readFileSync('dist/index.html','utf8'), /placas-sazonais/)
assert.ok(existsSync('dist/placas-para-acougue/index.html'), 'Redirecionamento antigo de açougue ausente')
assert.match(readFileSync('dist/placas-para-acougue/index.html','utf8'), /cartazes-para-acougue/)
const homeJs = readFileSync('src/App.jsx','utf8')
const creatorJs = readFileSync('src/CreatorApp.jsx','utf8')
const popup = readFileSync('src/components/FeedbackNudge.jsx','utf8')
assert.match(homeJs, /<FeedbackNudge/)
assert.match(creatorJs, /<FeedbackNudge/)
assert.match(popup, /mailto:/)
assert.match(popup, /Deixe seu feedback/)
assert.match(popup, /maxLength=\{400\}/)
assert.ok(!popup.includes('fetch('), 'Feedback não envia formulário silenciosamente')
assert.match(readFileSync('src/styles/feedback-nudge.css','utf8'), /@media print/)
console.log('SEO e modelos: coleções editáveis, páginas com prévia, alias antigo e convite de feedback validados.')
