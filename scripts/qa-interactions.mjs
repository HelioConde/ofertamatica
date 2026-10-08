import { chromium } from 'playwright'

const origin = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183'
const browser = await chromium.launch({ headless: true })
const findings = []
const failures = []
async function scenario(name, viewport, run) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  const browserErrors = []
  page.on('pageerror', (error) => {
    // Erro conhecido de conversão protobuf emitido pelo SDK do Google Ads.
    // Reportamos todos os demais erros que afetem a aplicação.
    if (!/^int64$/i.test(String(error.message || '').trim())) browserErrors.push(error.message)
  })
  try {
    await run(page)
    if (browserErrors.length) throw new Error('Erros de JavaScript: ' + browserErrors.join(' | '))
    findings.push({ scenario: name, status: 'ok' })
    console.log('OK ' + name)
  } catch (error) {
    failures.push({ scenario: name, error: error.message })
    console.error('FALHOU ' + name + ': ' + error.message)
  } finally {
    await page.close()
  }
}
async function check(page, selector, description) {
  const locator = page.locator(selector)
  await locator.first().waitFor({ state: 'visible', timeout: 20000 })
  if (await locator.count() < 1) throw new Error(description)
}
await scenario('Home e escolha de formato desktop', { width: 1440, height: 900 }, async (page) => {
  await page.goto(origin + '/', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelectorAll('.format-grid .format-choice').length === 8)
  await check(page, '.format-choice[data-format-id="A4"]', 'O formato A4 não está visível')
  await page.locator('.format-choice[data-format-id="A4"]').click()
  await check(page, '.editor-page textarea[aria-label="Lista de produtos, uma linha por produto"]', 'Editor não abriu após a seleção')
  if (!(await page.locator('.editor-context').innerText()).includes('A4')) throw new Error('Formato A4 não foi preservado')
})
await scenario('Publicidade mobile: adiar carregamento até aproximar anúncio', { width: 390, height: 844 }, async (page) => {
  await page.goto(origin + '/', { waitUntil: 'domcontentloaded' })
  await page.locator('.format-grid .format-choice').first().waitFor({ state: 'visible' })
  await page.waitForTimeout(350)
  if (await page.locator('script[data-ofertamatica-adsense]').count()) throw new Error('O script do AdSense iniciou fora da tela')
  await page.locator('.format-ad-card').scrollIntoViewIfNeeded()
  await page.waitForFunction(() => Boolean(document.querySelector('script[data-ofertamatica-adsense]')), null, { timeout: 8000 })
})
await scenario('Editor mobile: gerar, prévia e voltar', { width: 390, height: 844 }, async (page) => {
  await page.goto(origin + '/', { waitUntil: 'domcontentloaded' })
  await page.locator('.format-choice[data-format-id="A4"]').click()
  const textarea = page.locator('textarea[aria-label="Lista de produtos, uma linha por produto"]')
  await textarea.waitFor({ state: 'visible' })
  await textarea.fill('Café Torrado 500g 18,90\nMamão Formosa kg 4,99')
  await textarea.press('Control+Enter')
  await page.waitForFunction(() => document.querySelectorAll('.interpreted .product-row, .interpreted .product-card').length >= 2 || document.querySelector('.interpreted')?.textContent?.includes('18,90'))
  await check(page, '.mobile-preview-shortcut', 'Atalho de prévia não apareceu')
  await page.locator('.mobile-preview-shortcut').click()
  await check(page, '.preview-card.mobile-panel-active', 'A prévia não foi ativada')
  if (await page.locator('[data-mobile-tab="preview"]').getAttribute('aria-selected') !== 'true') throw new Error('Aba prévia não está selecionada')
  await page.locator('[data-mobile-tab="products"]').click()
  await check(page, '.editor-main.mobile-panel-active', 'Não foi possível voltar a Produtos')
  await page.locator('[data-mobile-tab="products"]').focus()
  await page.keyboard.press('ArrowRight')
  if (await page.locator('[data-mobile-tab="preview"]').getAttribute('aria-selected') !== 'true') throw new Error('Teclado não alternou para Prévia')
  await page.keyboard.press('ArrowRight')
  if (await page.locator('[data-mobile-tab="style"]').getAttribute('aria-selected') !== 'true') throw new Error('Teclado não alternou para Estilo')
  await page.keyboard.press('Home')
  if (await page.locator('[data-mobile-tab="products"]').getAttribute('aria-selected') !== 'true') throw new Error('Tecla Home não retornou a Produtos')
})
await scenario('Modelos mobile: grade compacta e prévia maior', { width: 360, height: 800 }, async (page) => {
  await page.goto(origin + '/modelos/', { waitUntil: 'domcontentloaded' })
  await check(page, '.model-view-switch', 'Alternância de modelos não apareceu')
  await check(page, '.model-showcase-grid .model-showcase-card', 'Modelos não foram renderizados')
  await page.getByRole('button', { name: 'Grade compacta' }).click()
  if (!(await page.locator('.model-showcase-grid').getAttribute('class')).includes('model-gallery-compact')) throw new Error('Grade compacta não ativada')
  await page.getByRole('button', { name: 'Prévia maior' }).click()
  if (!(await page.locator('.model-showcase-grid').getAttribute('class')).includes('model-gallery-detailed')) throw new Error('Prévia ampliada não ativada')
  const count = await page.locator('.model-showcase-card').count()
  if (count < 12) throw new Error('Catálogo incompleto: ' + count + ' cartazes')
})
await scenario('SEO: cartaz De/Por com exemplo e CTA', { width: 390, height: 844 }, async (page) => {
  await page.goto(origin + '/cartaz-de-por/', { waitUntil: 'domcontentloaded' })
  await check(page, '.seo-poster-example .seo-example-art', 'Exemplo de cartaz De/Por indisponível')
  if (!(await page.locator('.seo-poster-example').innerText()).includes('19,90')) throw new Error('Preço demonstrativo ausente')
  await page.locator('.seo-poster-example .seo-example-create').click()
  await check(page, '.format-grid .format-choice', 'CTA do guia não abriu o criador')
})
await scenario('Contato oficial: e-mail nas páginas institucionais', { width: 390, height: 844 }, async (page) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value) => { window.__supportEmailCopied = value } },
    })
  })
  for (const slug of ['fale-conosco', 'privacidade', 'termos']) {
    await page.goto(origin + '/' + slug + '/', { waitUntil: 'domcontentloaded' })
    const link = page.locator('.institutional-email-address')
    await link.waitFor({ state: 'visible' })
    const href = await link.getAttribute('href')
    if (!href?.startsWith('mailto:atendimento@ofertamatica.com.br')) throw new Error('E-mail inválido em ' + slug)
    if (!(await page.locator('main').innerText()).includes('atendimento@ofertamatica.com.br')) throw new Error('E-mail não aparece em ' + slug)
    if (slug === 'fale-conosco') {
      const cards = await page.locator('.legal-content article').count()
      if (cards !== 3) throw new Error('Fale Conosco deve exibir apenas 3 orientações objetivas: ' + cards)
    }
    await page.getByRole('button', { name: 'Copiar e-mail' }).click()
    await page.getByRole('status').getByText('E-mail copiado para a área de transferência.').waitFor()
    if (await page.evaluate(() => window.__supportEmailCopied) !== 'atendimento@ofertamatica.com.br') {
      throw new Error('Botão não copiou endereço oficial em ' + slug)
    }
  }
})
await browser.close()
console.log('\nResultado: ' + findings.length + ' cenários aprovados, ' + failures.length + ' falhas.')
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2))
  process.exitCode = 1
}
