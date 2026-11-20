import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

// Verificação reproduzível de UX e SEO Black Friday.
// Nunca modifica as dimensões físicas ou o conteúdo de qualquer modelo.
const base = (process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183').replace(/\/$/, '')
const browser = await chromium.launch({ headless: true })
const output = 'artifacts/design-audit'
mkdirSync(output, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error('[black-friday] ' + message)
}

try {
  for (const width of [360, 390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 920 },
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    try {
      const response = await page.goto(base + '/cartaz-black-friday/', { waitUntil: 'domcontentloaded' })
      assert(response && response.status() < 400, 'Erro HTTP na landing')
      const gallery = page.locator('#modelos-black-friday')
      await gallery.locator('.model-showcase-card').first().waitFor({ state: 'visible', timeout: 30000 })
      const cards = gallery.locator('.model-showcase-card')
      assert(await cards.count() === 16, 'A coleção deve conter 16 modelos reais')
      const firstSix = await gallery.locator('.model-card-copy > strong').allTextContents()
      assert(firstSix.slice(0, 6).every(x => /branco|esquenta|econ[oô]mic/i.test(x)),
        'Os seis primeiros cartazes deveriam economizar tinta: ' + firstSix.slice(0, 6).join(' | '))
      assert(await page.getByRole('heading', { level: 1, name: /Cartaz Black Friday para imprimir grátis/i }).count() === 1,
        'Cabeçalho Black Friday ausente ou duplicado')
      assert(await page.locator('.black-friday-landing .seo-poster-example').count() === 0,
        'Prévia genérica indevidamente acima dos modelos reais')
      const meta = await page.locator('meta[name="description"]').getAttribute('content')
      assert(meta?.includes('16 modelos editáveis'), 'Meta description não descreve os modelos')
      assert(await page.locator('link[rel="canonical"]').getAttribute('href') ===
        'https://ofertamatica.com.br/cartaz-black-friday/', 'Canonical divergente')

      const anchor = page.locator('.black-friday-hero-models')
      assert(await anchor.getAttribute('href') === '#modelos-black-friday', 'CTA não aponta à galeria')
      const dimensions = await anchor.evaluate(el => {
        const r = el.getBoundingClientRect()
        return { h: r.height, font: Number.parseFloat(getComputedStyle(el).fontSize) }
      })
      assert(dimensions.h >= 44 && dimensions.font >= 13, 'CTA de modelos pequeno demais')
      if (width !== 390) await page.screenshot({ path: output + '/black-friday-' + width + '.png' })
      await anchor.click()
      assert(await page.evaluate(() => location.hash === '#modelos-black-friday'), 'CTA não navega para os modelos')
      const economic = gallery.getByRole('button', { name: /Fundo branco · econômico/i })
      await economic.click()
      assert(await cards.count() === 6, 'Filtro econômico precisa exibir seis modelos')
      const warmup = gallery.getByRole('button', { name: 'Esquenta Black Friday', exact: true })
      await warmup.click()
      assert(await cards.count() === 4, 'Filtro Esquenta precisa exibir quatro modelos')
      await gallery.getByRole('button', { name: 'Todos os estilos' }).click()
      assert(await cards.count() === 16, 'Filtros precisam permitir retornar aos 16 modelos')
      const overflow = await page.evaluate(() =>
        Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth
      )
      assert(overflow <= 8, 'Overflow horizontal em ' + width + 'px: ' + overflow)
      console.log('[black-friday] ' + width + 'px: 16 modelos, economia, filtros, CTA, metadados e overflow OK')
    } finally {
      await context.close()
    }
  }
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  try {
    await page.goto(base + '/modelos/', { waitUntil: 'domcontentloaded' })
    const bfLink = page.locator('.curated-seasonal-link a[href="/cartaz-black-friday/"]')
    await bfLink.waitFor({ state: 'visible', timeout: 20000 })
    assert(/16 modelos Black Friday/.test(await bfLink.innerText()), 'Galeria geral sem link específico')
    console.log('[black-friday] Link contextual direto a partir de /modelos/: OK')
  } finally {
    await context.close()
  }
} finally {
  await browser.close()
}
