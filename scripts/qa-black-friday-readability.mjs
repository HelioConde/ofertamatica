import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'

// Capturas REAIS da página servida pelo Vite + medição do PosterCard.
// Esta verificação nunca cria imagens por IA e não altera arte nem impressora.
const base = (process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183').replace(/\/$/, '')
const labels = new Map([
  ['bf-eco-antecipada', 'ANTECIPADA'],
  ['bf-eco-depor', 'DE / POR'],
  ['bf-eco-semana', 'ESPECIAL DA SEMANA'],
  ['bf-eco-especial', 'OFERTA ESPECIAL'],
])
const themes = ['bf-eco-classico', 'bf-eco-impacto', ...labels.keys()]
const browser = await chromium.launch({ headless: true })
const folder = 'artifacts/design-audit'
mkdirSync(folder, { recursive: true })
const report = []

try {
  for (const width of [390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 920 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    try {
      const res = await page.goto(base + '/cartaz-black-friday/', { waitUntil: 'domcontentloaded' })
      assert.ok(res && res.status() < 400, 'Página Black Friday indisponível: ' + width)
      const gallery = page.locator('#modelos-black-friday')
      await gallery.locator('.model-showcase-card-white-black-friday').first().waitFor({ state: 'visible', timeout: 30000 })
      // Captura real da galeria sem a faixa de consentimento cobrindo os cartazes.
      const rejectOptional = page.getByRole('button', { name: /Rejeitar opcionais/i })
      if (await rejectOptional.count() && await rejectOptional.isVisible()) await rejectOptional.click()
      await page.evaluate(() => document.fonts.ready)
      assert.equal(await gallery.locator('.model-showcase-card-white-black-friday').count(), 6)
      for (const theme of themes) {
        const model = gallery.locator('.model-showcase-card-white-black-friday').filter({
          has: page.locator('.poster-card[data-poster-theme="' + theme + '"]'),
        })
        assert.equal(await model.count(), 1, 'Modelo econômico ausente: ' + theme)
        const actual = await model.evaluate(root => {
          const poster = root.querySelector('.poster-card')
          const ribbon = poster.querySelector('.ofertamatica-offer-ribbon')
          const title = ribbon.querySelector('b')
          const badge = ribbon.querySelector('.bf-eco-subheading')
          const firstProductLine = poster.querySelector('.poster-content-stack .poster-field')
          const preview = root.querySelector('.model-real-poster-scale')
          const rawWidth = preview.offsetWidth
          const visibleWidth = preview.getBoundingClientRect().width
          const scale = visibleWidth / rawWidth
          const fontPx = el => el ? Number.parseFloat(getComputedStyle(el).fontSize) * scale : null
          const rectangle = el => el ? el.getBoundingClientRect().toJSON() : null
          return {
            title: title.textContent.trim(),
            badge: badge?.textContent.trim() || '',
            titleVisiblePx: fontPx(ribbon),
            badgeVisiblePx: fontPx(badge),
            titleOverflow: title.scrollWidth - title.clientWidth,
            badgeOverflow: badge ? badge.scrollWidth - badge.clientWidth : 0,
            previewWidth: rectangle(root.querySelector('.model-real-poster-shell'))?.width,
            ribbon: rectangle(ribbon), titleRect: rectangle(title),
            badgeRect: rectangle(badge), productRect: rectangle(firstProductLine),
            badgeBg: badge ? getComputedStyle(badge).backgroundColor : null,
            badgeColor: badge ? getComputedStyle(badge).color : null,
          }
        })
        report.push({ width, theme, ...actual })
        assert.ok(actual.titleVisiblePx >= 10, theme + ' cabeçalho muito pequeno: ' + actual.titleVisiblePx + 'px')
        assert.ok(actual.titleOverflow <= 1, theme + ' título extrapolou: ' + actual.titleOverflow + 'px')
        assert.ok(actual.titleRect.right <= actual.ribbon.right + 1, theme + ' título fora da tarja')
        if (labels.has(theme)) {
          assert.equal(actual.badge, labels.get(theme), theme + ' selo diferente do aprovado')
          assert.ok(actual.badgeVisiblePx >= 7.7, theme + ' selo ilegível na miniatura: ' + actual.badgeVisiblePx)
          assert.ok(actual.badgeOverflow <= 1, theme + ' selo cortado: ' + actual.badgeOverflow + 'px')
          assert.equal(actual.badgeBg, 'rgb(8, 8, 8)', theme + ' selo sem tarja preta')
          assert.equal(actual.badgeColor, 'rgb(255, 255, 255)', theme + ' selo sem texto branco')
          if (actual.productRect && actual.badgeRect) {
            // Acentos (FEIJÃO / ÓLEO) ultrapassam visualmente o topo da caixa de texto.
            // Exigir folga além do bounding box evita colisão visual com o selo.
            assert.ok(actual.productRect.top - actual.badgeRect.bottom >= 10,
              theme + ' selo sem respiro para acentos: ' + (actual.productRect.top - actual.badgeRect.bottom) + 'px')
          }
        } else {
          assert.equal(actual.badge, '', theme + ' não deveria ter selo de Esquenta')
        }
      }
      const overflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - innerWidth)
      assert.ok(overflow <= 8, 'Overflow horizontal em ' + width + 'px: ' + overflow)
      if (width !== 768) {
        await page.screenshot({ path: folder + '/black-friday-pagina-real-' + width + '.png', fullPage: true, animations: 'disabled' })
        await gallery.screenshot({ path: folder + '/black-friday-galeria-real-' + width + '.png', animations: 'disabled' })
      }
      console.log('[bf-readability] ' + width + 'px: cabeçalhos, selos, legibilidade e captura real OK')
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
writeFileSync(folder + '/black-friday-tipografia-medida.json', JSON.stringify(report, null, 2) + '\n')
