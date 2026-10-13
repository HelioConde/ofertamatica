import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Auditoria visual da interface já hidratada — não mede o skeleton do React.
 * Analisa acessibilidade básica, responsividade e navegação real por teclado.
 * Os achados não são uma certificação WCAG nem substituem prova de impressão.
 */
const base = (process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183').replace(/\/$/, '')
const outDir = path.resolve('artifacts/design-audit')
const routes = [
  { path: '/', slug: 'home', ready: '.format-home-chooser .format-grid .format-choice' },
  { path: '/modelos/', slug: 'modelos', ready: '.model-showcase-grid .model-showcase-card' },
  { path: '/formatos/', slug: 'formatos', ready: '.seo-landing h1' },
  { path: '/como-funciona/', slug: 'como-funciona', ready: '.seo-landing h1' },
  { path: '/editor-livre/', slug: 'editor-livre', ready: '.free-poster-editor h1' },
]
const viewports = [
  { label: 'mobile-360', width: 360, height: 800 },
  { label: 'mobile-390', width: 390, height: 844 },
  { label: 'tablet-768', width: 768, height: 1024 },
  { label: 'desktop-1440', width: 1440, height: 900 },
]
const findings = []
const critical = []
await fs.mkdir(outDir, { recursive: true })
const browser = await chromium.launch({ headless: true })

async function inspect(page) {
  return page.evaluate(() => {
    const main = document.querySelector('main')
    const isVisible = (el) => {
      if (el.closest('[hidden], [inert], [aria-hidden="true"]')) return false
      const style = getComputedStyle(el)
      const box = el.getBoundingClientRect()
      return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }
    const candidates = [...document.querySelectorAll('button, a[href], input:not([type="hidden"]), select, textarea, summary')]
    const visible = candidates.filter(isVisible)
    const noAccessibleName = visible
      .filter((el) => {
        if (el.getAttribute('aria-label')?.trim()) return false
        const labels = el.getAttribute('aria-labelledby')
        if (labels?.split(/\s+/).some(id => document.getElementById(id)?.textContent?.trim())) return false
        if (el.getAttribute('title')?.trim()) return false
        if (el.labels && [...el.labels].some(label => label.textContent?.trim())) return false
        if (el.innerText?.trim() || el.textContent?.trim()) return false
        if (el.value?.trim() || el.getAttribute('alt')?.trim()) return false
        if (el.querySelector('img[alt]:not([alt=""])')) return false
        return true
      })
      .slice(0, 12)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        className: String(el.className).slice(0, 70),
        html: el.outerHTML.slice(0, 200),
      }))
    const tinyTouchTargets = visible
      .filter((el) => el.matches('button, a[href], summary'))
      .filter((el) => {
        if (el.closest('.poster-card, .model-poster-standard, .format-diagram')) return false
        const box = el.getBoundingClientRect()
        return box.width < 24 || box.height < 24
      })
      .slice(0, 16)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        width: Math.round(el.getBoundingClientRect().width),
        height: Math.round(el.getBoundingClientRect().height),
        html: el.outerHTML.slice(0, 180),
      }))
    const navClipped = [...document.querySelectorAll('.main-nav .nav-link')].some((link) => {
      const box = link.getBoundingClientRect()
      return box.left < -2 || box.right > innerWidth + 2
    })
    return {
      title: document.title,
      heading: main?.querySelector('h1')?.innerText?.trim() || '',
      h1Count: main?.querySelectorAll('h1').length || 0,
      isLoading: Boolean(main?.matches('.public-route-loading, [aria-busy="true"]')),
      horizontalOverflowPx: Math.max(0, Math.ceil(Math.max(
        document.documentElement.scrollWidth, document.body.scrollWidth
      ) - innerWidth)),
      navClipped,
      interactiveCount: visible.length,
      missingAccessibleNames: noAccessibleName,
      tinyTouchTargets,
    }
  })
}
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    try {
      for (const route of routes) {
        const jsErrors = []
        page.removeAllListeners('pageerror')
        page.on('pageerror', error => {
          const msg = String(error.message || error)
          if (!/^int64$/i.test(msg.trim())) jsErrors.push(msg)
        })
        try {
          const response = await page.goto(base + route.path, { waitUntil: 'domcontentloaded' })
          if (!response || response.status() >= 400) throw new Error('HTTP ' + response?.status())

          // O React usa import() e Suspense nas rotas públicas. Um <main> presente
          // não significa que a página carregou. Exigir um elemento definitivo.
          await page.locator(route.ready).first().waitFor({ state: 'visible', timeout: 20000 })
          await page.waitForFunction(() => {
            const main = document.querySelector('main')
            return Boolean(main && !main.matches('.public-route-loading, [aria-busy="true"]')
              && main.querySelector('h1')?.textContent?.trim())
          }, null, { timeout: 20000 })
          await page.evaluate(async () => {
            await document.fonts.ready
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
          })
          const result = await inspect(page)
          findings.push({ route: route.path, viewport: viewport.label, ...result, jsErrors })
          console.log(`[design] ${viewport.label} ${route.path}: h1=${result.h1Count}, controles=${result.interactiveCount}, overflow=${result.horizontalOverflowPx}px, sem nome=${result.missingAccessibleNames.length}, alvos pequenos=${result.tinyTouchTargets.length}`)
          if (result.isLoading || result.h1Count !== 1) {
            critical.push({ route: route.path, viewport: viewport.label, reason: 'Conteúdo não hidratado ou h1 incorreto' })
          }
          if (result.horizontalOverflowPx > 8 || result.navClipped) {
            critical.push({ route: route.path, viewport: viewport.label, reason: 'Overflow ou navegação cortada', details: { overflowPx: result.horizontalOverflowPx, navClipped: result.navClipped } })
          }
          if (jsErrors.length) {
            critical.push({ route: route.path, viewport: viewport.label, reason: 'Erro JavaScript', details: jsErrors.slice(0, 3) })
          }
          if (viewport.label === 'mobile-390' || viewport.label === 'desktop-1440') {
            await page.screenshot({ path: path.join(outDir, `${route.slug}-${viewport.label}.png`), fullPage: false })
          }
          if (route.path === '/') {
            // Testa a partir do início do tab-order do navegador real.
            await page.keyboard.press('Tab')
            const skip = await page.evaluate(() => {
              const active = document.activeElement
              const style = active && getComputedStyle(active)
              return {
                isSkip: active?.classList.contains('skip-to-content') === true,
                hasVisibleOutline: style?.outlineStyle !== 'none' && Number.parseFloat(style?.outlineWidth) > 0,
              }
            })
            if (!skip.isSkip || !skip.hasVisibleOutline) {
              critical.push({ route: route.path, viewport: viewport.label, reason: 'Atalho de teclado sem foco e contorno visível' })
            } else {
              if (viewport.label === 'mobile-390' || viewport.label === 'desktop-1440') {
                await page.screenshot({ path: path.join(outDir, `home-focus-${viewport.label}.png`), fullPage: false })
              }
              await page.keyboard.press('Enter')
              const target = await page.evaluate(() => ({
                hash: location.hash,
                focusedMain: document.activeElement?.id === 'formatos',
              }))
              if (target.hash !== '#formatos' || !target.focusedMain) {
                critical.push({ route: route.path, viewport: viewport.label, reason: 'Atalho não moveu foco ao conteúdo' })
              }
            }
          }
        } catch (error) {
          critical.push({ route: route.path, viewport: viewport.label, reason: String(error.message || error) })
          console.error(`[design] FALHOU ${viewport.label} ${route.path}: ${error.message}`)
        }
      }
    } finally {
      await page.close()
    }
  }
} finally {
  await browser.close()
}
const report = {
  generatedAt: new Date().toISOString(),
  methodology: 'React hydration gate + Web Interface Guidelines + keyboard focus + responsive screenshots',
  notes: 'Resultados são verificações automatizadas iniciais, não pontuação visual ou certificação WCAG.',
  findings,
  critical,
}
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n')
console.log(`[design] ${findings.length}/${viewports.length * routes.length} páginas prontas auditadas; ${critical.length} falhas críticas.`)
if (critical.length) {
  console.error(JSON.stringify(critical, null, 2))
  process.exitCode = 1
}
