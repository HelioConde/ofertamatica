import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { curatedModelsForSlug } from '../src/config/modelEditorialCollections.js'

// Confere HTML entregue ao buscador e experiência após hidratação no navegador.
// O teste não exige Search Console nem chamadas externas no build.
const base = (process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183').replace(/\/$/, '')
const url = base + '/cartaz-black-friday/'
const collection = curatedModelsForSlug('cartaz-black-friday')
assert.equal(collection.models.length, 16, 'Título e descrição devem refletir exatamente 16 modelos')
const outDir = path.resolve('artifacts/design-audit')
await fs.mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
try {
  for (const viewport of [
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'desktop-1440', width: 1440, height: 900 },
  ]) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: 'reduce',
      deviceScaleFactor: 1,
    })
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' })
      assert.equal(response.status(), 200, 'Black Friday deve responder HTTP 200')
      const source = await response.text()
      assert.ok(source.includes('<title>Cartaz Black Friday: 16 Modelos para Imprimir Grátis</title>'), 'Meta title fora do HTML inicial')
      assert.ok(source.includes('16 modelos editáveis') && source.includes('Sem cadastro'), 'Meta descrição não corresponde aos modelos')
      assert.ok(source.includes('href="#modelos-black-friday"') && source.includes('id="modelos-black-friday"'), 'Âncora da galeria ausente no HTML inicial')
      assert.ok(source.indexOf('id="modelos-black-friday"') < source.indexOf('Como criar um cartaz Black Friday grátis, passo a passo'),
        'Modelos deveriam estar antes do artigo no HTML inicial')

      const gallery = page.locator('.seo-black-friday-page #modelos-black-friday')
      await gallery.locator('.model-showcase-card-real').first().waitFor({ state: 'visible', timeout: 25000 })
      await page.evaluate(() => document.fonts.ready)
      assert.match(await page.locator('h1').first().innerText(), /16 modelos de cartaz Black Friday/i)
      assert.equal(await gallery.locator('.model-showcase-card-real').count(), 16, 'Galeria deve oferecer 16 modelos reais')
      assert.equal(await page.getByRole('button', { name: 'Criar meu cartaz grátis' }).first().count(), 1)

      // Fotografar o hero da experiência real antes de navegar pelos modelos.
      const reject = page.getByRole('button', { name: /Rejeitar opcionais/i })
      if (await reject.isVisible()) await reject.click()
      await page.screenshot({
        path: path.join(outDir, 'black-friday-hero-' + viewport.name + '.png'),
        animations: 'disabled',
      })

      const heroCta = page.locator('.seo-black-friday-models-cta')
      await heroCta.focus()
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => window.location.hash === '#modelos-black-friday')
      const galleryTop = await gallery.evaluate((el) => el.getBoundingClientRect().top)
      assert.ok(galleryTop >= -15 && galleryTop < viewport.height,
        'Atalho da busca deve levar à galeria, não ao começo do criador: top=' + galleryTop)

      const economical = gallery.getByRole('button', { name: 'Fundo branco · econômico' })
      await economical.click()
      assert.equal(await economical.getAttribute('aria-pressed'), 'true', 'Filtro econômico não anuncia seleção')
      assert.equal(await gallery.locator('.model-showcase-card-real').count(), 6, 'Seis modelos econômicos esperados')
      await gallery.getByRole('button', { name: 'Todos os estilos' }).click()
      assert.equal(await gallery.locator('.model-showcase-card-real').count(), 16, 'Reset deve recuperar 16 modelos')

      const first = gallery.locator('.model-showcase-card-real').first()
      await first.getByRole('button', { name: /Usar modelo/i }).click()
      const saved = await page.evaluate(() => window.localStorage.getItem('ofertamatica:poster-style:v1'))
      assert.ok(saved, 'Clique em modelo deve salvar o estilo escolhido no criador')
      assert.ok(JSON.parse(saved).headerText, 'Estilo escolhido incompleto')
      console.log('[black-friday] ' + viewport.name + ': SEO inicial, 16 modelos, atalho, filtro econômico, teclado e estilo OK')
    } finally {
      await page.close()
    }
  }
} finally {
  await browser.close()
}
