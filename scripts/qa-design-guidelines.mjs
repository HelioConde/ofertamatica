import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Auditoria de design orientada por Web Interface Guidelines:
 * - coleta problemas úteis sem inventar uma pontuação de qualidade;
 * - confirma que o primeiro foco leva ao atalho de conteúdo;
 * - produz screenshots de foco e relatório para inspeção manual.
 *
 * Dependência Playwright é instalada no job CI ou no ambiente de desenvolvimento.
 */
const base = (process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183').replace(/\/$/, '')
const outDir = path.resolve('artifacts/design-audit')
const routes = ['/', '/modelos/', '/formatos/', '/como-funciona/', '/editor-livre/']
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
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    try {
      for (const route of routes) {
        const response = await page.goto(base + route, { waitUntil: 'domcontentloaded' })
        if (!response || response.status() >= 400) {
          critical.push({ route, viewport: viewport.label, reason: 'HTTP ' + response?.status() })
          continue
        }
        await page.locator('main').first().waitFor({ state: 'visible', timeout: 15000 })
        const result = await page.evaluate(() => {
          const candidates = [...document.querySelectorAll('button, a[href], input, select, textarea')]
          const isVisible = (el) => {
            const box = el.getBoundingClientRect()
            const style = getComputedStyle(el)
            return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
          }
          const visible = candidates.filter(isVisible)
          const noAccessibleName = visible
            .filter((el) => !el.getAttribute('aria-label')?.trim()
              && !el.getAttribute('aria-labelledby')
              && !el.getAttribute('title')?.trim()
              && !el.innerText?.trim()
              && !el.value?.trim()
              && !el.querySelector('img[alt]:not([alt=""])'))
            .slice(0, 12)
            .map((el) => ({
              tag: el.tagName.toLowerCase(),
              className: String(el.className).slice(0, 70),
            }))
          const tinyTouchTargets = visible
            .filter((el) => el.matches('button, a[href]'))
            .filter((el) => {
              const box = el.getBoundingClientRect()
              return box.width < 24 || box.height < 24
            })
            .length
          return {
            title: document.title,
            h1Count: document.querySelectorAll('main h1').length,
            horizontalOverflowPx: Math.max(0, Math.ceil(document.documentElement.scrollWidth - innerWidth)),
            interactiveCount: visible.length,
            missingAccessibleNames: noAccessibleName,
            tinyTouchTargetCount: tinyTouchTargets,
          }
        })
        const row = { route, viewport: viewport.label, ...result }
        findings.push(row)
        console.log(`[design] ${viewport.label} ${route}: overflow ${result.horizontalOverflowPx}px, ${result.missingAccessibleNames.length} controles sem nome, ${result.tinyTouchTargetCount} alvos <24px`)
        if (route === '/') {
          // Não clicar: validar a jornada de teclado como usuário real.
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
            critical.push({ route, viewport: viewport.label, reason: 'Atalho de teclado inicial sem foco/contorno visível' })
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
              critical.push({ route, viewport: viewport.label, reason: 'Pular para conteúdo não transferiu foco ao main' })
            }
          }
        }
      }
    } catch (error) {
      critical.push({ viewport: viewport.label, reason: String(error.message || error) })
    } finally {
      await page.close()
    }
  }
} finally {
  await browser.close()
}
const report = {
  generatedAt: new Date().toISOString(),
  methodology: 'Web Interface Guidelines + keyboard focus + responsive inspection',
  notes: 'Nomes e alvos são achados diagnósticos para revisão humana; não substituem auditoria WCAG nem testes de impressão.',
  findings,
  critical,
}
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n')
console.log(`[design] ${findings.length} combinações auditadas; ${critical.length} falhas críticas. Relatório: artifacts/design-audit/report.json`)
if (critical.length) {
  console.error(JSON.stringify(critical, null, 2))
  process.exitCode = 1
}
