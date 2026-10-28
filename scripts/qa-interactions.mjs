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
  if (await page.locator('.cookie-entry').count()) throw new Error('Botão flutuante ainda aparece após rejeitar cookies')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.ofertaConsent?.getState().hasChoice === true)
  if (await page.locator('.cookie-entry, .cookie-banner').count()) throw new Error('Aviso reapareceu após recarregar a escolha salva')
  await page.goto(origin + '/privacidade/', { waitUntil: 'domcontentloaded' })
  await check(page, '#preferencias-de-cookies', 'A seção de preferências não está na Política de Privacidade')
  if (await page.locator('.cookie-entry').count()) throw new Error('Botão flutuante reapareceu na página de privacidade')
  await page.getByRole('button', { name: 'Gerenciar preferências de cookies' }).click()
  await check(page, '[role="dialog"][aria-modal="true"]', 'Personalização não abriu pela Política de Privacidade')
  if (await page.locator('.cookie-option input[type="checkbox"]:checked').count()) throw new Error('Opções não foram inicializadas desativadas')
  await page.getByRole('button', { name: 'Salvar escolhas' }).click()
  if (await page.locator('[role="dialog"]').count()) throw new Error('Painel de preferências não fechou')
  if (await page.locator('.cookie-entry').count()) throw new Error('Atalho voltou após salvar preferências')
})
await scenario('Cookies desktop: aceitar e reabrir pelo rodapé', { width: 1440, height: 900 }, async (page) => {
  await page.goto(origin + '/', { waitUntil: 'domcontentloaded' })
  await check(page, '.cookie-banner', 'Banner inicial ausente no desktop')
  await page.getByRole('button', { name: 'Aceitar todos' }).click()
  await page.waitForFunction(() => window.ofertaConsent?.getState().hasChoice === true)
  if (await page.locator('.cookie-entry, .cookie-banner').count()) throw new Error('Aviso ou botão flutuante ficou após aceitar')
  await page.goto(origin + '/como-funciona/', { waitUntil: 'domcontentloaded' })
  const footerButton = page.locator('.marketing-footer-privacy-button')
  await footerButton.waitFor({ state: 'visible' })
  await footerButton.click()
  await check(page, '.cookie-dialog[aria-modal="true"]', 'Rodapé não reabriu as preferências')
  await page.getByRole('button', { name: 'Rejeitar todos' }).click()
  await page.waitForFunction(() => window.ofertaConsent?.getState().hasChoice === true)
  if (await page.locator('.cookie-entry').count()) throw new Error('Botão flutuante voltou após revogar')
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
await scenario('Cartaz A4: MAÇÃ em Burbank e preço em Futura Price', { width: 1440, height: 900 }, async (page) => {
  await page.goto(origin + '/', { waitUntil: 'domcontentloaded' })
  await page.locator('.format-choice[data-format-id="A4"]').click()
  const input = page.locator('textarea[aria-label="Lista de produtos, uma linha por produto"]')
  await input.waitFor({ state: 'visible' })
  await input.fill('MAÇÃ FUJI KG 6,99')
  await input.press('Control+Enter')
  await page.locator('.poster-field-description').first().waitFor({ state: 'visible', timeout: 20000 })
  await page.locator('.poster-price-value').first().waitFor({ state: 'visible', timeout: 20000 })
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('900 16px "Burbank Big Cd Bk"'),
      document.fonts.load('italic 900 16px "Futura Price"'),
    ])
  })
  const fonts = await page.evaluate(() => ({
    description: getComputedStyle(document.querySelector('.poster-field-description')).fontFamily,
    price: getComputedStyle(document.querySelector('.poster-price-value')).fontFamily,
    burbankReady: document.fonts.check('900 16px "Burbank Big Cd Bk"'),
    futuraReady: document.fonts.check('italic 900 16px "Futura Price"'),
  }))
  if (!fonts.description.includes('Burbank Big Cd Bk') || !fonts.price.includes('Futura Price')) {
    throw new Error('Fonte visual divergente: ' + JSON.stringify(fonts))
  }
  if (!fonts.burbankReady || !fonts.futuraReady) {
    throw new Error('Arquivos de fontes locais indisponíveis: ' + JSON.stringify(fonts))
  }
})

// Regressão: as miniaturas da aba Artes não podem mostrar placas sem preço de exemplo.
for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 768 }]) {
  await scenario('Miniaturas com preço visível (' + viewport.width + 'px)', viewport, async (page) => {
    await page.goto(origin + '/', { waitUntil: 'domcontentloaded' })
    await page.locator('.format-choice[data-format-id="A4"]').click()
    await check(page, '.editor-page textarea[aria-label="Lista de produtos, uma linha por produto"]', 'Editor de cartazes indisponível')
    if (viewport.width <= 390) await page.locator('[data-mobile-tab="style"]').click()
    const model = page.locator('.header-art-grid [data-model-art="super-oferta"]')
    await model.waitFor({ state: 'visible', timeout: 20000 })
    const price = model.locator('.model-thumbnail-price')
    await price.waitFor({ state: 'visible' })
    const result = await price.evaluate((element) => {
      const stage = element.closest('.personalization-live-stage')
      const text = element.textContent.replace(/\\s+/g, '')
      const bounds = element.querySelector('.poster-price-value').getBoundingClientRect()
      const frame = stage.getBoundingClientRect()
      const style = getComputedStyle(element)
      return {
        text, price: element.dataset.samplePrice,
        fontSize: parseFloat(style.fontSize), visibility: style.visibility,
        color: style.color,
        inside: bounds.left >= frame.left - 2 && bounds.right <= frame.right + 2 &&
          bounds.top >= frame.top - 2 && bounds.bottom <= frame.bottom + 2,
        ariaLabel: element.closest('button')?.getAttribute('aria-label') || '',
      }
    })
    if (result.price !== '24,90' || !result.text.includes('R$24,90')) {
      throw new Error('Preço de referência não está completo: ' + JSON.stringify(result))
    }
    if (result.visibility !== 'visible' || result.fontSize < 20 || !result.inside) {
      throw new Error('Preço ilegível ou cortado na miniatura: ' + JSON.stringify(result))
    }
    if (!result.ariaLabel.includes('24,90')) {
      throw new Error('Modelo sem preço ilustrativo para leitores de tela')
    }
  })
}

// Validade Zero: app completo hospedado no mesmo domínio e nova aba por opção de navegação.
for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  const mode = viewport.width === 390 ? 'mobile' : 'desktop'
  await scenario('Validade Zero integrado: nova aba via Mais informações (' + mode + ')', viewport, async (page) => {
    await page.goto(origin + '/', { waitUntil: 'domcontentloaded' })
    await check(page, '.format-home-chooser .format-choice', 'O criador deixou de abrir na Home')
    const navLink = page.locator('.main-nav a[href="/validade-zero/"]')
    await navLink.waitFor({ state: 'attached' })
    const navAttrs = await navLink.evaluate(a => ({ target: a.target, rel: a.rel }))
    if (navAttrs.target !== '_blank' || !navAttrs.rel.includes('noopener') || !navAttrs.rel.includes('noreferrer'))
      throw new Error('Validade Zero na navbar deve abrir em nova aba')
    await page.locator('.format-more-links summary').click()
    const link = page.locator('.format-more-links a[href="/validade-zero/"]')
    await link.waitFor({ state: 'visible' })
    const attrs = await link.evaluate(a => ({ target:a.target,rel:a.rel }))
    if(attrs.target !== '_blank' || !attrs.rel.includes('noopener') || !attrs.rel.includes('noreferrer'))
      throw new Error('Link sem segurança para a nova aba: '+JSON.stringify(attrs))
    const [popup]=await Promise.all([page.waitForEvent('popup'),link.click()])
    try {
      await popup.locator('.heading h1').waitFor({ state: 'visible', timeout: 20000 })
      if(new URL(popup.url()).pathname !== '/validade-zero/')
        throw new Error('Destino incorreto: '+popup.url())
      await check(popup, '.metrics', 'Aplicação de validade não carregou')
      if(!page.url().endsWith('/'))throw new Error('A aba do criador foi substituída')
    } finally { await popup.close() }
  })

  await scenario('Validade Zero integrado: entrada direta e OCR (' + mode + ')', viewport, async(page)=>{
    await page.goto(origin+'/validade-zero/',{waitUntil:'domcontentloaded'})
    await check(page,'.heading h1','Dashboard Validade Zero não carregou')
    // O painel operacional deve preceder a divulgação do modo de teste.
    const order = await page.evaluate(() => {
      const metrics = document.querySelector('.metrics')
      const banner = document.querySelector('.demo-banner--compact')
      return Boolean(metrics && banner && (metrics.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING))
    })
    if (!order) throw new Error('Indicadores não estão antes do banner de modo local')
    await check(page,'.demo-banner--compact .demo-banner__details','Detalhes sobre armazenamento local indisponíveis')
    const disclaimer = await page.locator('.demo-banner--compact').innerText()
    if (!disclaimer.includes('faça backup regularmente')) throw new Error('Aviso de backup não está visível')
    const scanShortcut = page.getByRole('button',{name:'Escanear EAN',exact:true})
    await scanShortcut.click()
    await check(page,'#catalog-scanner .scanner-window','Atalho EAN não abriu o leitor de câmera')
    const photoButton = page.getByRole('button',{name:'Tirar foto do EAN'})
    await photoButton.waitFor({state:'visible'})
    const captureInput = page.getByLabel('Foto do código EAN')
    if (await captureInput.getAttribute('capture') !== 'environment')
      throw new Error('Modo foto deve usar a câmera traseira do celular')
    await photoButton.click()
    await check(page,'.scanner-photo-mode','Modo de foto nativa não abriu')
    if(await page.locator('#catalog-scanner video').count())
      throw new Error('Vídeo deveria liberar a câmera durante a foto nativa')
    await page.getByRole('button',{name:'Voltar ao leitor ao vivo'}).click()
    await check(page,'#catalog-scanner video','Não retornou ao vídeo ao vivo após modo foto')
    if (await scanShortcut.getAttribute('aria-expanded') !== 'true')
      throw new Error('Atalho de câmera não indicou estado expandido')
    await page.getByRole('button',{name:'Fechar leitor de EAN'}).click()
    if (await page.locator('#catalog-scanner').count())
      throw new Error('Leitor EAN não liberou a câmera ao fechar')
    await scanShortcut.click()
    const eanInput = page.getByLabel('Código EAN / código interno')
    await eanInput.fill('7891991000826')
    if (await page.locator('#catalog-scanner').count())
      throw new Error('Digitação manual não fechou o leitor de EAN')
    await eanInput.fill('')
    await check(page,'.vz-site-header .vz-site-brand','Navbar institucional do Ofertamática ausente')
    await check(page,'.vz-site-header .vz-site-brand-icon','Logo do Ofertamática ausente')
    const siteNav = page.locator('#vz-site-menu-links')
    const mobileToggle = page.getByRole('button',{name:'Abrir menu'})
    if (viewport.width < 821) {
      await mobileToggle.waitFor({state:'visible'})
      if (await siteNav.isVisible()) throw new Error('Menu mobile deveria iniciar recolhido')
      if (await mobileToggle.getAttribute('aria-expanded') !== 'false')
        throw new Error('Menu mobile não informou estado inicial fechado')
      await mobileToggle.click()
      await siteNav.waitFor({state:'visible'})
      const expanded = page.getByRole('button',{name:'Fechar menu'})
      if (await expanded.getAttribute('aria-expanded') !== 'true')
        throw new Error('Menu mobile não informou que foi expandido')
    } else {
      await siteNav.waitFor({state:'visible'})
      if (await page.locator('.vz-site-menu-toggle').isVisible())
        throw new Error('Botão do menu mobile apareceu no desktop')
    }
    const activeTool = siteNav.locator('a[href="/validade-zero/"]')
    if (await activeTool.getAttribute('aria-current') !== 'page')
      throw new Error('Validade Zero não está ativo na navbar')
    if (!(await activeTool.getAttribute('class')).includes('is-current'))
      throw new Error('Validade Zero sem destaque visual na navbar')
    const activeVisible = await page.evaluate(() => {
      const menu = document.querySelector('#vz-site-menu-links')?.getBoundingClientRect()
      const item = document.querySelector('.vz-site-nav-current')?.getBoundingClientRect()
      return Boolean(menu && item && item.left >= -1 &&
        item.right <= innerWidth + 1 && item.top >= menu.top - 1 &&
        item.bottom <= menu.bottom + 1)
    })
    if (!activeVisible) throw new Error('A opção Validade Zero ficou cortada no menu')
    await check(page,'.vz-site-brand-copy .vz-site-product','Subtítulo Validade Zero não está sob Ofertamática')
    if((await page.locator('.vz-site-brand-copy .vz-site-product').innerText()).trim() !== 'Validade Zero')
      throw new Error('O nome da ferramenta deve ficar diretamente sob Ofertamática')
    if(await page.locator('.sidebar .brand, .sidebar .ecosystem-link, .vz-site-tool').count())
      throw new Error('Há marcas ou selos duplicados no dashboard')
    if((await page.locator('.vz-site-header img').count()) !== 1)
      throw new Error('A navbar deve usar apenas a logo oficial do Ofertamática')
    const logo = page.locator('.vz-site-brand-icon')
    if (!(await logo.getAttribute('src')).startsWith('/icons/icon-192.png')) throw new Error('Ícone da marca incorreto')
    const nav = page.getByRole('navigation',{name:'Navegação principal do Ofertamática'})
    for (const label of ['Criar placas','Modelos','Editor livre','Formatos','Como funciona','Guias para varejo']) {
      if (!(await nav.textContent()).includes(label)) throw new Error('Link institucional ausente: '+label)
    }
    if (viewport.width < 821) {
      await page.keyboard.press('Escape')
      await siteNav.waitFor({state:'hidden'})
      const toggle = page.getByRole('button',{name:'Abrir menu'})
      if (await toggle.getAttribute('aria-expanded') !== 'false')
        throw new Error('Menu mobile não fechou com Escape')
      await toggle.click()
      await siteNav.waitFor({state:'visible'})
      await page.getByRole('button',{name:'Fechar menu'}).click()
      await siteNav.waitFor({state:'hidden'})
    }
    const headerOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    if (headerOverflow > 2) throw new Error('Barra superior causou overflow horizontal: '+headerOverflow)

    await check(page,'.metrics','Indicadores de vencimento ausentes')
    await check(page,'.ean-input-camera','Leitor EAN não está disponível')
    if(new URL(page.url()).pathname !== '/validade-zero/')
      throw new Error('Aplicativo foi redirecionado para outro endereço')
    await page.getByRole('button',{name:/Nova entrada/}).click()
    await check(page,'.entry-form','Formulário de lotes não abriu')
    await check(page,'.expiry-input-wrap','Leitor de validade OCR ausente')
  })

  await scenario('Validade Zero: conhecer e abrir em nova aba ('+mode+')',viewport,async(page)=>{
    await page.goto(origin+'/conheca-validade-zero/',{waitUntil:'domcontentloaded'})
    await check(page,'.validade-zero-hero-actions .validade-zero-open','CTA informativo ausente')
    const link=page.locator('.validade-zero-hero-actions .validade-zero-open')
    const attrs=await link.evaluate(a=>({target:a.target,href:a.getAttribute('href'),rel:a.rel}))
    if(attrs.href !== '/validade-zero/' || attrs.target !== '_blank' || !attrs.rel.includes('noopener'))
      throw new Error('CTA do aplicativo não abre em nova aba local')
    const [popup]=await Promise.all([page.waitForEvent('popup'),link.click()])
    try {
      await popup.locator('.heading h1').waitFor({state:'visible',timeout:20000})
      if(new URL(popup.url()).pathname !== '/validade-zero/')throw new Error('CTA não abriu o app')
    } finally { await popup.close() }
  })
}

await browser.close()
console.log('\nResultado: ' + findings.length + ' cenários aprovados, ' + failures.length + ' falhas.')
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2))
  process.exitCode = 1
}
