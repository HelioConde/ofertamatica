import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { INDEXABLE_PAGES } from '../src/seo/seoPages.js'

// Auditoria WCAG 2.2 de todas as páginas públicas. A ferramenta identifica uma
// parte dos problemas; decisões sobre contraste da arte impressa e leitores de
// tela exigem também revisão humana.
const base = (process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183').replace(/\/$/, '')
const outDir = path.resolve('artifacts/design-audit')
const core = new Set(['/', '/modelos/', '/formatos/', '/editor-livre/', '/placas-sazonais/', '/cartaz-black-friday/', '/validade-zero/', '/conheca-validade-zero/'])
const routes = [
  { path: '/', ready: '.format-home-chooser .format-grid .format-choice' },
  ...INDEXABLE_PAGES.map(({ slug }) => ({
    path: '/' + slug + '/',
    ready: slug === 'modelos' ? '.model-showcase-grid .model-showcase-card'
      : slug === 'editor-livre' ? '.free-poster-editor h1'
        : slug === 'conheca-validade-zero' ? '.validade-zero-hero-actions .validade-zero-open'
          : '.seo-landing h1',
  })),
  { path: '/validade-zero/', ready: '.heading h1' },
]
const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1440', width: 1440, height: 900 },
]
const results = []
const failures = []
const browser = await chromium.launch({ headless: true })
await fs.mkdir(outDir, { recursive: true })
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    try {
      for (const route of routes) {
        // Todo o conteúdo público no celular; desktop nas telas de trabalho
        // e nas páginas com experiência visual especializada.
        if (viewport.name === 'desktop-1440' && !core.has(route.path)) continue
        const page = await context.newPage()
        try {
          const response = await page.goto(base + route.path, { waitUntil: 'domcontentloaded' })
          if (!response || response.status() >= 400) throw new Error('HTTP ' + response?.status())
          await page.locator(route.ready).first().waitFor({ state: 'visible', timeout: 20000 })
          await page.evaluate(() => document.fonts.ready)
          const evaluation = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze()
          const violations = evaluation.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            help: violation.help,
            helpUrl: violation.helpUrl,
            nodes: violation.nodes.slice(0, 8).map((node) => ({
              target: node.target,
              failureSummary: node.failureSummary,
            })),
            count: violation.nodes.length,
          }))
          const entry = {
            route: route.path,
            viewport: viewport.name,
            violations,
            incompleteRules: evaluation.incomplete.map((item) => item.id),
          }
          results.push(entry)
          console.log(`[a11y] ${viewport.name} ${route.path}: ${violations.length} regras, ${violations.filter((item) => item.impact === 'serious' || item.impact === 'critical').length} graves`)
          // Tornar os alertas graves acionáveis também no log, não só no ZIP.
          for (const violation of violations.filter((item) => item.impact === 'serious' || item.impact === 'critical')) {
            const samples = violation.nodes.slice(0, 3).map((node) => node.target.join(' ') + ': ' + (node.failureSummary || '').replace(/\\s+/g, ' ').slice(0, 180))
            console.warn('[a11y-detail] ' + viewport.name + ' ' + route.path + ' ' + violation.id + '/' + violation.impact + ': ' + violation.count + ' elementos; ' + samples.join(' | '))
          }
          for (const violation of violations.filter((item) => item.impact === 'critical')) {
            failures.push({ route: route.path, viewport: viewport.name, rule: violation.id, impact: violation.impact, nodes: violation.nodes.slice(0, 3) })
          }
        } catch (error) {
          failures.push({ route: route.path, viewport: viewport.name, error: String(error.message || error) })
          console.error(`[a11y] FALHOU ${viewport.name} ${route.path}: ${error.message}`)
        } finally {
          await page.close()
        }
      }
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
const summary = {
  generatedAt: new Date().toISOString(),
  routeCount: routes.length,
  checkedPages: results.length,
  coreDesktopPaths: [...core],
  criticalRuleOccurrences: results.flatMap((entry) => entry.violations.filter((violation) => violation.impact === 'critical')).length,
  seriousRuleOccurrences: results.flatMap((entry) => entry.violations.filter((violation) => violation.impact === 'serious')).length,
  methodology: 'Playwright Chromium + axe WCAG 2.0/2.1/2.2 A/AA, rendered pages after hydration; incomplete rules need manual review',
  findings: results,
  blockingFailures: failures,
}
await fs.writeFile(path.join(outDir, 'sitewide-accessibility.json'), JSON.stringify(summary, null, 2) + '\n')
console.log(`[a11y] ${summary.checkedPages} páginas/viewport verificadas; ${summary.criticalRuleOccurrences} violações críticas e ${summary.seriousRuleOccurrences} graves para triagem.`)
if (process.env.GITHUB_STEP_SUMMARY) {
  await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,
    `\n### Acessibilidade de todas as rotas\n\n- ${summary.checkedPages} páginas/viewport avaliadas com axe WCAG A/AA.\n- ${summary.criticalRuleOccurrences} ocorrências de regras críticas; ${summary.seriousRuleOccurrences} graves.\n- Relatório completo: artifact \`sitewide-accessibility.json\`; violações graves não são automaticamente classificadas como regressões.\n`)
}
if (failures.length) {
  console.error(JSON.stringify(failures.slice(0, 30), null, 2))
  process.exitCode = 1
}
