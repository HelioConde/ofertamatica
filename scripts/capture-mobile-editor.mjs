import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183'
const outDir = path.resolve('screenshots/mobile-editor')
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
  'Mamão Formosa kg 4,99',
  'Abacaxi unidade 6,99',
  'Mexerica Murcot kg 7,99',
].join('\n')

const viewports = [
  ['mobile-360', { width: 360, height: 800 }],
  ['mobile-390', { width: 390, height: 844 }],
  ['mobile-412', { width: 412, height: 915 }],
]

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

async function openEditor(formatId, viewport) {
  const page = await browser.newPage({
    viewport,
    deviceScaleFactor: 1,
  })
  const errors = []
  page.on('pageerror', (error) => {
    const message = String(error?.message || error || '')
    if (message === 'int64') return
    errors.push(message)
  })

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

for (const [viewportName, viewport] of viewports) {
  for (const formatId of formats) {
    const { page, errors } = await openEditor(formatId, viewport)

    for (const tab of ['products', 'preview', 'style']) {
      await page.locator('[data-mobile-tab="' + tab + '"]').click()
      await page.waitForTimeout(120)

      const metrics = await collectBaseMetrics(page)

      if (tab === 'products') {
        metrics.products = await page.evaluate(() => {
          const row = document.querySelector('.product-row:not(.product-head)')
          const fields = row ? [...row.querySelectorAll('.product-field')] : []
          const rect = row?.getBoundingClientRect()
          return {
            rowHeight: rect ? Number(rect.height.toFixed(1)) : 0,
            fieldCount: fields.length,
          }
        })
      }

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
            posterReadable: posterRect.width >= Math.min(220, cardRect.width * 0.64),
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
          const headerArt = document.querySelector('.header-art-grid')
          const frames = document.querySelector('.poster-frame-style-grid')
          const ribbon = document.querySelector('.ofertamatica-offer-ribbon, .ofertamatica-app-ribbon')
          const ribbonStyle = ribbon ? getComputedStyle(ribbon) : null
          return {
            width: sidebar ? Number(sidebar.getBoundingClientRect().width.toFixed(1)) : 0,
            sidebarTabCount: document.querySelectorAll('.style-sidebar .personalization-tabs > button').length,
            activeArea: document.querySelector('.style-sidebar .personalization-tabs button.active')?.textContent || '',
            headerArtHeight: headerArt ? Number(headerArt.getBoundingClientRect().height.toFixed(1)) : 0,
            frameGridHeight: frames ? Number(frames.getBoundingClientRect().height.toFixed(1)) : 0,
            headerBackgroundColor: ribbonStyle?.backgroundColor || '',
            headerTextColor: ribbonStyle?.color || '',
            headerVisible: Boolean(ribbon && ribbonStyle && ribbonStyle.display !== 'none'),
            tooSmall,
          }
        })
      }

      await page.screenshot({
        path: path.join(
          outDir,
          formatId.toLowerCase().replaceAll('_', '-') + '-' + viewportName + '-' + tab + '.png',
        ),
        fullPage: true,
      })

      results.push({ viewport: viewportName, formatId, tab, errors: [...errors], ...metrics })

      if (viewportName === 'mobile-390' && formatId === 'A4' && tab === 'style') {
        // Três áreas funcionais e únicas: sem duplicação de biblioteca de molduras.
        await page.locator('[data-style-tab="offer"]').click()
        await page.locator('.personalization-panel:not([hidden]) .offer-mode-select-row select').waitFor({ state: 'visible' })
        await page.locator('[data-style-tab="settings"]').click()
        await page.locator('.personalization-panel:not([hidden]) .style-accordion').first().waitFor({ state: 'visible' })
        await page.locator('[data-style-tab="art"]').click()
        await page.locator('.header-art-grid [data-model-art]').first().waitFor({ state: 'visible' })

        const themeModels = [
          { id: 'classic', label: 'Clássico de oferta' },
          { id: 'relampago', label: 'Oferta relâmpago' },
          { id: 'hortifruti', label: 'Hortifruti' },
          { id: 'acougue', label: 'Açougue' },
          { id: 'adega', label: 'Adega' },
          { id: 'clube', label: 'Clube de ofertas' },
          { id: 'black-friday', label: 'Black Friday' },
          { id: 'premium', label: 'Premium' },
        ]

        for (const theme of themeModels) {
          const search = page.locator('.header-search input[type="search"]')
          await search.fill(theme.label)
          const modelCard = page.locator('[data-model-art="' + theme.id + '"]')
          await modelCard.waitFor({ state: 'visible', timeout: 5000 })
          await modelCard.click()
          await page.locator('[data-mobile-tab="preview"]').click()
          await page.waitForTimeout(100)

          const contrast = await page.evaluate(() => {
            const poster = document.querySelector('.poster-card-layers, .poster-app-card')
            const description = document.querySelector('.poster-field-description')
            const price = document.querySelector('.poster-price-value')
            const header = document.querySelector('.ofertamatica-offer-ribbon, .ofertamatica-app-ribbon')

            const backgroundColor = poster ? getComputedStyle(poster).backgroundColor : ''
            const descriptionColor = description ? getComputedStyle(description).color : ''
            const priceColor = price ? getComputedStyle(price).color : ''
            const headerBackgroundColor = header ? getComputedStyle(header).backgroundColor : ''
            const headerTextColor = header ? getComputedStyle(header).color : ''

            function rgb(value) {
              const values = String(value || '').match(/\d+(?:\.\d+)?/g)
              if (!values || values.length < 3) return null
              return values.slice(0, 3).map(Number)
            }

            function channel(value) {
              const normalized = value / 255
              return normalized <= 0.03928
                ? normalized / 12.92
                : ((normalized + 0.055) / 1.055) ** 2.4
            }

            function luminance(value) {
              const color = rgb(value)
              if (!color) return null
              return (0.2126 * channel(color[0]))
                + (0.7152 * channel(color[1]))
                + (0.0722 * channel(color[2]))
            }

            function ratio(background, foreground) {
              const a = luminance(background)
              const b = luminance(foreground)
              if (a === null || b === null) return 0
              const lighter = Math.max(a, b)
              const darker = Math.min(a, b)
              return (lighter + 0.05) / (darker + 0.05)
            }

            return {
              backgroundColor,
              descriptionColor,
              priceColor,
              headerBackgroundColor,
              headerTextColor,
              descriptionContrast: Number(ratio(backgroundColor, descriptionColor).toFixed(2)),
              priceContrast: Number(ratio(backgroundColor, priceColor).toFixed(2)),
              headerContrast: Number(ratio(headerBackgroundColor, headerTextColor).toFixed(2)),
            }
          })

          await page.screenshot({
            path: path.join(outDir, 'theme-' + theme.id + '-a4-mobile-390.png'),
            fullPage: true,
          })

          results.push({
            viewport: viewportName,
            formatId,
            tab: 'theme-contrast',
            themeId: theme.id,
            errors: [...errors],
            horizontalOverflow: false,
            offenders: [],
            contrast,
          })

          await page.locator('[data-mobile-tab="style"]').click()
          await page.waitForTimeout(70)
        }
      }
    }

    await page.close()
  }
}
await browser.close()

const failures = results.filter((item) => {
  if (item.errors.length || item.horizontalOverflow) return true
  if (item.tab === 'products' && item.products?.rowHeight > 390) return true
  if (item.tab === 'style' && item.style) {
    if (item.style.sidebarTabCount !== 3 || item.style.activeArea !== 'Artes') return true
    if (item.style.headerArtHeight > 310 || item.style.frameGridHeight > 240) return true
    if (!item.style.headerVisible) return true
    if (!item.style.headerBackgroundColor || item.style.headerBackgroundColor === 'rgba(0, 0, 0, 0)' || item.style.headerBackgroundColor === 'transparent') return true
  }
  if (item.tab === 'preview' && item.preview) {
    return item.preview.display !== 'grid'
      || !item.preview.headerBeforeStage
      || !item.preview.pagerAfterStage
      || !item.preview.stageUsesCardWidth
      || !item.preview.posterReadable
  }
  if (item.tab === 'theme-contrast' && item.contrast) {
    if (item.contrast.descriptionContrast < 3) return true
    if (item.contrast.priceContrast < 3) return true
    if (item.contrast.headerContrast < 3) return true
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
  viewports: viewports.map(([name]) => name),
  captures: results.length,
  status: 'mobile editor QA passed',
}, null, 2))
