import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183'
const outDir = path.resolve('screenshots/desktop-editor')
await fs.mkdir(outDir, { recursive: true })

const formats = [
  'A4X8',
  'A4X4',
  'A4X2_CIMA_BAIXO',
  'A4X2_INVERTIDO',
  'A4X2_APP',
  'A4',
  'A5',
  'A3',
]

const sampleProducts = [
  'Cerveja Heineken Long Neck 300ml 5,99',
  'Pão Francês kg 10,90',
  'Biscoito de queijo kg 20,90',
  'Mamão Formosa kg 4,99',
].join('\n')

const browser = await chromium.launch({ headless: true })
const results = []

for (const formatId of formats) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })

  const errors = []
  page.on('pageerror', (error) => {
    const message = String(error?.message || error || '')
    if (/^int64$/i.test(message.trim())) return
    errors.push(message)
  })

  await page.goto(baseUrl + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    localStorage.removeItem('ofertamatica:draft:v1')
    localStorage.removeItem('ofertamatica:last-format')
  })
  await page.reload({ waitUntil: 'networkidle' })

  await page.locator('[data-format-id="' + formatId + '"]').click()
  const textarea = page.locator('.quick-entry-card textarea')
  await textarea.waitFor({ state: 'visible' })
  await textarea.fill(sampleProducts)
  await textarea.press('Control+Enter')
  await page.locator('.product-row:not(.product-head)').first().waitFor({ state: 'visible' })
  await page.waitForTimeout(180)

  const metrics = await page.evaluate(() => {
    const root = document.documentElement
    const body = document.body
    const layout = document.querySelector('.editor-layout')
    const editorMain = document.querySelector('.editor-main')
    const preview = document.querySelector('.preview-card')
    const style = document.querySelector('.style-sidebar')
    const poster = document.querySelector('.real-poster-stage')
    const firstRow = document.querySelector('.product-row:not(.product-head)')
    const rowInputs = [...(firstRow?.querySelectorAll('input') || [])]
    const rowBounds = firstRow?.getBoundingClientRect()
    const clippedInputs = rowInputs.some((input) => {
      const bounds = input.getBoundingClientRect()
      return !rowBounds || bounds.width < 40 || bounds.left < rowBounds.left - 2 || bounds.right > rowBounds.right + 2
    })
    const hasReadableShortList = Boolean(
      document.querySelector('.interpreted.is-short-list') &&
      rowBounds && rowBounds.height >= 52 &&
      rowInputs.every((input) => input.getBoundingClientRect().height >= 35)
    )

    const rect = (element) => {
      if (!element) return null
      const box = element.getBoundingClientRect()
      return {
        left: Number(box.left.toFixed(1)),
        top: Number(box.top.toFixed(1)),
        width: Number(box.width.toFixed(1)),
        height: Number(box.height.toFixed(1)),
        right: Number(box.right.toFixed(1)),
        bottom: Number(box.bottom.toFixed(1)),
      }
    }

    const width = window.innerWidth
    const height = window.innerHeight
    const scrollWidth = Math.max(root.scrollWidth, body?.scrollWidth || 0)
    const scrollHeight = Math.max(root.scrollHeight, body?.scrollHeight || 0)

    return {
      width,
      height,
      scrollWidth,
      scrollHeight,
      horizontalOverflow: scrollWidth > width + 1,
      verticalOverflow: scrollHeight > height + 4,
      layout: rect(layout),
      editorMain: rect(editorMain),
      preview: rect(preview),
      style: rect(style),
      poster: rect(poster),
      firstRow: rect(firstRow),
      clippedInputs,
      hasReadableShortList,
      rowInputCount: rowInputs.length,
    }
  })

  await page.screenshot({
    path: path.join(outDir, formatId.toLowerCase().replaceAll('_', '-') + '.png'),
    fullPage: true,
  })

  results.push({ formatId, errors, ...metrics })
  await page.close()
}

// Regression: upload a valid PNG >1 MB. Client optimization must keep the
// custom header and store logo usable without exceeding localStorage capacity.
const uploadPage = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})
await uploadPage.goto(baseUrl + '/', { waitUntil: 'networkidle' })
await uploadPage.locator('[data-format-id="A4"]').click()
await uploadPage.locator('[data-style-tab="art"]').click()

const pngBase64 = await uploadPage.evaluate(() => {
  const canvas = document.createElement('canvas')
  canvas.width = 1500
  canvas.height = 520
  const context = canvas.getContext('2d')
  const pixels = context.createImageData(canvas.width, canvas.height)
  let seed = 20261008
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    pixels.data[i] = seed & 255
    pixels.data[i + 1] = (seed >>> 8) & 255
    pixels.data[i + 2] = (seed >>> 16) & 255
    pixels.data[i + 3] = 255
  }
  context.putImageData(pixels, 0, 0)
  return canvas.toDataURL('image/png').split(',')[1]
})
const largeImageBuffer = Buffer.from(pngBase64, 'base64')
if (largeImageBuffer.length <= 1024 * 1024 || largeImageBuffer.length > 8 * 1024 * 1024) {
  throw new Error('The upload fixture is not a valid 1–8 MB PNG image.')
}

await uploadPage.locator('.header-library-section input[type="file"]').setInputFiles({
  name: 'qa-large-artwork.png',
  mimeType: 'image/png',
  buffer: largeImageBuffer,
})
await uploadPage.locator('.selected-header-preview.custom-header-preview').waitFor({ state: 'visible', timeout: 15000 })
const headerUploadResult = await uploadPage.evaluate(() => ({
  saved: localStorage.getItem('ofertamatica:custom-header:v1') || '',
  error: [...document.querySelectorAll('.header-library-section .store-logo-error')].map((item) => item.textContent).join(' '),
}))
if (!headerUploadResult.saved.startsWith('data:image/webp;') ||
    headerUploadResult.saved.length > 1200000 || headerUploadResult.error) {
  throw new Error('Large custom header was not optimized/stored correctly: ' + headerUploadResult.error)
}

await uploadPage.locator('[data-style-tab="settings"]').click()
await uploadPage.locator('.store-brand-section summary').click()
await uploadPage.locator('.store-brand-section input[type="file"]').setInputFiles({
  name: 'qa-large-logo.png',
  mimeType: 'image/png',
  buffer: largeImageBuffer,
})
await uploadPage.locator('.store-logo-preview').waitFor({ state: 'visible', timeout: 15000 })
const logoUploadResult = await uploadPage.evaluate(() => ({
  saved: localStorage.getItem('ofertamatica:store-logo:v1') || '',
  error: [...document.querySelectorAll('.store-brand-section .store-logo-error')].map((item) => item.textContent).join(' '),
}))
if (!logoUploadResult.saved.startsWith('data:image/webp;') ||
    logoUploadResult.saved.length > 1200000 || logoUploadResult.error) {
  throw new Error('Large store logo was not optimized/stored correctly: ' + logoUploadResult.error)
}
await uploadPage.close()

await browser.close()

const failures = results.filter((item) => (
  item.errors.length ||
  item.horizontalOverflow ||
  item.verticalOverflow ||
  !item.layout ||
  !item.editorMain ||
  !item.preview ||
  !item.style ||
  !item.poster ||
  item.preview.width < 340 ||
  item.style.width < 240 ||
  item.clippedInputs ||
  !item.hasReadableShortList ||
  item.rowInputCount < 5 ||
  item.poster.width < 180 ||
  item.layout.right > item.width + 1
))

await fs.writeFile(
  path.join(outDir, 'visual-state.json'),
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || null,
    results,
    failures,
  }, null, 2),
)

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  formats: formats.length,
  captures: results.length,
  status: 'desktop editor QA passed',
}, null, 2))
