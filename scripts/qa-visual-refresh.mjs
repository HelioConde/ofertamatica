import { chromium } from 'playwright'

// Smoke visual da fase 2: verifica estilos calculados reais, não apenas arquivos.
// A auditoria de dimensões físicas e impressão continua em qa-release-print-import.
const base = (process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183').replace(/\/$/, '')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })

function ensure(condition, message) {
  if (!condition) throw new Error('[visual-refresh] ' + message)
}
async function visit(route, ready) {
  const response = await page.goto(base + route, { waitUntil: 'domcontentloaded' })
  ensure(response && response.status() < 400, 'HTTP inválido em ' + route)
  await page.locator(ready).first().waitFor({ state: 'visible', timeout: 20000 })
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}
async function inspect(selector) {
  return page.locator(selector).first().evaluate(el => {
    const css = getComputedStyle(el)
    return {
      radius: Number.parseFloat(css.borderTopLeftRadius),
      fontSize: Number.parseFloat(css.fontSize),
      backgroundImage: css.backgroundImage,
      backgroundColor: css.backgroundColor,
      color: css.color,
    }
  })
}

try {
  await visit('/', '.format-home-refresh .format-choice')
  const homeHero = await inspect('.format-home-refresh .format-dialog-head')
  const homeCard = await inspect('.format-home-refresh .format-choice')
  const navigation = await inspect('.site-header .nav-link')
  const headline = await inspect('.format-home-refresh .format-headline-accent')
  ensure(homeHero.backgroundImage.includes('linear-gradient'), 'hero azul da Home não foi aplicado')
  ensure(homeCard.radius >= 16, 'cartões da Home mantiveram cantos antigos')
  ensure(navigation.fontSize >= 12, 'menu desktop continua pequeno')
  ensure(headline.color !== 'rgb(255, 255, 255)', 'destaque tipográfico não carregado')
  console.log('[visual-refresh] Home e cabeçalho: OK')

  await page.locator('.format-home-refresh .format-choice').first().click()
  await page.locator('.editor-page .editor-topline').waitFor({ state: 'visible', timeout: 20000 })
  const editorHeader = await inspect('.editor-page .editor-topline')
  const editorCard = await inspect('.editor-page .editor-card')
  ensure(editorHeader.backgroundImage.includes('linear-gradient'), 'cabeçalho do editor sem nova identidade')
  ensure(editorCard.radius >= 18, 'painéis do gerador sem acabamento renovado')
  console.log('[visual-refresh] Gerador completo: OK')

  await visit('/modelos/', '.model-showcase-card')
  const modelsHero = await inspect('.seo-landing .seo-hero')
  const modelCard = await inspect('.seo-landing .model-showcase-card')
  ensure(modelsHero.radius >= 24, 'hero editorial não foi atualizado')
  ensure(modelCard.radius >= 18, 'galeria de modelos sem novo cartão')
  console.log('[visual-refresh] Páginas e galeria: OK')

  await visit('/editor-livre/', '.free-poster-editor .free-editor-controls')
  const freePanel = await inspect('.free-poster-editor .free-editor-controls')
  ensure(freePanel.radius >= 19, 'Editor Livre sem nova superfície')
  console.log('[visual-refresh] Editor Livre: OK')

  await visit('/validade-zero/', '.heading h1')
  const expiryHeading = await inspect('.main .heading')
  ensure(expiryHeading.backgroundImage.includes('linear-gradient'), 'Validade Zero sem nova identidade')
  ensure(expiryHeading.radius >= 19, 'Validade Zero sem cabeçalho renovado')
  console.log('[visual-refresh] Validade Zero: OK')
} finally {
  await browser.close()
}
