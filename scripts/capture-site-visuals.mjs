import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { PUBLIC_PAGES, SEO_PAGES } from '../src/seo/seoPages.js'

const baseUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183'
const outDir = path.resolve('screenshots/site')
await fs.mkdir(outDir, { recursive: true })

// Full mobile coverage: root + every public, institutional and SEO route.
const allRoutes = [
  ['home', '/'],
  ...PUBLIC_PAGES.map((page) => [page.slug, '/' + page.slug + '/']),
  ...SEO_PAGES.map((page) => [page.slug, '/' + page.slug + '/']),
]

const desktopRoutes = allRoutes.filter(([id]) => (
  ['home', 'modelos', 'formatos', 'como-funciona', 'guias-para-varejo'].includes(id)
))

const browser = await chromium.launch({ headless: true })
const state = []

async function captureViewport(name, viewport, routes) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  if (name === 'desktop-760-draft') {
    // Reproduz a home do usuário com o banner "Continuar último trabalho" visível.
    await page.addInitScript(() => {
      localStorage.setItem('ofertamatica:draft:v1', JSON.stringify({
        formatId: 'A3',
        sourceText: 'Café 500g 9,99',
        products: [
          { id: 'qa-1', description: 'CAFÉ 500G', price: '9,99' },
          { id: 'qa-2', description: 'ARROZ 5KG', price: '19,90' },
          { id: 'qa-3', description: 'LEITE 1L', price: '4,99' },
          { id: 'qa-4', description: 'FEIJÃO 1KG', price: '7,99' },
        ],
        savedAt: Date.now(),
      }))
    })
  }

  for (const [id, route] of routes) {
    const errors = []
    const ignoredErrors = []
    page.removeAllListeners('pageerror')
    page.on('pageerror', (error) => {
      const message = String(error?.message || error || '')
      // AdSense/Google scripts can throw this protobuf conversion error without breaking the page.
      if (/^int64$/i.test(message.trim())) {
        ignoredErrors.push(message)
      } else {
        errors.push(message)
      }
    })

    await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded' })
    await page.locator('#root').waitFor({ state: 'visible', timeout: 10_000 })
    await page.waitForTimeout(300)

    const metrics = await page.evaluate(() => {
      const root = document.documentElement
      const body = document.body
      const horizontalOverflow = Math.max(root.scrollWidth, body?.scrollWidth || 0) > window.innerWidth + 1
      const visibleOverflow = [...document.querySelectorAll('body *')]
        .filter((element) => {
          const style = getComputedStyle(element)
          if (style.position === 'fixed' || style.position === 'absolute') return false

          let parent = element.parentElement
          while (parent && parent !== document.body) {
            const parentStyle = getComputedStyle(parent)
            if (parentStyle.overflowX === 'auto' || parentStyle.overflowX === 'scroll') return false
            parent = parent.parentElement
          }

          const rect = element.getBoundingClientRect()
          return rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1)
        })
        .slice(0, 8)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          className: String(element.className || '').slice(0, 120),
          left: Number(element.getBoundingClientRect().left.toFixed(1)),
          right: Number(element.getBoundingClientRect().right.toFixed(1)),
        }))

      const navClipped = [...document.querySelectorAll('.main-nav .nav-link')].some((link) => {
        const rect = link.getBoundingClientRect()
        return rect.left < -1 || rect.right > window.innerWidth + 1
      })

      const ads = [...document.querySelectorAll('.oferta-ad-unit, .format-ad-card')]
        .filter((element) => {
          const rect = element.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        })
        .map((element) => {
          const rect = element.getBoundingClientRect()
          return {
            className: String(element.className || ''),
            width: Number(rect.width.toFixed(1)),
            height: Number(rect.height.toFixed(1)),
          }
        })

      const tinyTargets = [...document.querySelectorAll('button, a, input, select, summary')]
        .filter((element) => {
          const style = getComputedStyle(element)
          if (style.display === 'none' || style.visibility === 'hidden') return false
          const rect = element.getBoundingClientRect()
          if (rect.width <= 0 || rect.height <= 0) return false
          if (element.closest('.poster-card, .model-poster-standard, .format-diagram')) return false
          return rect.height < 28
        })
        .slice(0, 12)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          className: String(element.className || '').slice(0, 100),
          text: String(element.textContent || element.getAttribute('aria-label') || '').trim().slice(0, 60),
          height: Number(element.getBoundingClientRect().height.toFixed(1)),
        }))

      const formatRect = (selector) => {
        const element = document.querySelector(selector)
        if (!element) return null
        const rect = element.getBoundingClientRect()
        return {
          top: Number(rect.top.toFixed(1)),
          bottom: Number(rect.bottom.toFixed(1)),
          width: Number(rect.width.toFixed(1)),
          height: Number(rect.height.toFixed(1)),
        }
      }

      const formatCards = [...document.querySelectorAll('.format-home-refresh .format-choice')]
      const clippedFormatCards = formatCards.flatMap((card) => {
        const bounds = card.getBoundingClientRect()
        const action = card.querySelector('.format-card-action')?.getBoundingClientRect()
        return action && (action.bottom > bounds.bottom - 3 || action.top < bounds.top + 3)
          ? [card.getAttribute('data-format-id')]
          : []
      })
      const formatCardRects = formatCards.map((card) => card.getBoundingClientRect())
      const formatCardsOverlap = formatCardRects.some((card, index) =>
        formatCardRects.slice(index + 1).some((other) =>
          Math.min(card.right, other.right) - Math.max(card.left, other.left) > 3 &&
          Math.min(card.bottom, other.bottom) - Math.max(card.top, other.top) > 3
        )
      )
      const adRect = document.querySelector('.format-home-refresh .format-ad-card')?.getBoundingClientRect()
      const linksRect = document.querySelector('.format-home-refresh .format-trust-links')?.getBoundingClientRect()
      const lastCardBottom = formatCardRects.length ? Math.max(...formatCardRects.map((rect) => rect.bottom)) : null
      const adOverlapsFormats = Boolean(adRect && lastCardBottom && adRect.top < lastCardBottom - 2)
      const linksOverlapAd = Boolean(adRect && linksRect && linksRect.top < adRect.bottom - 2)
      const appThumb = document.querySelector('.format-choice[data-format-id="A4X2_APP"] .format-thumb')
      const appSheets = document.querySelectorAll('.format-choice[data-format-id="A4X2_APP"] .oferta-format-mini')
      const appThumbRect = appThumb?.getBoundingClientRect()
      const appPreviewClipped = Boolean(appThumbRect && [...appSheets].some((sheet) => {
        const rect = sheet.getBoundingClientRect()
        return rect.left < appThumbRect.left - 2 || rect.right > appThumbRect.right + 2 ||
          rect.top < appThumbRect.top - 2 || rect.bottom > appThumbRect.bottom + 2
      }))

      return {
        appPreviewClipped,
        clippedFormatCards,
        formatCardsOverlap,
        adOverlapsFormats,
        linksOverlapAd,
        visibleFormatCards: formatCards.length,
        hasSavedDraft: Boolean(document.querySelector('.resume-work')),
        title: document.title,
        width: window.innerWidth,
        height: window.innerHeight,
        scrollWidth: Math.max(root.scrollWidth, body?.scrollWidth || 0),
        documentHeight: Math.max(root.scrollHeight, body?.scrollHeight || 0),
        horizontalOverflow,
        visibleOverflow,
        navClipped,
        tinyTargets,
        ads,
        creatorGeometry: {
          page: formatRect('.format-page'),
          dialog: formatRect('.format-dialog'),
          header: formatRect('.format-dialog-head'),
          grid: formatRect('.format-grid'),
          ad: formatRect('.format-ad-card'),
          links: formatRect('.format-trust-links'),
        },
      }
    })

    await page.screenshot({
      path: path.join(outDir, id + '-' + name + '.png'),
      fullPage: true,
    })

    state.push({ route, id, viewport: name, errors, ignoredErrors, ...metrics })
  }

  await page.close()
}

await captureViewport('desktop', { width: 1440, height: 1000 }, desktopRoutes)
await captureViewport('desktop-760-draft', { width: 1600, height: 760 }, [['home', '/']])
await captureViewport('mobile-360', { width: 360, height: 800 }, allRoutes)
await captureViewport('mobile-412', { width: 412, height: 915 }, allRoutes)

await browser.close()

await fs.writeFile(
  path.join(outDir, 'visual-state.json'),
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || null,
    routes: allRoutes,
    pages: state,
  }, null, 2),
)

const failures = state.filter((item) => {
  if (item.errors.length || item.horizontalOverflow) return true
  if (item.id === 'home') {
    if (item.visibleFormatCards !== 8 || item.clippedFormatCards.length ||
        item.formatCardsOverlap || item.adOverlapsFormats || item.linksOverlapAd ||
        item.appPreviewClipped) return true
    if (item.viewport === 'desktop-760-draft' && !item.hasSavedDraft) return true
    if (item.viewport.startsWith('desktop') && item.documentHeight > item.height + 4) return true
  }
  if (item.viewport === 'desktop' && item.ads.some((ad) => ad.className.includes('is-pending') && ad.height > 180)) return true
  if (!item.viewport.startsWith('mobile')) return false
  if (item.navClipped) return true
  if (item.tinyTargets.length) return true
  return item.ads.some((ad) => ad.height > 130)
})

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  captures: state.length,
  mobilePages: allRoutes.length,
  desktopPages: desktopRoutes.length,
  pages: allRoutes.map(([id]) => id),
}, null, 2))
