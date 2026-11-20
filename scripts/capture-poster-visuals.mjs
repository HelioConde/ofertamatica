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
  // O aviso fixo estava sobreposto a capturas de cartazes na parte inferior.
  // Resolver apenas no navegador de QA, usando a opção real de rejeição;
  // nenhum consentimento é forçado ou alterado no produto publicado.
  const privacyBanner = page.locator('.cookie-banner')
  const bannerAppeared = await privacyBanner.waitFor({ state: 'visible', timeout: 2500 })
    .then(() => true).catch(() => false)
  if (bannerAppeared) {
    await privacyBanner.getByRole('button', { name: 'Rejeitar opcionais' }).click()
    await privacyBanner.waitFor({ state: 'hidden', timeout: 4000 })
  }
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
  const posterSurface = card.querySelector('.poster-card-layers, .poster-app-card')

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
  const parseRgb = (value) => {
    const values = String(value || '').match(/\d+(?:\.\d+)?/g)
    if (!values || values.length < 3) return null
    return values.slice(0, 3).map(Number)
  }
  const channel = (value) => {
    const normalized = value / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4
  }
  const luminance = (value) => {
    const color = parseRgb(value)
    if (!color) return null
    return (0.2126 * channel(color[0]))
      + (0.7152 * channel(color[1]))
      + (0.0722 * channel(color[2]))
  }
  const contrastRatio = (background, foreground) => {
    const a = luminance(background)
    const b = luminance(foreground)
    if (a === null || b === null) return 0
    const lighter = Math.max(a, b)
    const darker = Math.min(a, b)
    return (lighter + 0.05) / (darker + 0.05)
  }

  const frameStyle = frameRoot ? getComputedStyle(frameRoot) : null
  const surfaceStyle = posterSurface ? getComputedStyle(posterSurface) : null
  const descriptionStyle = description ? getComputedStyle(description) : null
  const priceTextStyle = priceText ? getComputedStyle(priceText) : null
  const posterBackground = surfaceStyle?.backgroundColor || frameStyle?.backgroundColor || ''
  const descriptionColor = descriptionStyle?.color || ''
  const priceColor = priceTextStyle?.color || ''
  const headerBackground = headerStyle?.backgroundColor || ''
  const headerColor = headerStyle?.color || ''

  // Uma caixa pode ter scrollHeight > clientHeight apenas pelo line-height
  // compacto da Futura Price. Como no QA físico de impressão, medir a tinta
  // real (Range) contra ancestrais que RECORTAM e contra o limite do cartaz.
  // Evitar corrigir arte aprovada por um falso positivo de scrollHeight.
  const inkClipping = [
    ['description', description],
    ['subdescription', subdescription],
    ['unit', unit],
    ['price', priceText],
  ].flatMap(([field, element]) => {
    if (!element || !element.textContent?.trim() || !poster) return []
    const range = document.createRange()
    range.selectNodeContents(element)
    const ink = range.getBoundingClientRect()
    const rect = ink.width && ink.height ? ink : element.getBoundingClientRect()
    const tolerance = 3
    const clippedBy = []
    for (let ancestor = element.parentElement; ancestor && ancestor !== card; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor)
      const horizontal = ['hidden', 'clip'].includes(style.overflowX)
      const vertical = ['hidden', 'clip'].includes(style.overflowY)
      if (!horizontal && !vertical) continue
      const bounds = ancestor.getBoundingClientRect()
      if ((horizontal && (rect.left < bounds.left - tolerance || rect.right > bounds.right + tolerance)) ||
          (vertical && (rect.top < bounds.top - tolerance || rect.bottom > bounds.bottom + tolerance))) {
        clippedBy.push(typeof ancestor.className === 'string' ? ancestor.className : ancestor.tagName)
      }
    }
    const page = poster.getBoundingClientRect()
    const outside = rect.left < page.left - tolerance || rect.right > page.right + tolerance ||
      rect.top < page.top - tolerance || rect.bottom > page.bottom + tolerance
    if (!clippedBy.length && !outside) return []
    return [{
      field,
      text: element.textContent.trim().slice(0, 60),
      clippedBy,
      outsidePoster: outside,
      ink: { x: Math.round(rect.left), y: Math.round(rect.top),
        width: Math.round(rect.width), height: Math.round(rect.height) },
    }]
  })

  return {
    sample,
    format,
    frame: expectedFrame,
    headerFrameOk: Boolean(frameRoot && expectedFrame && frameRoot.classList.contains('poster-frame-' + expectedFrame)),
    headerSignature,
    contrast: {
      posterBackground,
      descriptionColor,
      priceColor,
      headerBackground,
      headerColor,
      description: Number(contrastRatio(posterBackground, descriptionColor).toFixed(2)),
      price: Number(contrastRatio(posterBackground, priceColor).toFixed(2)),
      header: Number(contrastRatio(headerBackground, headerColor).toFixed(2)),
    },
    header: relative(header),
    contentBox: relative(content),
    priceBox: relative(price),
    description: relative(description),
    subdescription: relative(subdescription),
    unit: relative(unit),
    price: relative(priceText),
    inkClipping,
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
const clippedInk = metrics.flatMap((item) => item.inkClipping.map((issue) => ({ sample: item.sample, ...issue })))
const invalidFrames = metrics.filter((item) => !item.headerFrameOk)
const lowContrast = metrics.filter((item) => (
  item.contrast.description < 3 ||
  item.contrast.price < 3 ||
  item.contrast.header < 3
))
const weakPriceCoverage = metrics.filter((item) => item.price && item.price.width < 35)
const transparentHeaders = metrics.filter((item) => (
  !item.contrast.headerBackground ||
  item.contrast.headerBackground === 'rgba(0, 0, 0, 0)' ||
  item.contrast.headerBackground === 'transparent'
))
const distinctHeaderSignatures = new Set(metrics.map((item) => item.headerSignature).filter(Boolean))
if (
  desktopErrors.length ||
  mobileErrors.length ||
  !fontState.descriptionReady ||
  !fontState.priceReady ||
  typographyWarnings.length ||
  clippedInk.length ||
  invalidFrames.length ||
  lowContrast.length ||
  weakPriceCoverage.length ||
  transparentHeaders.length ||
  distinctHeaderSignatures.size < 8
) {
  console.error(JSON.stringify({
    desktopErrors,
    mobileErrors,
    fontState,
    typographyWarnings,
    overflow,
    clippedInk,
    invalidFrames: invalidFrames.map((item) => ({ sample: item.sample, frame: item.frame })),
    lowContrast: lowContrast.map((item) => ({ sample: item.sample, contrast: item.contrast })),
    weakPriceCoverage: weakPriceCoverage.map((item) => ({ sample: item.sample, width: item.price?.width })),
    transparentHeaders: transparentHeaders.map((item) => ({ sample: item.sample, frame: item.frame })),
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
  // Somente texto realmente fora de uma área com recorte bloqueia o job.
  clippedInk,
  lowContrast: lowContrast.map((item) => item.sample),
  weakPriceCoverage: weakPriceCoverage.map((item) => item.sample),
  transparentHeaders: transparentHeaders.map((item) => item.sample),
  distinctHeaderSignatures: distinctHeaderSignatures.size,
  metrics,
}, null, 2))
