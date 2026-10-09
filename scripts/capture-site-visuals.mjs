import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { PUBLIC_PAGES, SEO_PAGES } from '../src/seo/seoPages.js'

const baseUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183'
const outDir = path.resolve('screenshots/site')
await fs.mkdir(outDir, { recursive: true })

// Full visual release audit: all public, institutional and SEO routes at each viewport.
const allRoutes = [
  ['home', '/'],
  ...PUBLIC_PAGES.map((page) => [page.slug, '/' + page.slug + '/']),
  ...SEO_PAGES.map((page) => [page.slug, '/' + page.slug + '/']),
]

// Every page must have a desktop screenshot, not only main navigation routes.
const desktopRoutes = allRoutes

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

    // content-visibility:auto economiza renderização no site, mas deixa áreas
    // vazias em screenshots fullPage do Playwright. Só no navegador de QA,
    // forçamos a pintura de todos os modelos antes de fotografar.
    if (id === 'modelos') {
      await page.addStyleTag({ content: '.model-showcase-card { content-visibility: visible !important; contain-intrinsic-size: auto !important; }' })
      await page.evaluate(async () => {
        await document.fonts.ready
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      })
    }

    // Rotas editoriais devem ter CSS carregado, não só HTML hidratado.
    // Se houver regressão real, o diagnóstico abaixo registrará cada estilo.
    if (id === 'guias-para-varejo') {
      await page.waitForFunction(() => {
        const grid = document.querySelector('.retail-guide-card-grid')
        const card = document.querySelector('.retail-guide-catalog-card')
        return grid && card && getComputedStyle(grid).display === 'grid' && getComputedStyle(card).display === 'flex'
      }, null, { timeout: 6000 }).catch(() => {})
    }

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

      const retailIntroCards = [...document.querySelectorAll('.retail-guide-intro-card')]
      const retailCatalogCards = [...document.querySelectorAll('.retail-guide-catalog-card')]
      const retailGuideShowMore = document.querySelector('.retail-guide-show-more')
      const retailGuideCardsFit = [...retailIntroCards, ...retailCatalogCards].every((card) => {
        const rect = card.getBoundingClientRect()
        const parent = card.parentElement?.getBoundingClientRect()
        return Boolean(parent && rect.width > 0 && rect.left >= parent.left - 2 && rect.right <= parent.right + 2)
      })
      const retailGuideNoEmptyColumns = window.innerWidth <= 650 || retailCatalogCards.length <= 1 ||
        Math.abs(retailCatalogCards[0].getBoundingClientRect().top - retailCatalogCards[1].getBoundingClientRect().top) < 2

      // Um catálogo sem CSS pode passar nos testes de DOM, mas aparece como texto puro.
      const retailPaperLink = document.querySelector('.retail-guide-paper-link')
      const retailCardGrid = document.querySelector('.retail-guide-card-grid')
      const retailGuideSearch = document.querySelector('.retail-guide-search')
      const retailCategoryButton = document.querySelector('.retail-guide-categories button')
      const retailGuideComputed = {
        paperLink: retailPaperLink ? getComputedStyle(retailPaperLink).display : null,
        grid: retailCardGrid ? getComputedStyle(retailCardGrid).display : null,
        search: retailGuideSearch ? getComputedStyle(retailGuideSearch).display : null,
        categoryButton: retailCategoryButton ? getComputedStyle(retailCategoryButton).display : null,
        card: retailCatalogCards[0] ? getComputedStyle(retailCatalogCards[0]).display : null,
      }
      const retailGuideStylesApplied = retailGuideComputed.paperLink === 'flex' &&
        retailGuideComputed.grid === 'grid' && retailGuideComputed.search === 'grid' &&
        ['flex', 'inline-flex'].includes(retailGuideComputed.categoryButton) &&
        retailGuideComputed.card === 'flex' &&
        retailCatalogCards.every((card) => getComputedStyle(card).display === 'flex')
      const modelCards = [...document.querySelectorAll('.model-showcase-card')]
      const modelVisualCount = modelCards.length
      const modelVisualReady = modelCards.every((card) => {
        const poster = card.querySelector('.model-real-poster-shell')
        return Boolean(poster && poster.getBoundingClientRect().height > 120 &&
          getComputedStyle(card).contentVisibility !== 'auto')
      })

      const guideCards = [...document.querySelectorAll('.format-guide-section [data-format-id]')]
      const guideFormatCounts = {
        A4X8: 8, A4X4: 4, A4X2_CIMA_BAIXO: 2, A4X2_INVERTIDO: 2,
        A4X2_APP: 2, A4: 1, A5: 1, A3: 1,
      }
      const formatGuideThumbnailsMatch = guideCards.length === 8 &&
        guideCards.every((card) => {
          const expected = guideFormatCounts[card.dataset.formatId]
          const miniatures = card.querySelectorAll('.oferta-format-mini')
          return expected && miniatures.length === expected &&
            Boolean(card.querySelector('.format-thumb .oferta-format-preview')) &&
            Boolean(card.querySelector('.format-card-action'))
        })
      const guideHeading = document.querySelector('.format-guide-heading h2')
      const guideHeadingCentered = guideHeading
        ? getComputedStyle(guideHeading).textAlign === 'center'
        : false

      const howTopicCards = [...document.querySelectorAll('.how-guide-section .store-use-topic')]
      const howTopicLinksValid = howTopicCards.length === 3 &&
        howTopicCards.every((card) => {
          const link = card.querySelector('a[href]')
          return Boolean(card.querySelector('h3')?.textContent?.trim()) &&
            Boolean(link && link.getAttribute('href')?.startsWith('/') && link.getAttribute('href') !== '/')
        }) &&
        new Set(howTopicCards.map((card) => card.querySelector('a')?.getAttribute('href'))).size === 3
      const howGuideCardsFit = howTopicCards.every((card) => {
        const parent = card.closest('.store-use-grid')?.getBoundingClientRect()
        const rect = card.getBoundingClientRect()
        return Boolean(parent && rect.left >= parent.left - 2 && rect.right <= parent.right + 2)
      })
      const howGuideCardsSameRow = howTopicCards.length === 3 &&
        howTopicCards.every((card) => Math.abs(card.getBoundingClientRect().top - howTopicCards[0].getBoundingClientRect().top) < 2)

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
      const adCandidate = document.querySelector('.format-home-refresh .format-ad-card')
      const candidateRect = adCandidate?.getBoundingClientRect()
      // Sem consentimento, AdUnit retorna null e o contêiner fica oculto (:empty).
      // getBoundingClientRect() de um elemento display:none devolve (0,0,0,0):
      // comparar esse top=0 com os cartões gera uma falsa sobreposição.
      const adRect = candidateRect && candidateRect.width > 1 && candidateRect.height > 1
        && getComputedStyle(adCandidate).display !== 'none' ? candidateRect : null
      const linksRect = document.querySelector('.format-home-refresh .format-trust-links')?.getBoundingClientRect()
      const lastCardBottom = formatCardRects.length ? Math.max(...formatCardRects.map((rect) => rect.bottom)) : null
      const adOverlapsFormats = Boolean(adRect && lastCardBottom !== null && adRect.top < lastCardBottom - 2)
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
        retailIntroCardCount: retailIntroCards.length,
        retailCatalogCardCount: retailCatalogCards.length,
        retailGuideShowMoreVisible: Boolean(retailGuideShowMore && retailGuideShowMore.getBoundingClientRect().height > 0),
        retailGuideCardsFit,
        retailGuideNoEmptyColumns,
        retailGuideStylesApplied,
        retailGuideComputed,
        modelVisualCount,
        modelVisualReady,
        howGuideCardCount: howTopicCards.length,
        howRedundantBenefitCards: document.querySelectorAll('.compact-info-grid article').length,
        howRetainsDraftHint: Boolean(document.querySelector('.how-retention-note')?.textContent?.includes('salvo neste dispositivo')),
        howTopicLinksValid,
        howGuideCardsFit,
        howGuideCardsSameRow,
        guideCardCount: guideCards.length,
        formatGuideThumbnailsMatch,
        guideHeadingCentered,
        appPreviewClipped,
        clippedFormatCards,
        formatCardsOverlap,
        formatCardHeights: formatCardRects.map((rect) => Number(rect.height.toFixed(1))),
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
    if (id === 'guias-para-varejo' && name === 'mobile-360') {
      await page.getByRole('button', { name: /Ver todos os guias/ }).click()
      const expandedCount = await page.locator('.retail-guide-catalog-card').count()
      if (expandedCount !== SEO_PAGES.length) {
        throw new Error('Expandir o catálogo não mostrou todos os guias: ' + expandedCount)
      }
      await page.getByRole('button', { name: /Mostrar menos guias/ }).click()
      if (await page.locator('.retail-guide-catalog-card').count() !== 6) {
        throw new Error('Recolher catálogo não restaurou os seis guias iniciais.')
      }
    }
    if (id === 'guias-para-varejo' && name === 'desktop') {
      await page.getByRole('button', { name: 'Setores', exact: true }).click()
      const filteredCategories = await page.locator('.retail-guide-card-category').allTextContents()
      if (!filteredCategories.length || filteredCategories.some((category) => category.trim() !== 'Setores')) {
        throw new Error('Filtrar por Setores deixou guias de outras categorias visíveis.')
      }
      await page.locator('.retail-guide-search input').fill('tema-sem-resultados-qa')
      await page.locator('.retail-guide-empty button').click()
      const restoredCards = await page.locator('.retail-guide-catalog-card').count()
      if (restoredCards !== SEO_PAGES.length) {
        throw new Error('Limpar filtros não restaurou todos os guias do catálogo.')
      }
    }
    if (id === 'qual-papel-usar-para-cartaz' && name === 'mobile-360') {
      const cards = page.locator('.paper-guide-mobile-format')
      if (await cards.count() !== 6) throw new Error('Guia mobile deve mostrar seis opções de papel e formato.')
      if (await page.locator('.paper-guide-table-wrap').isVisible()) throw new Error('Tabela horizontal ainda ocupa espaço na versão móvel.')
      await cards.first().locator('summary').click()
      if (!(await cards.first().locator('dd').first().isVisible())) {
        throw new Error('Cartão mobile não expande a descrição do formato.')
      }
    }
    if (id === 'formatos' && name === 'desktop') {
      await page.locator('.format-guide-section [data-format-id="A4X4"]').click()
      await page.locator('.editor-layout').waitFor({ state: 'visible', timeout: 10000 })
    }

    state.push({ route, id, viewport: name, errors, ignoredErrors, ...metrics })
  }

  await page.close()
}

await captureViewport('desktop', { width: 1440, height: 1000 }, desktopRoutes)
await captureViewport('desktop-760-draft', { width: 1600, height: 760 }, [['home', '/']])
await captureViewport('tablet-768', { width: 768, height: 1024 }, allRoutes)
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
  if (item.id === 'modelos' && (item.modelVisualCount !== 12 || !item.modelVisualReady)) return true
  if (item.id === 'guias-para-varejo' && (
    item.retailIntroCardCount !== 3 ||
    item.retailCatalogCardCount !== (item.width <= 650 ? Math.min(6, SEO_PAGES.length) : SEO_PAGES.length) ||
    (item.width <= 650 && SEO_PAGES.length > 6 && !item.retailGuideShowMoreVisible) ||
    !item.retailGuideCardsFit || !item.retailGuideNoEmptyColumns ||
    !item.retailGuideStylesApplied
  )) return true
  if (item.id === 'como-funciona' && (
    item.howGuideCardCount !== 3 || !item.howTopicLinksValid ||
    item.howRedundantBenefitCards !== 0 || !item.howRetainsDraftHint ||
    !item.howGuideCardsFit ||
    (item.viewport === 'desktop' && !item.howGuideCardsSameRow)
  )) return true
  if (item.id === 'formatos' && (
    item.guideCardCount !== 8 || !item.formatGuideThumbnailsMatch || !item.guideHeadingCentered
  )) return true
  if (item.id === 'home') {
    if (item.visibleFormatCards !== 8 || item.clippedFormatCards.length ||
        item.formatCardsOverlap || item.adOverlapsFormats || item.linksOverlapAd ||
        item.appPreviewClipped) return true
    if (item.viewport === 'desktop-760-draft' && !item.hasSavedDraft) return true
    if (item.viewport === 'mobile-360' && item.creatorGeometry.header?.height > 335) return true
    // A home alta deve usar o espaço vertical sem alongar os cartões excessivamente.
    if (item.viewport === 'desktop' &&
        item.formatCardHeights.some((height) => height < 220 || height > 290)) return true
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
