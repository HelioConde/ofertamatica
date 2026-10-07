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

    await page.goto(baseUrl + route, { waitUntil: 'networkidle' })
    await page.waitForTimeout(450)

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

      return {
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
  if (item.id === 'home' && item.viewport === 'desktop' && item.documentHeight > item.height + 4) return true
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
