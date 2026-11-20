import { chromium } from 'playwright'

// UI Verify + accessibility: reproduz ações reais no Editor Livre.
// O cartaz impresso continua coberto pelo qa-release-print-import.mjs.
const base = (process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183').replace(/\/$/, '')
const browser = await chromium.launch({ headless: true })

function assert(condition, message) {
  if (!condition) throw new Error('[free-editor-ux] ' + message)
}
const near = (a, b) => Math.abs(a - b) < 0.06

try {
  for (const width of [360, 390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    try {
      const response = await page.goto(base + '/editor-livre/', { waitUntil: 'domcontentloaded' })
      assert(response && response.status() < 400, 'HTTP incorreto no editor')
      await page.locator('.free-editor-box-control .free-editor-number-grid').waitFor({ state: 'visible', timeout: 20000 })

      const fontAndTargets = await page.evaluate(() => {
        const editInputs = [...document.querySelectorAll('.free-editor-field input:not([type="color"]), .free-editor-field select, .free-editor-field textarea, .free-number-setting input')]
        const actions = [...document.querySelectorAll('.free-editor-top-actions button, .free-editor-top-actions a, .free-editor-box-tabs button, .free-editor-nudge-buttons button:not(:disabled), .free-editor-print-buttons button, .free-editor-disclosure summary')]
        const visible = node => {
          const box = node.getBoundingClientRect()
          return box.width > 0 && box.height > 0 && getComputedStyle(node).visibility !== 'hidden'
        }
        return {
          inputSizes: editInputs.filter(visible).map(el => Number.parseFloat(getComputedStyle(el).fontSize)),
          inputHeights: editInputs.filter(visible).map(el => el.getBoundingClientRect().height),
          actionHeights: actions.filter(visible).map(el => el.getBoundingClientRect().height),
          overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
        }
      })
      assert(fontAndTargets.overflow <= 8, 'overflow horizontal no Editor Livre em ' + width + 'px')
      assert(fontAndTargets.actionHeights.every(x => x >= 43.5), 'botões/summary menores que 44px em ' + width + 'px')
      assert(fontAndTargets.inputHeights.every(x => x >= 43.5), 'campos menores que 44px em ' + width + 'px')
      if (width <= 390) {
        assert(fontAndTargets.inputSizes.every(x => x >= 15.9),
          'tipografia de campos abaixo de 16px em ' + width + 'px: ' + fontAndTargets.inputSizes.join(','))
      }

      const x = page.locator('.free-editor-number-grid .free-number-setting').first().locator('input')
      const selected = page.locator('.free-editor-selected-box[role="status"]')
      assert((await selected.innerText()).includes('Descrição'), 'caixa inicial não identificada')
      await page.getByRole('button', { name: 'Centralizar Descrição horizontalmente' }).click()
      const before = Number(await x.inputValue())
      await page.getByRole('button', { name: 'Mover Descrição para a direita' }).click()
      const after = Number(await x.inputValue())
      assert(near(after, before + 0.5), 'seta para direita não deslocou 0,5%')
      await page.getByRole('button', { name: 'Mover Descrição para a esquerda' }).click()
      assert(near(Number(await x.inputValue()), before), 'seta esquerda não desfez o deslocamento')

      await page.getByRole('button', { name: 'Preço', exact: true }).click()
      assert((await selected.innerText()).includes('Preço'), 'seleção de preço sem indicação visual')
      assert(await page.getByRole('button', { name: 'Mover Preço para cima' }).count() === 1, 'setas não acompanharam a seleção')

      await page.getByRole('button', { name: '+ Texto' }).click()
      assert((await selected.innerText()).includes('Texto 1'), 'caixa adicional não foi selecionada')
      await page.getByRole('button', { name: 'Excluir esta caixa' }).click()
      assert((await selected.innerText()).includes('Descrição'), 'exclusão não restaurou seleção')

      await page.getByRole('button', { name: /Como usar o editor/i }).first().click()
      const guideFocused = await page.evaluate(() => document.activeElement?.closest('#guia-editor-livre')?.tagName === 'DETAILS')
      assert(guideFocused, 'foco não foi enviado para o tutorial aberto')
      const firstGuideControl = page.locator('#guia-editor-livre button[aria-label^="Ver controle:"]').first()
      await firstGuideControl.click()
      await page.waitForFunction(() => document.activeElement?.closest('[data-guide-section]') !== null)
      console.log('[free-editor-ux] ' + width + 'px: alvos, campos, nudges, seleção, exclusão e foco OK')
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
