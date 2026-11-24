import { chromium } from 'playwright'

// Skill UI Verify: abrir cada fluxo real, interagir, conferir CSS calculado e
// estados acessíveis. Não testa nem altera o desenho dos cartazes impressos.
const base = (process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183').replace(/\/$/, '')
const browser = await chromium.launch({ headless: true })

function assert(condition, message) {
  if (!condition) throw new Error('[ux-polish] ' + message)
}
async function open(page, route, ready) {
  const response = await page.goto(base + route, { waitUntil: 'domcontentloaded' })
  assert(response && response.status() < 400, 'Falha HTTP em ' + route)
  await page.locator(ready).first().waitFor({ state: 'visible', timeout: 20000 })
}
async function checkNoOverflow(page, route, width) {
  const diff = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth)
  assert(diff <= 8, route + ' tem overflow horizontal de ' + diff + 'px em ' + width + 'px')
}

try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    await context.addInitScript(() => {
      localStorage.setItem('ofertamatica:draft:v1', JSON.stringify({
        formatId: 'A4',
        sourceText: 'CAFÉ 500G 9,99',
        products: [{ id: 'qa-resume', description: 'CAFÉ 500G', price: '9,99' }],
        savedAt: Date.now(),
      }))
    })
    const page = await context.newPage()
    try {
      await open(page, '/', '.format-home-refresh .resume-work button')
      const banner = page.locator('.format-home-refresh .resume-work')
      const resume = banner.getByRole('button', { name: 'Continuar último trabalho' })
      const dimensions = await resume.evaluate(button => {
        const css = getComputedStyle(button)
        return { height: button.getBoundingClientRect().height, fontSize: Number.parseFloat(css.fontSize) }
      })
      assert(dimensions.height >= 44, 'Retomada com alvo pequeno: ' + dimensions.height)
      assert(dimensions.fontSize >= 13, 'Texto de retomada pequeno: ' + dimensions.fontSize)
      assert(await banner.getByText('1 produto', { exact: false }).count() >= 1, 'Quantidade do trabalho salvo não aparece')
      await checkNoOverflow(page, 'home com rascunho', width)
      const cookieReject = page.getByRole('button', { name: /Rejeitar opcionais/i })
      if (await cookieReject.count() && await cookieReject.isVisible()) await cookieReject.click()
      await resume.click()
      await page.locator('.editor-page .editor-topline').waitFor({ state: 'visible', timeout: 20000 })

      // Skill A11y: nome inválido em listas salvas precisa identificar o campo,
      // explicar o erro e devolver foco ao local da correção, em mobile e desktop.
      await page.locator('.input-menu-trigger').click()
      await page.getByRole('menuitem', { name: /Minhas listas/ }).click()
      const savedDialog = page.locator('.saved-lists-dialog')
      await savedDialog.waitFor({ state: 'visible' })
      const nameInput = savedDialog.locator('#saved-lists-name')
      await nameInput.fill('X')
      await savedDialog.getByRole('button', { name: 'Salvar lista atual' }).click()
      assert(await nameInput.getAttribute('aria-invalid') === 'true', 'Nome de lista inválido sem aria-invalid')
      assert((await nameInput.getAttribute('aria-describedby'))?.includes('saved-lists-name-error'),
        'Nome inválido sem mensagem associada')
      assert(await savedDialog.locator('#saved-lists-name-error').isVisible(), 'Erro de nome não aparece junto ao campo')
      assert(await nameInput.evaluate(el => document.activeElement === el), 'Foco não retorna ao nome da lista')
      if (width === 390) {
        const font = await nameInput.evaluate(el => Number.parseFloat(getComputedStyle(el).fontSize))
        assert(font >= 16, 'Nome da lista pode causar zoom involuntário no celular: ' + font)
      }
      await nameInput.fill('Ofertas da semana')
      assert(await nameInput.getAttribute('aria-invalid') !== 'true', 'Correção do nome não limpa aria-invalid')
      assert(!(await savedDialog.locator('#saved-lists-name-error').count()), 'Mensagem inválida persiste após corrigir nome')
      await savedDialog.getByRole('button', { name: 'Salvar lista atual' }).click()
      assert(await savedDialog.locator('.saved-lists-list > li').count() === 1, 'Lista válida não foi salva')
      await page.keyboard.press('Escape')
      assert(!(await savedDialog.evaluate(el => el.open)), 'Escape não fecha Minhas listas')
      console.log('[ux-polish] Minhas listas: erro acessível, recuperação e salvamento ' + width + 'px: OK')
      console.log('[ux-polish] Retomada de rascunho ' + width + 'px: OK')
      // Pré-conferência de listas: vincular aviso de limite ao campo e
      // preservar leitura e digitação sem zoom no Safari iOS.
      await open(page, '/cartazes-a-partir-de-excel/', '.retail-review textarea')
      const reviewInput = page.locator('.retail-review textarea')
      await reviewInput.fill('x'.repeat(12001))
      assert(await reviewInput.getAttribute('aria-invalid') === 'true',
        'Pré-conferência excedida sem aria-invalid')
      const error = page.locator('.retail-review-error[role="alert"]')
      assert(await error.isVisible(), 'Pré-conferência não informa o limite excedido')
      assert(await page.locator('.retail-review-scroll-hint').count() === 0,
        'Orientação de rolagem aparece sem tabela no estado de erro')
      const errorId = await error.getAttribute('id')
      const describedBy = await reviewInput.getAttribute('aria-describedby') || ''
      assert(Boolean(errorId) && describedBy.split(' ').includes(errorId),
        'Aviso de limite não está associado ao campo')
      assert(describedBy.includes('-hint'), 'Orientação original do campo foi perdida')
      if (width === 390) {
        const fontSize = await reviewInput.evaluate(el => Number.parseFloat(getComputedStyle(el).fontSize))
        assert(fontSize >= 16, 'Campo de Excel pode acionar zoom involuntário no iOS: ' + fontSize)
      }
      await reviewInput.fill('CAFÉ 500G 18,90')
      assert(await reviewInput.getAttribute('aria-invalid') === 'false',
        'Correção da lista não remove estado inválido')
      assert(await error.count() === 0, 'Aviso permanece após corrigir lista')
      assert(await page.locator('.retail-review-stats').isVisible(), 'Resultado não reaparece após correção')
      const reviewTable = page.getByRole('region', { name: 'Resultados da conferência dos produtos', exact: true })
      const scrollHint = page.locator('.retail-review-scroll-hint')
      assert(await reviewTable.getAttribute('aria-describedby') === await scrollHint.getAttribute('id'),
        'Tabela sem orientação de rolagem associada')
      if (width === 390) {
        assert(await scrollHint.isVisible(), 'Orientação de rolagem não aparece no celular')
        await reviewInput.focus()
        await page.keyboard.press('Tab')
        assert(await reviewTable.evaluate(el => document.activeElement === el),
          'Tabela não é alcançável por Tab a partir da lista')
        const initialScroll = await reviewTable.evaluate(el => el.scrollLeft)
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(start => document.querySelector('.retail-review-scroll').scrollLeft > start,
          initialScroll, { timeout: 3000 })
        for (let step = 0; step < 20; step++) await page.keyboard.press('ArrowRight')
        await page.waitForFunction(() => {
          const table = document.querySelector('.retail-review-scroll')
          return table.scrollWidth - table.clientWidth - table.scrollLeft <= 2
        }, null, { timeout: 3000 })
        assert(await reviewTable.evaluate(el => {
          const region = el.getBoundingClientRect()
          const lastColumn = el.querySelector('thead th:last-child').getBoundingClientRect()
          return lastColumn.left >= region.left && lastColumn.right <= region.right + 1
        }), 'Coluna de conferência continua fora da área visível após rolagem')
        await page.keyboard.press('Tab')
        assert(await page.getByRole('button', { name: 'Copiar lista', exact: true })
          .evaluate(el => document.activeElement === el), 'Tabela prende a navegação por Tab')
      } else {
        assert(!await scrollHint.isVisible(), 'Orientação mobile ocupa espaço no desktop')
      }
      await reviewInput.fill('')
      assert(await reviewTable.count() === 0 && await scrollHint.count() === 0,
        'Tabela ou orientação permanece após limpar a lista')
      await reviewInput.fill('CAFÉ 500G 18,90')
      await checkNoOverflow(page, 'pré-conferência de lista do Excel', width)
      console.log('[ux-polish] Pré-conferência Excel: erro associado e recuperação ' + width + 'px: OK')
    } finally {
      await context.close()
    }
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  try {
    await open(page, '/modelos/', '.model-gallery-tools .model-search input')
    const query = page.locator('.model-gallery-tools input[name="modelo"]')
    await query.fill('termo-inexistente-qa-2026')
    const count = page.locator('.model-gallery-tools [role="status"]')
    assert((await count.innerText()).includes('0 de 0 encontrados'), 'Busca de modelos sem status atualizado')
    const clearModel = page.getByRole('button', { name: 'Limpar busca' })
    assert(await clearModel.isVisible(), 'Botão de limpeza da busca não aparece')
    await clearModel.click()
    assert(await query.inputValue() === '', 'Limpar modelos não zera busca')
    assert(await page.locator('#ofertamatica-model-results .model-showcase-card').count() > 0, 'Modelos não reapareceram')
    await checkNoOverflow(page, 'busca de modelos', 390)
    console.log('[ux-polish] Busca de modelos e limpeza: OK')

    await page.locator('.model-mode-switch button').nth(1).click()
    const bgSearch = page.locator('.bg-gallery-search input[name="fundo"]')
    await bgSearch.waitFor({ state: 'visible', timeout: 20000 })
    await bgSearch.fill('termo-inexistente-qa-2026')
    assert((await page.locator('.bg-gallery-results-status').innerText()).includes('0 de 0 fundos encontrados'),
      'Busca de fundos sem feedback de zero resultados')
    await page.getByRole('button', { name: 'Limpar busca' }).click()
    assert(await bgSearch.inputValue() === '', 'Limpar fundos não zera busca')
    assert(await page.locator('#bg-gallery-results .bg-gallery-card').count() > 0, 'Fundos não reapareceram')
    await checkNoOverflow(page, 'busca de fundos', 390)
    console.log('[ux-polish] Busca de fundos e limpeza: OK')
  } finally {
    await page.close()
  }
} finally {
  await browser.close()
}
