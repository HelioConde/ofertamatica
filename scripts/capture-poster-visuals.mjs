import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183'
const outDir = path.resolve('screenshots/cartazes')
await fs.mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })

async function openQaPage(page) {
  const errors = []
  page.on('pageerror', (error) => {
    const message = String(error?.message || error || '')
    if (message === 'int64') return
    errors.push(message)
  })
  await page.goto(`${baseUrl}/visual-qa/cartazes`, { waitUntil: 'networkidle' })
  await page.locator('[data-fonts-ready="true"]').waitFor({ state: 'visible', timeout: 20_000 })
  await page.locator('.poster-visual-qa-card').first().waitFor({ state: 'visible' })
  return errors
}

const desktop = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 })
const desktopErrors = await openQaPage(desktop)
await desktop.screenshot({ path: path.join(outDir, 'latest-desktop-full.png'), fullPage: true })

const samples = await desktop.locator('.poster-visual-qa-card').evaluateAll((cards) => cards.map((card) => card.dataset.sample))
for (const sample of samples) {
  const card = desktop.locator(`[data-sample="${sample}"]`)
  await card.screenshot({ path: path.join(outDir, `latest-${sample}.png`) })
}

const metrics = await desktop.locator('.poster-visual-qa-card').evaluateAll((cards) => cards.map((card) => {
  const sample = card.dataset.sample
  const format = card.dataset.format
  const poster = card.querySelector('.poster-card')
  const content = card.querySelector('.poster-content-box')
  const price = card.querySelector('.poster-price-box')
  const description = card.querySelector('.poster-field-description')
  const subdescription = card.querySelector('.poster-field-subdescription')
  const unit = card.querySelector('.poster-field-unit')
  const priceText = card.querySelector('.poster-price-value')
  const header = card.querySelector('.ofertamatica-offer-ribbon, .ofertamatica-app-ribbon')
  const frameRoot = card.querySelector('.ofertamatica-poster-background, .ofertamatica-app-background')

  const relative = (element) => {
    if (!element || !poster) return null
    const root = poster.getBoundingClientRect()
    const box = element.getBoundingClientRect()
    return {
      x: Number((((box.left - root.left) / root.width) * 100).toFixed(2)),
      y: Number((((box.top - root.top) / root.height) * 100).toFixed(2)),
      width: Number(((box.width / root.width) * 100).toFixed(2)),
      height: Number(((box.height / root.height) * 100).toFixed(2)),
      fontPx: Number.parseFloat(getComputedStyle(element).fontSize || '0'),
      fontFamily: getComputedStyle(element).fontFamily,
    }
  }

  const headerStyle = header ? getComputedStyle(header) : null
  const headerBefore = header ? getComputedStyle(header, '::before') : null
  const headerAfter = header ? getComputedStyle(header, '::after') : null
  const expectedFrame = card.dataset.frame || ''
  const headerSignature = headerStyle ? [
    headerStyle.left,
    headerStyle.right,
    headerStyle.top,
    headerStyle.width,
    headerStyle.height,
    headerStyle.borderRadius,
    headerStyle.clipPath,
    headerStyle.backgroundColor,
    headerStyle.color,
    headerBefore?.content || '',
    headerAfter?.content || '',
  ].join('|') : ''

  return {
    sample,
    format,
    frame: expectedFrame,
    headerFrameOk: Boolean(frameRoot && expectedFrame && frameRoot.classList.contains('poster-frame-' + expectedFrame)),
    headerSignature,
    header: relative(header),
    contentBox: relative(content),
    priceBox: relative(price),
    description: relative(description),
    subdescription: relative(subdescription),
    unit: relative(unit),
    price: relative(priceText),
    overflow: [content, price].some((element) => element && (
      element.scrollWidth > element.clientWidth + 1 ||
      element.scrollHeight > element.clientHeight + 1
    )),
  }
}))

const fontState = await desktop.evaluate(() => ({
  descriptionReady: document.fonts.check('16px "Burbank Big Cd Bk"'),
  priceReady: document.fonts.check('16px "Futura Price"'),
}))

const typographyWarnings = metrics.flatMap((item) => {
  const warnings = []
  const descriptionFamily = item.description?.fontFamily || ''
  const priceFamily = item.price?.fontFamily || ''
  if (item.description && !/Burbank Big Cd Bk|Impact|Arial Black/i.test(descriptionFamily)) {
    warnings.push(`${item.sample}: fonte inesperada na descrição (${descriptionFamily})`)
  }
  if (item.price && !/Futura Price/i.test(priceFamily)) {
    warnings.push(`${item.sample}: fonte inesperada no preço (${priceFamily})`)
  }
  return warnings
})

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
const mobileErrors = await openQaPage(mobile)
await mobile.screenshot({ path: path.join(outDir, 'latest-mobile-full.png'), fullPage: true })

await fs.writeFile(
  path.join(outDir, 'visual-state.json'),
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || null,
    desktopErrors,
    mobileErrors,
    fontState,
    typographyWarnings,
    samples,
    metrics,
  }, null, 2),
)

await browser.close()

const overflow = metrics.filter((item) => item.overflow)
const invalidFrames = metrics.filter((item) => !item.headerFrameOk)
const distinctHeaderSignatures = new Set(metrics.map((item) => item.headerSignature).filter(Boolean))
if (
  desktopErrors.length ||
  mobileErrors.length ||
  !fontState.descriptionReady ||
  !fontState.priceReady ||
  typographyWarnings.length ||
  invalidFrames.length ||
  distinctHeaderSignatures.size < 8
) {
  console.error(JSON.stringify({
    desktopErrors,
    mobileErrors,
    fontState,
    typographyWarnings,
    overflow,
    invalidFrames: invalidFrames.map((item) => ({ sample: item.sample, frame: item.frame })),
    distinctHeaderSignatures: distinctHeaderSignatures.size,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  samples: samples.length,
  screenshots: samples.length + 2,
  fontState,
  typographyWarnings,
  overflowWarnings: overflow.map((item) => item.sample),
  distinctHeaderSignatures: distinctHeaderSignatures.size,
  metrics,
}, null, 2))
