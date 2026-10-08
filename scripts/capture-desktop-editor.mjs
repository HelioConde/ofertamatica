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
