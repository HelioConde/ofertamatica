import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import assert from 'node:assert/strict'

// Verifica as seis placas REAIS renderizadas pelo PosterSheet, não uma imagem
// estática. CSS de tela e impressão devem conservar preto/branco e preços.
// Os testes de geometrias A4/A3/SRA3/PDF continuam no fluxo principal.
const base = (process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183').replace(/\/$/, '')
const themes = [
  'bf-eco-classico', 'bf-eco-impacto', 'bf-eco-antecipada',
  'bf-eco-depor', 'bf-eco-semana', 'bf-eco-especial',
]
const darkPrices = new Set([
  'bf-eco-impacto', 'bf-eco-antecipada', 'bf-eco-depor', 'bf-eco-especial',
])
const browser = await chromium.launch({ headless: true })
mkdirSync('artifacts/design-audit', { recursive: true })

try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    try {
      const response = await page.goto(base + '/cartaz-black-friday/', { waitUntil: 'domcontentloaded' })
      assert.ok(response && response.status() < 400, 'Página Black Friday indisponível')
      const gallery = page.locator('#modelos-black-friday .model-showcase-card')
      await gallery.first().waitFor({ state: 'visible', timeout: 30000 })
      assert.equal(await gallery.count(), 16, 'Os outros dez modelos devem permanecer disponíveis')
      const cases = gallery.locator('.poster-card[data-poster-theme^="bf-eco-"]')
      assert.equal(await cases.count(), 6, 'A galeria deve exibir os seis modelos brancos editáveis')
      const found = await cases.evaluateAll(nodes => nodes.map(node => node.dataset.posterTheme))
      assert.deepEqual(found, themes, 'A ordem dos seis modelos brancos mudou')

      async function inspect(media) {
        await page.emulateMedia({ media })
        for (const theme of themes) {
          const card = page.locator('#modelos-black-friday .poster-card[data-poster-theme="' + theme + '"]')
          const actual = await card.evaluate(el => {
            const ribbon = el.querySelector('.ofertamatica-offer-ribbon')
            const bg = el.querySelector('.ofertamatica-poster-background')
            const price = el.querySelector('.poster-field-price')
            const priceBox = el.querySelector('.poster-price-box')
            return {
              ribbonColor: getComputedStyle(ribbon).color,
              ribbonBg: getComputedStyle(ribbon).backgroundColor,
              ribbonText: ribbon.textContent.trim(),
              paperBg: getComputedStyle(bg).backgroundColor,
              priceColor: getComputedStyle(price).color,
              priceBg: getComputedStyle(priceBox, '::before').backgroundColor,
              priceText: price.textContent.trim(),
              headerHeight: ribbon.getBoundingClientRect().height,
            }
          })
          assert.equal(actual.ribbonBg, 'rgb(8, 8, 8)', media + ': cabeçalho não preto em ' + theme)
          assert.equal(actual.ribbonColor, 'rgb(255, 255, 255)', media + ': título não branco em ' + theme)
          assert.equal(actual.paperBg, 'rgb(255, 255, 255)', media + ': folha não branca em ' + theme)
          assert.ok(actual.ribbonText.includes('BLACK FRIDAY'), 'Título ausente em ' + theme)
          assert.ok(actual.headerHeight > 0, 'Cabeçalho sem altura em ' + theme)
          assert.ok(actual.priceText.includes('R$'), 'Preço real editável não apareceu em ' + theme)
          const dark = darkPrices.has(theme)
          assert.equal(actual.priceColor, dark ? 'rgb(255, 255, 255)' : 'rgb(16, 16, 16)',
            media + ': preço com contraste incorreto em ' + theme)
          assert.equal(actual.priceBg, dark ? 'rgb(8, 8, 8)' : 'rgb(255, 255, 255)',
            media + ': fundo do preço incorreto em ' + theme)
        }
      }
      await inspect('screen')
      const comparison = page.locator('.poster-card[data-poster-theme="bf-eco-depor"] .poster-offer-meta-depor')
      // A galeria aplica content-visibility:auto nos cartões fora da tela.
      // Role até a placa antes de pedir innerText (senão Chromium retorna '').
      await comparison.scrollIntoViewIfNeeded()
      await comparison.waitFor({ state: 'visible' })
      const oldPrice = await comparison.innerText()
      const rawPrice = await comparison.textContent()
      const metaStyles = await comparison.evaluate(node => ({
        display: getComputedStyle(node).display,
        visibility: getComputedStyle(node).visibility,
        width: node.getBoundingClientRect().width,
        children: [...node.children].map(child => ({
          tag: child.tagName,
          text: child.textContent,
          display: getComputedStyle(child).display,
          visibility: getComputedStyle(child).visibility,
        })),
      }))
      console.log('[bf-depor-qa] ', JSON.stringify({ oldPrice, rawPrice, metaStyles }))
      // Com content-visibility:auto o Chromium pode retornar innerText vazio
      // mesmo após scroll. O texto DOM, a árvore de elementos e os estilos
      // comprovam que a comparação editável existe e será impressa.
      assert.ok(rawPrice?.includes('6,99') && rawPrice.includes('POR')
        && metaStyles.width > 0 && metaStyles.display !== 'none' && metaStyles.visibility !== 'hidden'
        && metaStyles.children.some(item => item.tag === 'B' && item.text === 'POR' && item.display !== 'none'),
        'De/Por perde comparação de preço demonstrativo: ' + JSON.stringify({ oldPrice, rawPrice, metaStyles }))
      if (width === 1440) {
        for (let i = 0; i < 6; i++) {
          await gallery.nth(i).screenshot({ path: 'artifacts/design-audit/black-friday-branca-v2-' + (i + 1) + '.png' })
        }
      }
      await inspect('print')
      await page.emulateMedia({ media: 'screen' })
      const scroll = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth)
      assert.ok(scroll <= 8, 'Rolagem horizontal inesperada em ' + width + ': ' + scroll)
      console.log('[bf-white-six] ' + width + 'px: 6 estilos, cores, preço e impressão OK')
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
