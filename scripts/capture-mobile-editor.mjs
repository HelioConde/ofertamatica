import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183'
const outDir = path.resolve('screenshots/mobile-editor')
await fs.mkdir(outDir, { recursive: true })

const formats = [
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
  'Mamão Formosa kg 4,99',
  'Abacaxi unidade 6,99',
  'Mexerica Murcot kg 7,99',
].join('\n')

const browser = await chromium.launch({ headless: true })
const results = []

async function collectBaseMetrics(page) {
  return page.evaluate(() => {
    const root = document.documentElement
    const body = document.body
    const width = window.innerWidth
    const scrollWidth = Math.max(root.scrollWidth, body?.scrollWidth || 0)
    const offenders = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const style = getComputedStyle(element)
        if (style.position === 'fixed' || style.position === 'absolute') return false
        const rect = element.getBoundingClientRect()
        return rect.width > 0 && (rect.left < -1 || rect.right > width + 1)
      })
      .slice(0, 10)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: String(element.className || '').slice(0, 120),
        left: Number(element.getBoundingClientRect().left.toFixed(1)),
        right: Number(element.getBoundingClientRect().right.toFixed(1)),
      }))

    return {
      width,
      scrollWidth,
      horizontalOverflow: scrollWidth > width + 1,
      offenders,
    }
  })
}

async function openEditor(formatId) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto(baseUrl + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    localStorage.removeItem('ofertamatica:draft:v1')
    localStorage.removeItem('ofertamatica:last-format')
  })
  await page.reload({ waitUntil: 'networkidle' })

  const choice = page.locator('[data-format-id="' + formatId + '"]')
  await choice.waitFor({ state: 'visible' })
  await choice.click()

  const textarea = page.locator('.quick-entry-card textarea')
  await textarea.waitFor({ state: 'visible' })
  await textarea.fill(sampleProducts)
  await textarea.press('Control+Enter')
  await page.locator('.product-row:not(.product-head)').first().waitFor({ state: 'visible' })

  return { page, errors }
}

for (const formatId of formats) {
  const { page, errors } = await openEditor(formatId)

  for (const tab of ['products', 'preview', 'style']) {
    await page.locator('[data-mobile-tab="' + tab + '"]').click()
    await page.waitForTimeout(120)

    const metrics = await collectBaseMetrics(page)

    if (tab === 'preview') {
      metrics.preview = await page.evaluate(() => {
        const card = document.querySelector('.preview-card.mobile-panel-active')
        const stage = document.querySelector('.preview-stage.real-poster-preview')
        const poster = document.querySelector('.real-poster-stage')
        const pager = document.querySelector('.preview-pager')
        const header = card?.querySelector(':scope > header')
        if (!card || !stage || !poster || !pager || !header) return null

        const cardRect = card.getBoundingClientRect()
        const stageRect = stage.getBoundingClientRect()
        const posterRect = poster.getBoundingClientRect()
        const pagerRect = pager.getBoundingClientRect()
        const headerRect = header.getBoundingClientRect()

        return {
          display: getComputedStyle(card).display,
          cardWidth: Number(cardRect.width.toFixed(1)),
          stageWidth: Number(stageRect.width.toFixed(1)),
          stageHeight: Number(stageRect.height.toFixed(1)),
          posterWidth: Number(posterRect.width.toFixed(1)),
          posterHeight: Number(posterRect.height.toFixed(1)),
          headerBeforeStage: headerRect.bottom <= stageRect.top + 1,
          pagerAfterStage: pagerRect.top >= stageRect.bottom - 1,
          stageUsesCardWidth: stageRect.width >= cardRect.width * 0.9,
          posterReadable: posterRect.width >= Math.min(240, cardRect.width * 0.68),
        }
      })
    }

    if (tab === 'style') {
      metrics.style = await page.evaluate(() => {
        const sidebar = document.querySelector('.style-sidebar.mobile-panel-active')
        const controls = [...document.querySelectorAll('.style-sidebar select, .style-sidebar input, .style-sidebar button')]
        const tooSmall = controls.filter((control) => {
          const rect = control.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0 && rect.height < 30
        }).slice(0, 8).map((control) => ({
          tag: control.tagName.toLowerCase(),
          className: String(control.className || '').slice(0, 100),
          height: Number(control.getBoundingClientRect().height.toFixed(1)),
        }))
        return {
          width: sidebar ? Number(sidebar.getBoundingClientRect().width.toFixed(1)) : 0,
          tooSmall,
        }
      })
    }

    await page.screenshot({
      path: path.join(outDir, formatId.toLowerCase().replaceAll('_', '-') + '-' + tab + '.png'),
      fullPage: true,
    })

    results.push({ formatId, tab, errors: [...errors], ...metrics })
  }

  await page.close()
}

await browser.close()

const failures = results.filter((item) => {
  if (item.errors.length || item.horizontalOverflow || item.offenders.length) return true
  if (item.tab === 'preview' && item.preview) {
    return item.preview.display !== 'grid'
      || !item.preview.headerBeforeStage
      || !item.preview.pagerAfterStage
      || !item.preview.stageUsesCardWidth
      || !item.preview.posterReadable
  }
  return false
})

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
  status: 'mobile editor QA passed',
}, null, 2))
