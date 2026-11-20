import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

// Mede o conteúdo renderizado das seis placas editáveis, não screenshots estáticas.
// Não altera folha, preço, CSS de impressão ou dados do usuário.
const base = (process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183').replace(/\/$/, '')
const themes = ['bf-eco-classico', 'bf-eco-impacto', 'bf-eco-antecipada', 'bf-eco-depor', 'bf-eco-semana', 'bf-eco-especial']
const browser = await chromium.launch({ headless: true })
const results = []
const failures = []

try {
  for (const width of [360, 390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    try {
      const response = await page.goto(base + '/cartaz-black-friday/', { waitUntil: 'domcontentloaded' })
      if (!response || response.status() >= 400) throw Error('Black Friday não respondeu HTTP 200 em ' + width + 'px')
      await page.locator('#modelos-black-friday .model-showcase-card').first().waitFor({ state: 'visible', timeout: 30000 })
      await page.evaluate(() => document.fonts.ready)
      for (const theme of themes) {
        const el = page.locator('#modelos-black-friday .poster-card[data-poster-theme="' + theme + '"]')
        if (await el.count() !== 1) throw Error('Modelo não renderizado: ' + theme)
        const data = await el.evaluate(root => {
          const ribbon = root.querySelector('.ofertamatica-offer-ribbon')
          const title = ribbon?.querySelector('b')
          const price = root.querySelector('.poster-field-price')
          const bg = root.querySelector('.ofertamatica-poster-background')
          const rect = node => {
            const x = node?.getBoundingClientRect()
            return x ? { left: x.left, top: x.top, right: x.right, bottom: x.bottom, width: x.width, height: x.height } : null
          }
          const r = rect(ribbon), t = rect(title), p = rect(price), sheet = rect(root)
          const font = title ? getComputedStyle(title) : null
          return {
            theme: root.dataset.posterTheme,
            label: title?.innerText || '',
            priceText: price?.textContent?.trim() || '',
            ribbon: r, title: t, price: p, sheet,
            fontReady: font?.fontFamily || '',
            titleScrollWidth: title?.scrollWidth || 0,
            titleClientWidth: title?.clientWidth || 0,
            titleOverflowX: title ? Math.max(0, title.scrollWidth - title.clientWidth) : null,
            ribbonBackground: ribbon ? getComputedStyle(ribbon).backgroundColor : null,
            titleColor: title ? getComputedStyle(title).color : null,
            sheetBackground: bg ? getComputedStyle(bg).backgroundColor : null,
          }
        })
        const report = { width, ...data }
        results.push(report)
        const fail = reason => failures.push({ width, theme, reason })
        if (!data.ribbon || !data.title || !data.price || !data.sheet) {
          fail('Parte estrutural da placa ausente')
          continue
        }
        if (data.titleOverflowX > 1) fail('Texto do cabeçalho ultrapassa espaço (' + data.titleOverflowX + 'px)')
        if (data.title.left < data.ribbon.left - 1 || data.title.right > data.ribbon.right + 1) {
          fail('Cabeçalho extrapola a faixa preta')
        }
        if (data.ribbon.left < data.sheet.left - 1 || data.ribbon.right > data.sheet.right + 1) {
          fail('Tarja preta fora da placa')
        }
        if (data.ribbonBackground !== 'rgb(8, 8, 8)' || data.titleColor !== 'rgb(255, 255, 255)') {
          fail('Contraste do cabeçalho não corresponde ao design aprovado')
        }
        if (data.sheetBackground !== 'rgb(255, 255, 255)') fail('Papel não está branco')
        if (!data.priceText.includes('R$')) fail('Preço demonstrativo não aparece')
      }
      console.log('[bf-geometry] Teste em ' + width + 'px concluído para seis modelos')
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
mkdirSync('artifacts/design-audit', { recursive: true })
writeFileSync('artifacts/design-audit/black-friday-six-geometry.json',
  JSON.stringify({ checkedAt: new Date().toISOString(), results, failures }, null, 2) + '\n')
for (const issue of failures) console.error('[bf-geometry] ' + JSON.stringify(issue))
if (failures.length) throw Error('Foram encontrados ' + failures.length + ' problemas de cabeçalho: revisar black-friday-six-geometry.json')
console.log('[bf-geometry] Cabeçalhos das seis placas íntegros em quatro larguras')
