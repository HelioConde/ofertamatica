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
await scenario('Publicidade mobile: CMP disponível, anúncios bloqueados sem escolha', { width: 390, height: 844 }, async (page) => {
  const requests = []
  page.on('request', (request) => {
    if (/\/pagead\/ads(?:\?|$)|\/gampad\/ads(?:\?|$)/.test(request.url())) requests.push(request.url())
  })
  await page.goto(origin + '/', { waitUntil: 'domcontentloaded' })
  await page.locator('.format-grid .format-choice').first().waitFor({ state: 'visible' })
  await page.waitForFunction(() => Boolean(window.ofertaConsent), null, { timeout: 8000 })
  const result = await page.evaluate(() => ({
    publisherCode: !!document.querySelector('script[data-ofertamatica-adsense]'),
    defaultDenied: window.ofertaConsent.getState().adsEnabled === false,
    adUnitCount: document.querySelectorAll('.format-ad-card ins.adsbygoogle').length,
    gtmCount: document.querySelectorAll('script[data-ofertamatica-gtm]').length
  }))
  if (!result.publisherCode) throw new Error('Código publisher da CMP não carregou')
  if (!result.defaultDenied || result.adUnitCount !== 0 || result.gtmCount !== 0) throw new Error('Serviços opcionais iniciaram antes da escolha')
  // A área pode ser ocultada de propósito enquanto os anúncios estiverem negados.
  // Não tente fazer scroll em uma seção que já não ocupa layout.
  await page.waitForTimeout(350)
  if (await page.locator('.format-ad-card ins.adsbygoogle').count()) throw new Error('Anúncio foi solicitado sem consentimento')
  if (requests.length) throw new Error('Houve requisição de publicidade sem autorização: ' + requests[0])
})
await scenario('Cookies desktop: banner compacto, minimizar e restaurar', { width: 1440, height: 900 }, async (page) => {
  await page.goto(origin + '/', { waitUntil: 'domcontentloaded' })
  await check(page, '.cookie-banner', 'Banner de cookies não apareceu')
  const size = await page.locator('.cookie-banner').boundingBox()
  if (!size || size.width > 468 || size.height > 280 || size.x < 900) {
    throw new Error('Banner desktop ainda ocupa muito espaço: ' + JSON.stringify(size))
  }
  await page.getByRole('button', { name: 'Minimizar aviso de cookies sem registrar uma escolha' }).click()
  if (await page.locator('.cookie-banner').count()) throw new Error('Banner não minimizou')
  if (await page.evaluate(() => window.ofertaConsent.getState().hasChoice)) throw new Error('Minimizar gravou consentimento sem escolha')
  await page.getByRole('button', { name: 'Reabrir aviso de cookies sem registrar escolha' }).click()
  await check(page, '.cookie-banner', 'Banner não retornou após minimizar')
  await page.getByRole('button', { name: 'Personalizar' }).click()
  await check(page, '.cookie-dialog[aria-modal="true"]', 'Painel de preferências não abriu')
})
await scenario('Cookies mobile: rejeitar, reabrir e personalizar', { width: 390, height: 844 }, async (page) => {
  await page.goto(origin + '/', { waitUntil: 'domcontentloaded' })
  await check(page, '.cookie-banner', 'Banner de privacidade não apareceu')
  const box = await page.locator('.cookie-banner').boundingBox()
  if (!box || box.height > 350 || box.width > 400 || box.x < 0) throw new Error('Banner mobile desproporcional: ' + JSON.stringify(box))
  await page.getByRole('button', { name: 'Rejeitar opcionais' }).click()
  await page.waitForFunction(() => window.ofertaConsent?.getState().hasChoice === true)
  if (await page.locator('.cookie-banner').count()) throw new Error('Banner não fechou após rejeição')
  const status = await page.evaluate(() => window.ofertaConsent.getState())
  if (status.analyticsEnabled || status.adsEnabled) throw new Error('Rejeição não bloqueou os serviços')
  const privacyShortcut = await page.locator('.cookie-entry').boundingBox()
  if (!privacyShortcut || privacyShortcut.width > 50 || privacyShortcut.height > 50) {
    throw new Error('Atalho de privacidade ainda ocupa espaço excessivo no celular: ' + JSON.stringify(privacyShortcut))
  }
  await page.getByRole('button', { name: 'Abrir preferências de privacidade e cookies' }).click()
  await check(page, '[role="dialog"][aria-modal="true"]', 'Personalização não abriu')
  if (await page.locator('.cookie-option input[type="checkbox"]:checked').count()) throw new Error('Opções não foram inicializadas desativadas')
  await page.getByRole('button', { name: 'Salvar escolhas' }).click()
  if (await page.locator('[role="dialog"]').count()) throw new Error('Painel de preferências não fechou')
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
