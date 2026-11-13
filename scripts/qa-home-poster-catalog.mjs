import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { POSTER_MODEL_PRESETS } from '../src/config/posterModelPresets.js'

const base = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183'
const output = path.resolve('artifacts/design-audit/home-catalog')
await fs.mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const report = { generatedAt: new Date().toISOString(), totalModels: POSTER_MODEL_PRESETS.length, checkedModels: [], formats: [], errors: [] }
const errors = []
const modelIds = new Set()
const safe = (s) => String(s).replace(/[^a-z0-9_-]/gi, '-')
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const inputText = [
  'Café Especial 500g 18,90',
  'Arroz Tipo 1 5kg 24,90',
  'Pão Francês kg 10,90',
  'Leite Integral 1L 4,99',
  'Queijo Mussarela kg 29,90',
  'Açúcar Cristal 1kg 3,99',
  'Feijão Carioca 1kg 7,49',
  'Suco de Uva 1L 9,90',
].join('\n')

function listenErrors(page, label) {
  page.on('pageerror', err => {
    const message = String(err.message || err)
    if (message !== 'int64') errors.push(label + ': ' + message)
  })
}

async function rejectConsent(page) {
  const reject = page.getByRole('button', {name: 'Rejeitar opcionais'})
  if (await reject.isVisible().catch(() => false)) await reject.click()
}

async function begin(page, format) {
  listenErrors(page, format)
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' })
  await rejectConsent(page)
  await page.locator('.format-choice[data-format-id="' + format + '"]').click()
  await page.locator('.editor-page textarea[aria-label="Lista de produtos, uma linha por produto"]').waitFor()
  await page.locator('.editor-page textarea[aria-label="Lista de produtos, uma linha por produto"]').fill(inputText)
  await page.locator('.editor-page button.generate-button:not(.paste-generate-button)').click()
  await page.locator('.preview-card .real-poster-preview .poster-card, .preview-card .real-poster-preview .poster-app-card').first().waitFor()
  await page.evaluate(() => document.fonts.ready)
}

async function previewState(page) {
  return page.evaluate(() => {
    const preview = document.querySelector('.preview-card .real-poster-preview')
    const print = document.querySelector('.poster-print-root-complete')
    const card = preview?.querySelector('.poster-card')
    const printedCard = print?.querySelector('.poster-card')
    const price = card?.querySelector('.poster-field-price')
    const description = card?.querySelector('.poster-content-box')
    const r = card?.getBoundingClientRect()
    const rp = price?.getBoundingClientRect()
    const rd = description?.getBoundingClientRect()
    const within = (box) => Boolean(r && box && box.width > 0 && box.height > 0 &&
      box.left >= r.left - 3 && box.right <= r.right + 3 &&
      box.top >= r.top - 3 && box.bottom <= r.bottom + 3)
    const image = card?.querySelector('.ofertamatica-custom-header img')
    return {
      previewCards: preview?.querySelectorAll('.poster-card').length || 0,
      printableCards: print?.querySelectorAll('.poster-card').length || 0,
      theme: card?.dataset.posterTheme || '',
      printTheme: printedCard?.dataset.posterTheme || '',
      price: price?.textContent || '',
      printedPrice: printedCard?.querySelector('.poster-field-price')?.textContent || '',
      hasVisiblePrice: within(rp) && getComputedStyle(price).visibility !== 'hidden',
      hasDescription: within(rd) && (description?.innerText.trim().length || 0) > 0,
      headerImageOk: !image || (image.complete && image.naturalWidth > 0),
      noHeader: !card?.querySelector('.ofertamatica-poster-background'),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2,
    }
  })
}

try {
  // O catálogo inteiro: o teste percorre o mesmo seletor de artes da tela inicial.
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await begin(page, 'A4')
  await page.locator('[data-style-tab="art"]').click()
  const search = page.locator('.header-search input')
  await search.waitFor()

  for (const [index, model] of POSTER_MODEL_PRESETS.entries()) {
    try {
      assert(!modelIds.has(model.id), 'ID duplicado: ' + model.id)
      modelIds.add(model.id)
      await search.fill(model.name)
      const button = page.locator('[data-model-art="' + model.id + '"]')
      await button.waitFor({ state: 'visible', timeout: 12000 })
      await button.click()
      await page.waitForFunction(theme => document.querySelector('.preview-card .poster-card')?.dataset.posterTheme === theme,
        model.headerFooterStyle || 'moldura')
      const state = await previewState(page)
      assert(state.theme === (model.headerFooterStyle || 'moldura'), 'Tema da prévia incorreto: ' + state.theme)
      assert(state.printTheme === state.theme, 'Tema impresso não coincide com a prévia')
      assert(state.hasVisiblePrice, 'Preço invisível, vazio ou fora da placa')
      assert(state.hasDescription, 'Nome/descrição invisível ou fora da placa')
      assert(state.price.includes('18,90') && state.printedPrice.includes('18,90'), 'Preço da lista não foi preservado na prévia/impressão')
      assert(state.headerImageOk, 'Cabeçalho artístico não carregou')
      assert(state.noHeader === (model.headerFooterStyle === 'preimpresso'), 'Modo de papel pré-impresso inconsistente')
      assert(!state.horizontalOverflow, 'Rolagem horizontal indevida')
      const style = await page.evaluate(() => JSON.parse(localStorage.getItem('ofertamatica:poster-style:v1') || '{}'))
      assert(style.headerFooterStyle === (model.headerFooterStyle || 'moldura'), 'Modelo não foi salvo como selecionado')
      assert(style.offerMode === (model.offerMode || 'standard'), 'Tipo de oferta do modelo não foi aplicado')
      report.checkedModels.push({ id: model.id, ok: true, theme: state.theme, offerMode: style.offerMode })
      await page.locator('.preview-card .real-poster-preview').screenshot({ path: path.join(output, String(index + 1).padStart(2, '0') + '-' + safe(model.id) + '.png') })
      console.log('OK modelo inicial: ' + model.id)
    } catch (err) {
      const msg = model.id + ': ' + err.message
      errors.push(msg)
      report.checkedModels.push({ id: model.id, ok: false, error: err.message })
      console.error('FALHOU modelo inicial: ' + msg)
    }
  }
  await page.close()

  // Conferir a paginação do gerador: todos os 8 produtos, 4 por folha.
  for (const [format, perPage] of [['A4X4', 4], ['A4X8', 8], ['A4X2_CIMA_BAIXO', 2]]) {
    const formatPage = await browser.newPage({viewport: {width: 1440, height: 900}})
    try {
      await begin(formatPage, format)
      const counts = await formatPage.evaluate(() => ({
        preview: document.querySelectorAll('.preview-card .poster-card').length,
        printed: document.querySelectorAll('.poster-print-root-complete .poster-card').length,
        pages: document.querySelectorAll('.poster-print-root-complete .poster-print-sheet').length,
      }))
      const expectedPages = Math.ceil(8 / perPage)
      assert(counts.preview === perPage, format + ' mostrou ' + counts.preview + ' em vez de ' + perPage + ' por folha')
      assert(counts.printed === 8, format + ' imprimiu ' + counts.printed + ' em vez de 8')
      assert(counts.pages === expectedPages, format + ' deveria ter ' + expectedPages + ' páginas')
      if (expectedPages > 1) {
        await formatPage.getByRole('button', { name: 'Próxima folha' }).click()
        const label = await formatPage.locator('.preview-pager').innerText()
        assert(label.includes('Folha 2 de ' + expectedPages), format + ' não avançou à segunda folha')
      }
      report.formats.push({ format, ok: true, ...counts })
      await formatPage.locator('.preview-card .real-poster-preview').screenshot({path: path.join(output, 'formato-' + safe(format) + '.png')})
    } catch (err) {
      errors.push(format + ': ' + err.message)
      report.formats.push({format, ok: false, error: err.message})
    } finally { await formatPage.close() }
  }

  // Modo mobile: o estilo escolhido deve aparecer ao alternar para Prévia.
  const mobile = await browser.newPage({ viewport: {width: 390, height: 844}, deviceScaleFactor: 1 })
  try {
    await begin(mobile, 'A4')
    await mobile.locator('[data-mobile-tab="style"]').click()
    await mobile.locator('[data-style-tab="art"]').click()
    const searchMobile = mobile.locator('.header-search input')
    for (const model of POSTER_MODEL_PRESETS.filter(x => x.id.startsWith('black-friday'))) {
      await searchMobile.fill(model.name)
      await mobile.locator('[data-model-art="' + model.id + '"]').click()
      await mobile.locator('[data-mobile-tab="preview"]').click()
      await mobile.locator('.preview-card .poster-card[data-poster-theme="' + model.headerFooterStyle + '"]').waitFor({state: 'visible'})
      const state = await previewState(mobile)
      assert(state.hasVisiblePrice, 'Preço ausente no celular para ' + model.id)
      await mobile.locator('.preview-card .real-poster-preview').screenshot({path: path.join(output,'mobile-' + safe(model.id) + '.png')})
      await mobile.locator('[data-mobile-tab="style"]').click()
      console.log('OK modelo Black Friday no celular: ' + model.id)
    }
  } catch(err) {
    errors.push('Mobile Black Friday: ' + err.message)
  } finally { await mobile.close() }
} catch(err) {
  errors.push('Falha global do teste: ' + err.message)
} finally {
  report.errors = errors
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2))
  await browser.close()
}
console.log('Gerador inicial: ' + report.checkedModels.filter(x => x.ok).length + '/' + POSTER_MODEL_PRESETS.length +
  ' modelos aprovados; ' + report.formats.filter(x => x.ok).length + '/3 formatos aprovados; erros: ' + errors.length)
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2))
  process.exitCode = 1
}
