import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import PosterSheet from './components/posters/PosterSheet'
import PosterVisualQaPage from './pages/PosterVisualQaPage'
import { AdUnit, CreatorSeoHead, PublicPage, SeoLanding, getPublicPage, getSeoPage } from './components/SiteMarketing'
import { getPageCount, getPosterFormat, POSTER_FORMAT_OPTIONS } from './config/posterFormats'
import { getDefaultTemplateForFormat } from './config/posterTemplates'
import { createPosterLayouts } from './poster-engine/layoutPlan'
import { parseProductList } from './poster-engine/parseProduct'
import { createBrowserTextMeasure } from './utils/posterBrowserMeasure'
import { resolveReadableHeaderTextColor, resolveReadablePriceColor, resolveReadableTextColor } from './utils/posterColorContrast'

const HEADER_IMAGE_MODULES = import.meta.glob('../img/headers/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})

const HEADER_IMAGES = Object.entries(HEADER_IMAGE_MODULES)
  .map(([path, url]) => {
    const fileName = path.split('/').pop()
    const rawName = fileName.replace(/\.png$/i, '')
    const label = rawName
      .split(/[-_ ]+/)
      .map((word) => word ? word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1) : word)
      .join(' ')
    return { id: fileName, label, url }
  })
  .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))

const HEADER_IMAGE_BY_ID = Object.fromEntries(HEADER_IMAGES.map((item) => [item.id, item.url]))

const DEFAULT_HEADER_OPTION_ID = '__oferta__'
const HEADER_TEXT_PRESETS = [
  { id: DEFAULT_HEADER_OPTION_ID, kind: 'preset', label: 'Oferta clássica', text: 'OFERTA', headerColor: '#ed1c24', headerTextColor: '#ffffff', headerFooterStyle: 'moldura' },
  { id: '__imperdivel__', kind: 'preset', label: 'Oferta imperdível', text: 'OFERTA', headerColor: '#ed1c24', headerTextColor: '#ffffff', headerFooterStyle: 'imperdivel' },
  { id: '__promocao__', kind: 'preset', label: 'Hoje tem promoção', text: 'PROMOÇÃO', headerColor: '#ef3340', headerTextColor: '#ffffff', headerFooterStyle: 'promocao' },
  { id: '__oferta_do_dia__', kind: 'preset', label: 'Oferta do dia', text: 'OFERTA DO DIA', headerColor: '#ed1c24', headerTextColor: '#ffffff', headerFooterStyle: 'chevron' },
  { id: '__barato_todo_dia__', kind: 'preset', label: 'Barato todo dia', text: 'BARATO TODO DIA', headerColor: '#d4142d', headerTextColor: '#fff200', headerFooterStyle: 'ondas' },
  { id: '__curva__', kind: 'preset', label: 'Oferta curva', text: 'OFERTA', headerColor: '#ef3340', headerTextColor: '#ffffff', headerFooterStyle: 'curva-simples' },
  { id: '__divertida__', kind: 'preset', label: 'Oferta divertida', text: 'OFERTA', headerColor: '#ef3340', headerTextColor: '#ffffff', headerFooterStyle: 'divertido' },
  { id: '__amarela__', kind: 'preset', label: 'Oferta amarela', text: 'OFERTA', headerColor: '#ef3340', headerTextColor: '#fff200', headerFooterStyle: 'moldura' },
  { id: '__chevron__', kind: 'preset', label: 'Oferta chevron', text: 'OFERTA', headerColor: '#c80016', headerTextColor: '#ffffff', headerFooterStyle: 'chevron' },
  { id: '__contorno__', kind: 'preset', label: 'Oferta contorno', text: 'OFERTA', headerColor: '#ef3340', headerTextColor: '#ffffff', headerFooterStyle: 'minimal' },
  { id: '__oval__', kind: 'preset', label: 'Oferta oval', text: 'OFERTA', headerColor: '#c80016', headerTextColor: '#fff200', headerFooterStyle: 'oval' },
  { id: '__ondas__', kind: 'preset', label: 'Oferta ondas', text: 'OFERTA', headerColor: '#e7192d', headerTextColor: '#fff200', headerFooterStyle: 'ondas' },
  { id: '__super_oferta__', kind: 'preset', label: 'Super oferta', text: 'SUPER OFERTA', headerColor: '#d4142d', headerTextColor: '#fff200', headerFooterStyle: 'rodape-forte' },
  { id: '__oferta_relampago__', kind: 'preset', label: 'Oferta relâmpago', text: 'OFERTA RELÂMPAGO', headerColor: '#b60925', headerTextColor: '#ffffff', headerFooterStyle: 'chevron' },
  { id: '__preco_baixo__', kind: 'preset', label: 'Preço baixo', text: 'PREÇO BAIXO', headerColor: '#168451', headerTextColor: '#ffffff', headerFooterStyle: 'minimal' },
  { id: '__economia__', kind: 'preset', label: 'Economia', text: 'ECONOMIA', headerColor: '#0b7547', headerTextColor: '#fff200', headerFooterStyle: 'oval' },
  { id: '__fim_de_semana__', kind: 'preset', label: 'Fim de semana', text: 'FIM DE SEMANA', headerColor: '#1d63e9', headerTextColor: '#ffffff', headerFooterStyle: 'ondas' },
  { id: '__clube_ofertas__', kind: 'preset', label: 'Clube de ofertas', text: 'CLUBE DE OFERTAS', headerColor: '#113d9d', headerTextColor: '#ffffff', headerFooterStyle: 'moldura' },
]
const HEADER_OPTIONS = [
  ...HEADER_TEXT_PRESETS,
  ...HEADER_IMAGES.map((item) => ({ ...item, kind: 'image' })),
]

function normalizeHeaderImageId(value) {
  if (!value) return ''
  const base = String(value).replace(/\.png$/i, '')
  const normalized = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized ? normalized + '.png' : ''
}

const EXAMPLE_TEXT = [
  'Cerveja Heineken Long Neck 300ml 5,99',
  'Pão Francês kg 10,90',
  'Pão de queijo kg 20,90',
  'Arroz Tipo 1 5kg 24,90',
].join('\n')

const LEGACY_EXAMPLE_TEXTS = [
  [
    'Cerveja Heineken Long Neck 300ml 5,99',
    'Pão Francês kg 10,90',
    'Pão de queijo kg 20,90',
  ].join('\n'),
  EXAMPLE_TEXT,
]

const PRINT_STYLE_ID = 'ofertamatica-poster-page'
const PX_PER_MM = 96 / 25.4
const DRAFT_KEY = 'ofertamatica:draft:v1'
const LAST_FORMAT_KEY = 'ofertamatica:last-format'
const POSTER_STYLE_KEY = 'ofertamatica:poster-style:v1'
const POSTER_HEADER_KEY = 'ofertamatica:poster-header:v1'
const RECENT_HEADERS_KEY = 'ofertamatica:recent-headers:v1'
const EXAMPLE_USED_KEY = 'ofertamatica:example-used:v1'
const STORE_LOGO_KEY = 'ofertamatica:store-logo:v1'
const CUSTOM_HEADER_KEY = 'ofertamatica:custom-header:v1'
const RECENT_JOBS_KEY = 'ofertamatica:recent-jobs:v1'
const RETIRED_CONTENT_REDIRECTS = {
  '/cartaz-de-oferta-gratis': '/criador-de-cartaz-de-oferta/',
  '/cartaz-supermercado-online': '/cartaz-para-supermercado/',
  '/placa-de-preco-supermercado': '/cartaz-de-preco-online/',
  '/gerador-de-cartaz-com-ia': '/criador-de-cartaz-de-oferta/',
}


function trackProductEvent(event, details = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...details })
}

const DEFAULT_POSTER_STYLE = {
  backgroundColor: '#f5e66d',
  textColor: '#101010',
  priceColor: '#d91b2b',
  headerColor: '#e51e31',
  headerTextColor: '#ffffff',
  fontFamily: '"Burbank Big Cd Bk", Impact, "Arial Black", sans-serif',
  descriptionFontFamily: 'auto',
  priceFontFamily: '"Futura Price", Impact, "Arial Black", sans-serif',
  headerStyle: 'retail',
  headerText: 'OFERTA',
  headerImage: '',
  headerFooterStyle: 'moldura',
  showCurrency: true,
  offerMode: 'standard',
  validityText: '',
  limitText: '',
}

const HEADER_FOOTER_MODELS = [
  { id: 'moldura', name: 'Moldura clássica', note: 'Borda vermelha forte e placa de OFERTA no topo', preview: 'moldura', headerTextColor: '#ffffff' },
  { id: 'imperdivel', name: 'Oferta imperdível', note: 'OFERTA branca gigante com Imperdível sobreposto', preview: 'imperdivel', headerTextColor: '#ffffff' },
  { id: 'promocao', name: 'Hoje tem promoção', note: 'Topo vermelho com PROMOÇÃO e ponta central', preview: 'promocao', headerTextColor: '#ffffff' },
  { id: 'chevron', name: 'Chevron', note: 'Faixa reta com ponta central para baixo', preview: 'chevron', headerTextColor: '#ffffff' },
  { id: 'oval', name: 'Oferta oval', note: 'Curva ampla no topo com selo oval', preview: 'oval', headerTextColor: '#fff200' },
  { id: 'curva-simples', name: 'Curva simples', note: 'Topo vermelho curvo, inspirado em cartaz tradicional', preview: 'curva-simples', headerTextColor: '#ffffff' },
  { id: 'ondas', name: 'Ondas completa', note: 'Topo e rodapé com linhas duplas amarelas', preview: 'ondas', headerTextColor: '#fff200' },
  { id: 'rodape-forte', name: 'Topo + rodapé forte', note: 'Cabeçalho curvo e faixa vermelha grande no rodapé', preview: 'rodape-forte', headerTextColor: '#fff200' },
  { id: 'divertido', name: 'Oferta divertida', note: 'Topo ondulado com OFERTA! e destaque lateral', preview: 'divertido', headerTextColor: '#ffffff' },
  { id: 'minimal', name: 'Contorno arredondado', note: 'Header compacto, moldura discreta e rodapé ondulado', preview: 'minimal', headerTextColor: '#ffffff' },
  { id: 'especial', name: 'Oferta especial', note: 'Faixa lateral com escrita Especial', preview: 'especial', headerTextColor: '#fff200' },
]

const OFFER_MODES = [
  { id: 'standard', name: 'Padrão', note: 'Produto + preço' },
  { id: 'de-por', name: 'De / Por', note: 'Preço anterior + oferta' },
  { id: 'leve-por', name: 'Leve X por Y', note: 'Promoção por quantidade' },
  { id: 'atacado-varejo', name: 'Atacado / Varejo', note: 'Dois preços na placa' },
  { id: 'club-app', name: 'Clube / App', note: 'Preço exclusivo + normal' },
  { id: 'second-unit', name: '2ª unidade', note: 'Preço especial na segunda' },
  { id: 'near-expiry', name: 'Próximo à validade', note: 'Sinaliza venda rápida' },
  { id: 'last-units', name: 'Últimas unidades', note: 'Destaque para saldo final' },
]

function loadPosterStyle() {
  try {
    const saved = JSON.parse(localStorage.getItem(POSTER_STYLE_KEY) || 'null')
    if (!saved) return DEFAULT_POSTER_STYLE

    const legacyFrameMap = {
      'wave-top': 'curva-simples',
      'wave-both': 'ondas',
      framed: 'moldura',
      badge: 'minimal',
      clean: 'curva-simples',
    }
    const normalizedHeaderFooterStyle = legacyFrameMap[saved.headerFooterStyle] || saved.headerFooterStyle || DEFAULT_POSTER_STYLE.headerFooterStyle

    const storedHeader = saved.headerImage || localStorage.getItem(POSTER_HEADER_KEY) || ''
    const migratedHeader = storedHeader
      ? (HEADER_IMAGE_BY_ID[storedHeader]
        ? storedHeader
        : normalizeHeaderImageId(storedHeader))
      : ''

    const savedHeaderText = saved.headerText || DEFAULT_POSTER_STYLE.headerText
    const savedHeaderColor = String(saved.headerColor || DEFAULT_POSTER_STYLE.headerColor).toLocaleLowerCase('pt-BR')
    const savedHeaderTextColor = String(saved.headerTextColor || '').toLocaleLowerCase('pt-BR')
    const savedPriceColor = String(saved.priceColor || DEFAULT_POSTER_STYLE.priceColor).toLocaleLowerCase('pt-BR')
    const migrateLegacyDefaultHeader = (!saved.headerStyle || saved.headerStyle === 'band')
      && savedHeaderText === 'OFERTA'
      && savedHeaderColor === '#e51e31'
      && !migratedHeader
    const migrateLegacyRetailTextOnly = saved.headerStyle === 'retail'
      && (!savedHeaderTextColor || savedHeaderTextColor === savedPriceColor)

    return {
      ...DEFAULT_POSTER_STYLE,
      ...saved,
      descriptionFontFamily: (() => {
        const legacy = saved.descriptionFontFamily || saved.fontFamily || DEFAULT_POSTER_STYLE.descriptionFontFamily
        return legacy === '"Burbank Big Cd Bk", Impact, "Arial Black", sans-serif' ? 'auto' : legacy
      })(),
      priceFontFamily: saved.priceFontFamily || DEFAULT_POSTER_STYLE.priceFontFamily,
      textColor: resolveReadableTextColor(
        saved.backgroundColor || DEFAULT_POSTER_STYLE.backgroundColor,
        saved.textColor || DEFAULT_POSTER_STYLE.textColor,
      ),
      priceColor: resolveReadablePriceColor(
        saved.backgroundColor || DEFAULT_POSTER_STYLE.backgroundColor,
        saved.priceColor || DEFAULT_POSTER_STYLE.priceColor,
      ),
      headerStyle: migrateLegacyDefaultHeader ? 'retail' : (saved.headerStyle || DEFAULT_POSTER_STYLE.headerStyle),
      headerTextColor: resolveReadableHeaderTextColor(
        saved.headerColor || DEFAULT_POSTER_STYLE.headerColor,
        (migrateLegacyDefaultHeader || migrateLegacyRetailTextOnly)
          ? DEFAULT_POSTER_STYLE.headerTextColor
          : (saved.headerTextColor || DEFAULT_POSTER_STYLE.headerTextColor),
      ),
      headerFooterStyle: normalizedHeaderFooterStyle,
      headerImage: HEADER_IMAGE_BY_ID[migratedHeader] ? migratedHeader : '',
    }
  } catch {
    return DEFAULT_POSTER_STYLE
  }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw)
    if (!draft || !Array.isArray(draft.products)) return null

    // Migração: versões antigas iniciavam o editor com o exemplo já salvo como se fosse
    // um trabalho do usuário. Removemos apenas esse falso rascunho legado.
    const isLegacyExample = LEGACY_EXAMPLE_TEXTS.includes(String(draft.sourceText || '').trim())
      && localStorage.getItem(EXAMPLE_USED_KEY) !== '1'
    if (isLegacyExample) {
      localStorage.removeItem(DRAFT_KEY)
      return null
    }

    return draft
  } catch {
    return null
  }
}

function loadRecentHeaders() {
  try {
    const saved = JSON.parse(localStorage.getItem(RECENT_HEADERS_KEY) || '[]')
    if (!Array.isArray(saved)) return []
    return saved.filter((id) => HEADER_IMAGE_BY_ID[id]).slice(0, 6)
  } catch {
    return []
  }
}

function loadStoreLogo() {
  try {
    return localStorage.getItem(STORE_LOGO_KEY) || ''
  } catch {
    return ''
  }
}

function loadCustomHeader() {
  try {
    return localStorage.getItem(CUSTOM_HEADER_KEY) || ''
  } catch {
    return ''
  }
}

function loadRecentJobs() {
  try {
    const saved = JSON.parse(localStorage.getItem(RECENT_JOBS_KEY) || '[]')
    if (!Array.isArray(saved)) return []
    return saved
      .filter((item) => item && typeof item.sourceText === 'string' && item.sourceText.trim())
      .slice(0, 5)
  } catch {
    return []
  }
}

function saveRecentJob(sourceText, formatId, productCount) {
  const source = String(sourceText || '').trim()
  if (!source || source.length > 20000) return loadRecentJobs()

  const firstLine = source.split(/\r?\n/).find((line) => line.trim())?.trim() || 'Lista de produtos'
  const previous = loadRecentJobs().filter((item) => item.sourceText.trim() !== source)
  const next = [{
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    sourceText: source,
    formatId,
    productCount,
    label: firstLine.slice(0, 52),
    savedAt: Date.now(),
  }, ...previous].slice(0, 5)

  try {
    localStorage.setItem(RECENT_JOBS_KEY, JSON.stringify(next))
  } catch {
    // O histórico é apenas um atalho; o criador continua funcionando sem ele.
  }
  return next
}

function splitIntoPages(products, perPage) {
  if (!products.length) return [[]]
  return Array.from({ length: Math.ceil(products.length / perPage) }, (_, index) => (
    products.slice(index * perPage, (index + 1) * perPage)
  ))
}

function normalizeImportedPrice(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value.toFixed(2).replace('.', ',')
  return String(value || '').trim().replace(/^R\$\s*/i, '').replace(/^(\d+)\.(\d{2})$/, '$1,$2')
}

function normalizePrice(value) {
  const clean = String(value || '').trim().replace(/^R\$\s*/i, '').replace(/\s/g, '')
  if (!clean) return ''
  const br = clean.includes(',')
    ? clean.replace(/\./g, '').replace(',', '.')
    : clean
  const number = Number(br.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(number)
    ? number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(value || '').replace('.', ',')
}

function isHeaderRow(values) {
  const text = values.join(' ').toLocaleLowerCase('pt-BR')
  return /descri[cç][aã]o|produto|pre[cç]o|venda|gramatura|unidade/.test(text)
}

function spreadsheetRowsToSource(rows) {
  const contentRows = rows
    .map((row) => row.filter((value) => String(value ?? '').trim()))
    .filter((row) => row.length)
  const dataRows = isHeaderRow((contentRows[0] || []).map((value) => String(value).trim()))
    ? contentRows.slice(1)
    : contentRows

  return dataRows.map((row) => {
    if (row.length === 1) return String(row[0]).trim()
    const values = row.map((value) => String(value ?? '').trim())
    values[values.length - 1] = normalizeImportedPrice(row.at(-1))
    return values.join(' ')
  }).join('\n')
}

function applyAppDefaults(products, formatId) {
  if (formatId !== 'A4X2_APP') return products
  const template = getDefaultTemplateForFormat('A4X2_APP')
  return products.map((product) => ({
    ...product,
    validity: product.validity || template.appValidityText.replace(/^OFERTA VÁLIDA ATÉ\s*/i, ''),
    regularLabel: product.regularLabel || template.appRegularLabel,
    regularPrice: product.regularPrice || '',
  }))
}

function productIdentity(product) {
  return [
    product.description,
    product.subdescription,
    product.complement,
    product.unit,
  ].map((value) => String(value || '').trim().toLocaleUpperCase('pt-BR')).join('|')
}

function preservePromotionFields(nextProducts, previousProducts) {
  const previousByIdentity = new Map(
    previousProducts
      .map((product) => [productIdentity(product), product])
      .filter(([identity]) => identity.replace(/\|/g, '')),
  )

  return nextProducts.map((product) => {
    const previous = previousByIdentity.get(productIdentity(product))
    if (!previous) return product

    return {
      ...product,
      regularPrice: previous.regularPrice || product.regularPrice || '',
      regularLabel: previous.regularLabel || product.regularLabel || '',
      validity: previous.validity || product.validity || '',
      offerQuantity: previous.offerQuantity || '',
      eachPrice: previous.eachPrice || '',
      wholesalePrice: previous.wholesalePrice || '',
      wholesaleQuantity: previous.wholesaleQuantity || '',
      secondUnitPrice: previous.secondUnitPrice || '',
    }
  })
}

function applyPrintPage(format) {
  let style = document.getElementById(PRINT_STYLE_ID)
  if (!style) {
    style = document.createElement('style')
    style.id = PRINT_STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = '@page { size: ' + format.widthMm + 'mm ' + format.heightMm + 'mm; margin: 0; }'
  document.body.classList.add('poster-printing')
}

function clearPrintPage() {
  document.getElementById(PRINT_STYLE_ID)?.remove()
  document.body.classList.remove('poster-printing')
}

function Brand() {
  return (
    <a className="brand" href="/" aria-label="Ofertamática">
      <span className="brand-mark"><i>✓</i></span>
      <span>Ofertamática</span>
    </a>
  )
}

function Navigation({ routePath, screen, onInstall }) {
  const cleanPath = String(routePath || '/').replace(/\/+$/, '') || '/'
  const links = [
    ['/', 'Criar placas', 'Criar'],
    ['/modelos', 'Modelos', 'Modelos'],
    ['/formatos', 'Formatos', 'Formatos'],
    ['/como-funciona', 'Como funciona', 'Como'],
    ['/guias-para-varejo', 'Guias para varejo', 'Guias'],
  ]

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Brand />
        <nav className="main-nav" aria-label="Navegação principal">
          {links.map(([href, label, mobileLabel]) => {
            const active = cleanPath === href || (label === 'Criar placas' && screen === 'editor')
            const target = href === '/' ? '/' : href + '/'
            return (
              <a
                className={'nav-link ' + (active ? 'active' : '')}
                href={target}
                key={href}
                aria-current={active ? 'page' : undefined}
              >
                <span className="nav-label-full">{label}</span>
                <span className="nav-label-mobile">{mobileLabel}</span>
              </a>
            )
          })}
        </nav>
        <div className={'nav-meta ' + (onInstall ? 'has-install' : '')}>
          {onInstall ? <button type="button" className="install-app-button" onClick={onInstall}>Instalar app</button> : null}
          <span className="free-pill">Grátis</span>
          <span className="nav-note">sem cadastro</span>
        </div>
      </div>
    </header>
  )
}

function FormatPreview({ format }) {
  const isSplit = format.postersPerSheet === 2 && format.rows === 2
  const isApp = format.specialLayout === 'app-offer'
  const isFour = format.postersPerSheet === 4
  const isEight = format.postersPerSheet === 8

  return (
    <div className="format-thumb">
      <div className={`oferta-format-preview ${isSplit ? 'is-split' : ''} ${isApp ? 'is-app' : ''} ${isFour ? 'is-four' : ''} ${isEight ? 'is-eight' : ''}`}>
        {Array.from({ length: format.postersPerSheet }, (_, index) => (
          <div className={`oferta-format-mini ${format.invertedSlots.includes(index) ? 'is-inverted' : ''}`} key={index}>
            <span>OFERTA</span>
            <i></i>
            <b><small>R$</small><em>4,99</em></b>
          </div>
        ))}
      </div>
    </div>
  )
}

function FormatChooser({ onSelect, draft, onResume }) {
  const lastFormatId = (() => {
    try {
      return localStorage.getItem(LAST_FORMAT_KEY) || ''
    } catch {
      return ''
    }
  })()

  return (
    <main className="format-page" id="formatos">
      <section className="format-dialog">
        <header className="format-dialog-head format-dialog-head-clean">
          <span className="eyebrow two-click-kicker">CARTAZ DE OFERTA PRONTO EM 2 CLIQUES</span>
          <h1>Escolha o tamanho da sua placa.</h1>
          <p>Do A7 para gôndola ao A3 para vitrine: escolha o formato, cole sua lista e gere tudo de uma vez.</p>
          <div className="format-trust-row" aria-label="Vantagens do Ofertamática">
            <span>✓ Grátis e sem cadastro</span>
            <span>✓ Lista, Excel, CSV ou TXT</span>
            <span>✓ PDF e impressão no tamanho físico</span>
          </div>
          <div className="format-size-guide" aria-label="Guia rápido de tamanhos">
            <span><b>A7 / A6</b><small>Gôndola · economiza papel</small></span>
            <span><b>A5 / A4</b><small>Balcão · ponta · ilha</small></span>
            <span><b>A3</b><small>Vitrine · leitura à distância</small></span>
          </div>
        </header>

        {draft?.products?.length ? (
          <div className="resume-work">
            <div>
              <span>TRABALHO SALVO NESTE DISPOSITIVO</span>
              <strong>{draft.products.length} {draft.products.length === 1 ? 'produto' : 'produtos'} · {getPosterFormat(draft.formatId).shortLabel}</strong>
            </div>
            <button type="button" onClick={onResume}>Continuar último trabalho</button>
          </div>
        ) : null}

        <div className="format-grid">
          {POSTER_FORMAT_OPTIONS.filter((format) => format.id !== 'SRA3').map((format) => (
            <button
              className={'format-choice ' + (format.id === 'A4X4' ? 'is-recommended ' : '') + (format.id === lastFormatId ? 'is-last-used' : '')}
              type="button"
              key={format.id}
              data-format-id={format.id}
              onClick={() => onSelect(format.id)}
              aria-label={'Escolher ' + format.label + ', ' + format.application}
            >
              <span className="format-choice-badges">
                {format.id === 'A4X8' ? <span className="format-economy">Economiza papel</span> : null}
                {format.id === 'A4X4' ? <span className="format-recommended">Mais usado</span> : null}
                {format.id === 'A3' ? <span className="format-impact">Mais impacto</span> : null}
                {format.id === lastFormatId ? <span className="format-last-used">Último usado</span> : null}
              </span>
              <FormatPreview format={format} />
              <span className="format-copy">
                <strong>{format.label}</strong>
                <small>{format.description}</small>
                <span className="format-meta">{format.paperLabel} · {format.orientationLabel}</span>
                <span className="format-use">{format.application}</span>
                <b>{format.pickerBadge}</b>
              </span>
            </button>
          ))}
          <aside className="format-ad-card" aria-label="Publicidade">
            <AdUnit placement="format-grid" />
          </aside>
        </div>
        <nav className="format-trust-links" aria-label="Atalhos e informações">
          <a href="/modelos/">Ver modelos</a>
          <a href="/como-funciona/">Como funciona</a>
          <a href="/guias-para-varejo/">Guias</a>
          <a href="/fale-conosco/">Ajuda</a>
          <a href="/privacidade/">Privacidade</a>
          <a href="/termos/">Termos</a>
        </nav>
      </section>
    </main>
  )
}

function PosterViewport({ format, products, template, layoutPlans, selectedProductId, onSelectProduct, className = '' }) {
  const hostRef = useRef(null)
  const [scale, setScale] = useState(0.25)

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    const resize = () => {
      const rect = host.getBoundingClientRect()
      const naturalWidth = format.widthMm * PX_PER_MM
      const naturalHeight = format.heightMm * PX_PER_MM
      const widthScale = Math.max(0.08, (rect.width - 18) / naturalWidth)
      const heightScale = Math.max(0.08, (rect.height - 18) / naturalHeight)
      const next = Math.min(widthScale, heightScale, 1)
      setScale(Number.isFinite(next) ? next : 0.25)
    }

    resize()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    return () => observer.disconnect()
  }, [format.heightMm, format.widthMm])

  const naturalWidth = format.widthMm * PX_PER_MM
  const naturalHeight = format.heightMm * PX_PER_MM

  return (
    <div ref={hostRef} className={'preview-stage real-poster-preview ' + className}>
      <div className="real-poster-stage" style={{ width: naturalWidth * scale, height: naturalHeight * scale }}>
        <div className="real-poster-scale" style={{ width: naturalWidth, height: naturalHeight, transform: 'scale(' + scale + ')' }}>
          <PosterSheet
            format={format}
            products={products}
            template={template}
            layoutPlans={layoutPlans}
            showBackground
            selectedProductId={selectedProductId}
            onSelectProduct={onSelectProduct}
          />
        </div>
      </div>
    </div>
  )
}

function ReviewDialog({ format, products, pageCount, warnings, onClose, onPrint, intent = 'print' }) {
  const savingPdf = intent === 'pdf'
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
        <header>
          <div>
            <span className="section-label">{savingPdf ? 'SALVAR COMO PDF' : 'REVISÃO DE IMPRESSÃO'}</span>
            <h2 id="review-title">{savingPdf ? 'Confira antes de gerar o PDF' : 'Confira antes de imprimir'}</h2>
          </div>
          <button type="button" className="review-close" onClick={onClose} aria-label="Fechar revisão">×</button>
        </header>

        <div className="review-summary">
          <article><small>Produtos</small><strong>{products.length}</strong></article>
          <article><small>Folhas</small><strong>{pageCount}</strong></article>
          <article><small>Formato</small><strong>{format.shortLabel}</strong></article>
          <article><small>Papel</small><strong>{format.paper}</strong></article>
        </div>

        <div className="review-format-details">
          <strong>{format.paperLabel}</strong>
          <span>Cartaz final: {format.cartSize}</span>
          <span>Orientação: {format.orientationLabel}</span>
          <span>{format.postersPerSheet} {format.postersPerSheet === 1 ? 'cartaz' : 'cartazes'} por folha</span>
        </div>

        {warnings.length ? (
          <div className="review-warnings" role="alert">
            <strong>Revise estes pontos</strong>
            {warnings.map((warning) => <span key={warning}>• {warning}</span>)}
          </div>
        ) : (
          <div className="review-ok">✓ Produtos com preço preenchido e prontos para revisão visual.</div>
        )}

        <div className="print-guidance">
          <strong>{savingPdf ? 'Na janela que abrir' : 'Na janela de impressão'}</strong>
          {savingPdf ? <span>Escolha <b>Salvar como PDF</b> como destino da impressão.</span> : null}
          <span>Use escala de <b>100%</b> e evite “Ajustar à página”.</span>
          <span>Selecione papel <b>{format.paper}</b> e orientação <b>{format.orientationLabel}</b>.</span>
          <span>Desative cabeçalhos e rodapés do navegador para não aparecer URL/data na folha.</span>
          {format.paper === 'A3' ? <span className="print-alert">Este trabalho usa tamanho A3; o PDF manterá o tamanho físico configurado.</span> : null}
        </div>

        <footer>
          <button type="button" className="quiet-button review-back" onClick={onClose}>Voltar e corrigir</button>
          <button type="button" className="generate-button review-print" onClick={onPrint}>
            {savingPdf ? 'Abrir para salvar PDF' : 'Imprimir agora'}
          </button>
        </footer>
      </section>
    </div>
  )
}

function PosterOptionPreview({
  frame = 'moldura',
  headerText = 'OFERTA',
  headerColor = '#ed1c24',
  headerTextColor = '#ffffff',
  imageUrl = '',
}) {
  return (
    <span
      className={`poster-option-preview poster-option-preview-${frame}`}
      aria-hidden="true"
      style={{
        '--option-header': headerColor,
        '--option-header-text': headerTextColor,
      }}
    >
      <span className="poster-option-preview-head">
        {imageUrl
          ? <img src={imageUrl} alt="" loading="lazy" />
          : <b>{headerText || 'OFERTA'}</b>}
      </span>
      <span className="poster-option-preview-copy"><i /><i /></span>
      <strong><small>R$</small> 9,99</strong>
      <em />
    </span>
  )
}

function StyleSidebar({
  style, onChange, onReset, mobileActive, isAppFormat = false,
  storeLogo = '', onStoreLogoChange, customHeader = '', onCustomHeaderChange,
}) {
  const [headerSearch, setHeaderSearch] = useState('')
  const [offerDetailsOpen, setOfferDetailsOpen] = useState(() => Boolean(style.validityText || style.limitText || style.offerMode === 'near-expiry'))
  const [logoError, setLogoError] = useState('')
  const [customHeaderError, setCustomHeaderError] = useState('')
  const logoInputRef = useRef(null)
  const customHeaderInputRef = useRef(null)
  const [headerLimit, setHeaderLimit] = useState(8)
  const [recentHeaderIds, setRecentHeaderIds] = useState(loadRecentHeaders)
  const normalizedSearch = headerSearch.trim().toLocaleLowerCase('pt-BR')
  const filteredHeaders = normalizedSearch
    ? HEADER_OPTIONS.filter((item) => item.label.toLocaleLowerCase('pt-BR').includes(normalizedSearch))
    : HEADER_OPTIONS
  const visibleHeaders = filteredHeaders.slice(0, headerLimit)
  const selectedOfferMode = OFFER_MODES.find((mode) => mode.id === (style.offerMode || 'standard')) || OFFER_MODES[0]
  const recentHeaders = recentHeaderIds
    .map((id) => HEADER_IMAGES.find((item) => item.id === id))
    .filter(Boolean)

  function chooseHeader(id) {
    onCustomHeaderChange?.('')
    const option = HEADER_OPTIONS.find((item) => item.id === id)

    if (option?.kind === 'preset') {
      onChange({
        ...style,
        headerImage: '',
        headerStyle: option.headerStyle || 'retail',
        headerText: option.text,
        headerColor: option.headerColor,
        headerTextColor: option.headerTextColor,
        headerFooterStyle: option.headerFooterStyle || style.headerFooterStyle,
      })
      trackProductEvent('ofertamatica_header_preset_selected', { header_id: option.id })
      return
    }

    if (!HEADER_IMAGE_BY_ID[id]) return
    onChange({ ...style, headerImage: id })
    const next = [id, ...recentHeaderIds.filter((current) => current !== id)].slice(0, 6)
    setRecentHeaderIds(next)
    try {
      localStorage.setItem(RECENT_HEADERS_KEY, JSON.stringify(next))
    } catch {
      // A seleção continua funcionando mesmo sem armazenamento local.
    }
  }

  function handleStoreLogo(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      setLogoError('Use PNG, JPG ou WebP.')
      return
    }

    if (file.size > 1024 * 1024) {
      setLogoError('A logo deve ter no máximo 1 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : ''
      if (!value) return
      setLogoError('')
      onStoreLogoChange?.(value)
      trackProductEvent('ofertamatica_store_logo_added', { file_type: file.type })
    }
    reader.onerror = () => setLogoError('Não foi possível ler esta imagem.')
    reader.readAsDataURL(file)
  }

  function handleCustomHeader(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      setCustomHeaderError('Use PNG, JPG ou WebP.')
      return
    }

    if (file.size > 1024 * 1024) {
      setCustomHeaderError('O header deve ter no máximo 1 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : ''
      if (!value) return
      setCustomHeaderError('')
      onChange({ ...style, headerImage: '' })
      onCustomHeaderChange?.(value)
      trackProductEvent('ofertamatica_custom_header_added', { file_type: file.type })
    }
    reader.onerror = () => setCustomHeaderError('Não foi possível ler esta imagem.')
    reader.readAsDataURL(file)
  }

  const colorFields = [
    ['backgroundColor', 'Fundo'],
    ['textColor', 'Texto'],
    ['priceColor', 'Preço'],
    ['headerColor', 'Cabeçalho'],
  ]

  return (
    <aside className={'style-sidebar ' + (mobileActive ? 'mobile-panel-active' : 'mobile-panel-hidden')} aria-label="Personalização da placa">
      <header className="style-sidebar-head">
        <div>
          <span className="section-label">PERSONALIZAÇÃO</span>
          <h2>Estilo da placa</h2>
        </div>
        <button type="button" className="style-reset-top" onClick={onReset}>Restaurar</button>
      </header>

      <div className="style-sidebar-scroll">
        {!isAppFormat ? (
          <section className="style-section offer-mode-section compact-offer-section">
            <div className="style-section-title-row">
              <strong>Tipo de oferta</strong>
              <small>Opcional</small>
            </div>
            <label className="offer-mode-select-row">
              <select
                value={style.offerMode || 'standard'}
                onChange={(event) => {
                  const offerMode = event.target.value
                  onChange({ ...style, offerMode })
                  if (offerMode === 'near-expiry') setOfferDetailsOpen(true)
                  trackProductEvent('ofertamatica_offer_mode_selected', { offer_mode: offerMode })
                }}
                aria-label="Tipo de oferta"
              >
                {OFFER_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>{mode.name}</option>
                ))}
              </select>
              <small>{selectedOfferMode.note}</small>
            </label>

            <details
              className="offer-details-disclosure"
              open={offerDetailsOpen}
              onToggle={(event) => setOfferDetailsOpen(event.currentTarget.open)}
            >
              <summary>Validade e limite <span>opcional</span></summary>
              <div className="offer-details-compact">
                <label className="style-text-row">
                  <span>Validade</span>
                  <input
                    type="text"
                    maxLength="36"
                    value={style.validityText || ''}
                    placeholder="Ex.: Válido até 06/10"
                    onChange={(event) => onChange({ ...style, validityText: event.target.value.toLocaleUpperCase('pt-BR') })}
                  />
                </label>
                <label className="style-text-row">
                  <span>Limite por cliente</span>
                  <input
                    type="text"
                    maxLength="44"
                    value={style.limitText || ''}
                    placeholder="Ex.: Limite 6 un. por cliente"
                    onChange={(event) => onChange({ ...style, limitText: event.target.value.toLocaleUpperCase('pt-BR') })}
                  />
                </label>
              </div>
            </details>
          </section>
        ) : null}


        <details className="style-section style-accordion">
          <summary>Cores</summary>
          <div className="style-color-list">
            {colorFields.map(([field, label]) => (
              <label className="style-color-row" key={field}>
                <span>{label}</span>
                <span className="style-color-control">
                  <input
                    type="color"
                    value={style[field]}
                    onChange={(event) => {
                      const value = event.target.value
                      if (field === 'backgroundColor') {
                        onChange({
                          ...style,
                          backgroundColor: value,
                          textColor: resolveReadableTextColor(value, style.textColor),
                          priceColor: resolveReadablePriceColor(value, style.priceColor),
                        })
                        return
                      }
                      onChange({ ...style, [field]: value })
                    }}
                    aria-label={'Cor de ' + label.toLocaleLowerCase('pt-BR')}
                  />
                  <code>{style[field].toUpperCase()}</code>
                </span>
              </label>
            ))}
          </div>
        </details>

        <details className="style-section style-accordion typography-section">
          <summary>Tipografia <small>descrição + preço</small></summary>
          <label className="style-select-row">
            <span>Fonte da descrição</span>
            <select
              value={style.descriptionFontFamily || DEFAULT_POSTER_STYLE.descriptionFontFamily}
              onChange={(event) => onChange({
                ...style,
                fontFamily: event.target.value === 'auto'
                  ? '"Burbank Big Cd Bk", Impact, "Arial Black", sans-serif'
                  : event.target.value,
                descriptionFontFamily: event.target.value,
              })}
            >
              <option value="auto">Varejo condensada · acentos automáticos</option>
              <option value={'"Burbank Big Cd Bk", Impact, "Arial Black", sans-serif'}>Varejo condensada · forçar fonte</option>
              <option value={'Impact, "Arial Black", sans-serif'}>Impact</option>
              <option value={'"Arial Black", Arial, sans-serif'}>Arial Black</option>
              <option value={'Arial, sans-serif'}>Arial</option>
            </select>
          </label>
          <label className="style-select-row">
            <span>Fonte do preço</span>
            <select
              value={style.priceFontFamily || DEFAULT_POSTER_STYLE.priceFontFamily}
              onChange={(event) => onChange({ ...style, priceFontFamily: event.target.value })}
            >
              <option value={'"Futura Price", Impact, "Arial Black", sans-serif'}>Futura preço</option>
              <option value={'"Burbank Big Cd Bk", Impact, "Arial Black", sans-serif'}>Varejo condensada</option>
              <option value={'Impact, "Arial Black", sans-serif'}>Impact</option>
              <option value={'"Arial Black", Arial, sans-serif'}>Arial Black</option>
            </select>
          </label>
          <p className="typography-help">O padrão usa a mesma combinação das placas de referência: descrição condensada e preço Futura.</p>
        </details>

        <details className="style-section style-accordion store-brand-section">
          <summary>Logo da loja <small>opcional</small></summary>
          <input
            ref={logoInputRef}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleStoreLogo}
          />
          {storeLogo ? (
            <div className="store-logo-preview">
              <img src={storeLogo} alt="Logo da loja" />
              <div>
                <b>Logo aplicada</b>
                <span>Ela aparecerá discretamente na placa.</span>
              </div>
              <button type="button" onClick={() => onStoreLogoChange?.('')}>Remover</button>
            </div>
          ) : (
            <button type="button" className="store-logo-upload" onClick={() => logoInputRef.current?.click()}>
              <span>＋</span>
              <b>Adicionar logo da loja</b>
              <small>PNG, JPG ou WebP · até 1 MB</small>
            </button>
          )}
          {logoError ? <p className="store-logo-error" role="alert">{logoError}</p> : null}
        </details>

        <section className="style-section header-library-section">
          <div className="style-section-title-row">
            <strong>Arte do cabeçalho</strong>
            <small>{HEADER_OPTIONS.length} opções + sua arte</small>
          </div>
          <div className="header-library-filter" aria-label="Filtro de artes">
            <span className="active">Todos</span>
          </div>

          <input
            ref={customHeaderInputRef}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleCustomHeader}
          />

          {customHeader ? (
            <div className="selected-header-preview custom-header-preview">
              <img src={customHeader} alt="Header personalizado" />
              <div>
                <strong>Header personalizado</strong>
                <button type="button" onClick={() => onCustomHeaderChange?.('')}>Remover</button>
              </div>
            </div>
          ) : style.headerImage ? (
            <div className="selected-header-preview">
              <img src={HEADER_IMAGE_BY_ID[style.headerImage]} alt="" />
              <div>
                <strong>{HEADER_IMAGES.find((item) => item.id === style.headerImage)?.label || 'Header selecionado'}</strong>
                <button type="button" onClick={() => chooseHeader(DEFAULT_HEADER_OPTION_ID)}>Usar padrão</button>
              </div>
            </div>
          ) : null}

          <button type="button" className="custom-header-upload" onClick={() => customHeaderInputRef.current?.click()}>
            <span>＋</span>
            <div>
              <b>{customHeader ? 'Trocar arte personalizada' : 'Usar minha própria arte'}</b>
              <small>PNG, JPG ou WebP · até 1 MB</small>
            </div>
          </button>
          {customHeaderError ? <p className="store-logo-error" role="alert">{customHeaderError}</p> : null}

          {recentHeaders.length ? (
            <div className="recent-headers">
              <span>Usados recentemente</span>
              <div>
                {recentHeaders.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={style.headerImage === item.id ? 'active' : ''}
                    onClick={() => chooseHeader(item.id)}
                    title={item.label}
                  >
                    <img src={item.url} alt="" loading="lazy" />
                    <small>{item.label}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <label className="header-search">
            <span>Buscar arte</span>
            <input
              type="search"
              value={headerSearch}
              onChange={(event) => {
                setHeaderSearch(event.target.value)
                setHeaderLimit(8)
              }}
              placeholder="Ex.: padaria, açougue..."
            />
          </label>

          <div className="header-art-grid">
            {visibleHeaders.map((item) => {
              const isPreset = item.kind === 'preset'
              const isActive = isPreset
                ? (!style.headerImage && !customHeader && style.headerText === item.text)
                : style.headerImage === item.id
              return (
                <button
                  type="button"
                  key={item.id}
                  className={isActive ? 'active' : ''}
                  onClick={() => chooseHeader(item.id)}
                  title={isPreset ? `${item.text} — cabeçalho pronto` : item.label}
                >
                  <PosterOptionPreview
                    frame={isPreset ? (item.headerFooterStyle || 'moldura') : 'moldura'}
                    headerText={isPreset ? item.text : 'OFERTA'}
                    headerColor={isPreset ? item.headerColor : '#ed1c24'}
                    headerTextColor={isPreset ? item.headerTextColor : '#ffffff'}
                    imageUrl={isPreset ? '' : item.url}
                  />
                  <span>{item.id === DEFAULT_HEADER_OPTION_ID ? 'Oferta (padrão)' : item.label}</span>
                </button>
              )
            })}
          </div>

          {!filteredHeaders.length ? <p className="header-empty">Nenhum header encontrado.</p> : null}
          {filteredHeaders.length > visibleHeaders.length ? (
            <button type="button" className="header-show-more" onClick={() => setHeaderLimit((value) => value + 8)}>
              Mostrar mais headers ({filteredHeaders.length - visibleHeaders.length})
            </button>
          ) : null}
        </section>

        <section className="style-section poster-frame-style-section">
          <div className="style-section-title-row">
            <strong>Header e rodapé</strong>
            <small>Inspirados nos modelos de cartaz</small>
          </div>
          <div className="poster-frame-style-grid">
            {HEADER_FOOTER_MODELS.map((model) => (
              <button
                type="button"
                key={model.id}
                className={style.headerFooterStyle === model.id ? 'active' : ''}
                onClick={() => {
                  onCustomHeaderChange?.('')
                  onChange({
                    ...style,
                    headerFooterStyle: model.id,
                    headerImage: '',
                    headerStyle: 'retail',
                    headerText: model.id === 'promocao' ? 'PROMOÇÃO' : 'OFERTA',
                    headerTextColor: model.headerTextColor || '#ffffff',
                  })
                  trackProductEvent('ofertamatica_header_footer_model_selected', { model_id: model.id })
                }}
                title={model.note}
              >
                <PosterOptionPreview
                  frame={model.preview}
                  headerText={model.id === 'promocao' ? 'PROMOÇÃO' : 'OFERTA'}
                  headerColor={style.headerColor || '#ed1c24'}
                  headerTextColor={model.headerTextColor || '#ffffff'}
                />
                <span>
                  <b>{model.name}</b>
                  <small>{model.note}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <details className="style-section style-accordion">
          <summary>Ajustes do cabeçalho</summary>
          <div className="header-style-switch">
            <button type="button" className={style.headerStyle === 'retail' ? 'active' : ''} onClick={() => onChange({ ...style, headerStyle: 'retail', headerTextColor: '#ffffff' })}>Varejo</button>
            <button type="button" className={style.headerStyle === 'band' ? 'active' : ''} onClick={() => onChange({ ...style, headerStyle: 'band', headerTextColor: '#ffffff' })}>Faixa</button>
            <button type="button" className={style.headerStyle === 'simple' ? 'active' : ''} onClick={() => onChange({ ...style, headerStyle: 'simple', headerTextColor: style.priceColor || '#d91b2b' })}>Simples</button>
            <button type="button" className={style.headerStyle === 'hidden' ? 'active' : ''} onClick={() => onChange({ ...style, headerStyle: 'hidden' })}>Ocultar</button>
          </div>

          <label className="style-text-row">
            <span>Texto</span>
            <input
              type="text"
              maxLength="24"
              value={style.headerText}
              disabled={style.headerStyle === 'hidden'}
              onChange={(event) => onChange({ ...style, headerText: event.target.value.toLocaleUpperCase('pt-BR') })}
            />
          </label>

          <label className="style-color-row">
            <span>Cor do texto</span>
            <span className="style-color-control">
              <input
                type="color"
                value={style.headerTextColor}
                onChange={(event) => onChange({ ...style, headerTextColor: event.target.value })}
                aria-label="Cor do texto do cabeçalho"
              />
              <code>{style.headerTextColor.toUpperCase()}</code>
            </span>
          </label>
        </details>

        <details className="style-section style-accordion">
          <summary>Preço</summary>
          <label className="style-toggle-row">
            <span><b>Mostrar R$</b><small>Exibir símbolo da moeda junto ao preço</small></span>
            <input type="checkbox" checked={style.showCurrency} onChange={(event) => onChange({ ...style, showCurrency: event.target.checked })} />
          </label>
        </details>

        <p className="style-save-note">As alterações ficam salvas automaticamente neste dispositivo.</p>
      </div>
    </aside>
  )
}

function Editor({
  formatId, sourceText, setSourceText, products, setProducts, selectedProductId,
  setSelectedProductId, pageIndex, setPageIndex, onChangeFormat,
}) {
  const [expanded, setExpanded] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewIntent, setReviewIntent] = useState('print')
  const [importError, setImportError] = useState('')
  const [clipboardError, setClipboardError] = useState('')
  const [draggingFile, setDraggingFile] = useState(false)
  const [fontReady, setFontReady] = useState(false)
  const [confirmExample, setConfirmExample] = useState(false)
  const [mobileTab, setMobileTab] = useState('products')
  const [deletedSnapshot, setDeletedSnapshot] = useState(null)
  const [inputMenuOpen, setInputMenuOpen] = useState(false)
  const [posterStyle, setPosterStyle] = useState(loadPosterStyle)
  const [storeLogo, setStoreLogo] = useState(loadStoreLogo)
  const [customHeader, setCustomHeader] = useState(loadCustomHeader)
  const [recentJobs, setRecentJobs] = useState(loadRecentJobs)
  const fileInput = useRef(null)
  const sourceInputRef = useRef(null)
  const inputMenuRef = useRef(null)
  const creatorStartedAt = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now())
  const firstGenerationTracked = useRef(false)

  const format = getPosterFormat(formatId)
  const baseTemplate = getDefaultTemplateForFormat(formatId)
  const template = useMemo(() => {
    const descriptionFontChoice = posterStyle.descriptionFontFamily || DEFAULT_POSTER_STYLE.descriptionFontFamily
    const descriptionFontFamily = descriptionFontChoice === 'auto' ? undefined : descriptionFontChoice
    const priceFontFamily = posterStyle.priceFontFamily || DEFAULT_POSTER_STYLE.priceFontFamily

    return {
      ...baseTemplate,
      textStyles: {
        ...baseTemplate.textStyles,
        description: { ...baseTemplate.textStyles.description, fontFamily: descriptionFontFamily },
        subdescription: { ...baseTemplate.textStyles.subdescription, fontFamily: descriptionFontFamily },
        complement: { ...baseTemplate.textStyles.complement, fontFamily: descriptionFontFamily },
        unit: { ...baseTemplate.textStyles.unit, fontFamily: descriptionFontFamily },
        price: { ...baseTemplate.textStyles.price, fontFamily: priceFontFamily },
        appTitle: { ...baseTemplate.textStyles.appTitle, fontFamily: descriptionFontFamily },
        appPrice: { ...baseTemplate.textStyles.appPrice, fontFamily: priceFontFamily },
        appValidity: { ...baseTemplate.textStyles.appValidity, fontFamily: descriptionFontFamily },
        appRegularLabel: { ...baseTemplate.textStyles.appRegularLabel, fontFamily: descriptionFontFamily },
        appRegularPrice: { ...baseTemplate.textStyles.appRegularPrice, fontFamily: priceFontFamily },
      },
      showCurrency: posterStyle.showCurrency,
      headerText: posterStyle.headerText || 'OFERTA',
      headerStyle: posterStyle.headerStyle,
      headerImage: customHeader || HEADER_IMAGE_BY_ID[posterStyle.headerImage] || '',
      headerFooterStyle: posterStyle.headerFooterStyle || 'curva-simples',
      offerMode: formatId === 'A4X2_APP' ? 'standard' : (posterStyle.offerMode || 'standard'),
      validityText: formatId === 'A4X2_APP' ? '' : (posterStyle.validityText || ''),
      limitText: formatId === 'A4X2_APP' ? '' : (posterStyle.limitText || ''),
      storeLogo,
    }
  }, [
    baseTemplate,
    formatId,
    posterStyle.showCurrency,
    posterStyle.headerText,
    posterStyle.headerStyle,
    posterStyle.headerImage,
    posterStyle.headerFooterStyle,
    posterStyle.offerMode,
    posterStyle.validityText,
    posterStyle.limitText,
    posterStyle.fontFamily,
    posterStyle.descriptionFontFamily,
    posterStyle.priceFontFamily,
    storeLogo,
    customHeader,
  ])

  const resolvedTextColor = resolveReadableTextColor(posterStyle.backgroundColor, posterStyle.textColor)
  const resolvedPriceColor = resolveReadablePriceColor(posterStyle.backgroundColor, posterStyle.priceColor)
  const resolvedHeaderTextColor = resolveReadableHeaderTextColor(posterStyle.headerColor, posterStyle.headerTextColor)

  const posterStyleVars = {
    '--poster-background': posterStyle.backgroundColor,
    '--poster-text-color': resolvedTextColor,
    '--poster-price-color': resolvedPriceColor,
    '--poster-header-color': posterStyle.headerColor,
    '--poster-header-text-color': resolvedHeaderTextColor,
    '--poster-font-family': posterStyle.descriptionFontFamily === 'auto'
      ? '"Burbank Big Cd Bk", Impact, "Arial Black", sans-serif'
      : (posterStyle.descriptionFontFamily || posterStyle.fontFamily),
    '--poster-description-font-family': posterStyle.descriptionFontFamily === 'auto'
      ? '"Burbank Big Cd Bk", Impact, "Arial Black", sans-serif'
      : (posterStyle.descriptionFontFamily || posterStyle.fontFamily),
    '--poster-price-font-family': posterStyle.priceFontFamily || DEFAULT_POSTER_STYLE.priceFontFamily,
  }

  useEffect(() => {
    try {
      if (storeLogo) localStorage.setItem(STORE_LOGO_KEY, storeLogo)
      else localStorage.removeItem(STORE_LOGO_KEY)
    } catch {
      // A logo continua aplicada na sessão mesmo sem armazenamento local.
    }
  }, [storeLogo])

  useEffect(() => {
    try {
      if (customHeader) localStorage.setItem(CUSTOM_HEADER_KEY, customHeader)
      else localStorage.removeItem(CUSTOM_HEADER_KEY)
    } catch {
      // O header personalizado continua aplicado durante a sessão.
    }
  }, [customHeader])

  useEffect(() => {
    try {
      localStorage.setItem(POSTER_STYLE_KEY, JSON.stringify(posterStyle))
      if (posterStyle.headerImage) {
        localStorage.setItem(POSTER_HEADER_KEY, posterStyle.headerImage)
      } else {
        localStorage.removeItem(POSTER_HEADER_KEY)
      }
    } catch {
      // Personalização continua funcionando mesmo sem armazenamento local.
    }
  }, [posterStyle])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(min-width: 821px)').matches) {
      window.requestAnimationFrame(() => sourceInputRef.current?.focus())
    }
  }, [])

  useEffect(() => {
    function closeInputMenu(event) {
      if (inputMenuRef.current && !inputMenuRef.current.contains(event.target)) setInputMenuOpen(false)
    }
    function closeInputMenuOnEscape(event) {
      if (event.key === 'Escape') setInputMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeInputMenu)
    document.addEventListener('keydown', closeInputMenuOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeInputMenu)
      document.removeEventListener('keydown', closeInputMenuOnEscape)
    }
  }, [])

  useEffect(() => {
    let active = true
    if (!document.fonts) return undefined
    Promise.all([
      document.fonts.load('16px "Burbank Big Cd Bk"'),
      document.fonts.load('16px "Futura Price"'),
    ]).then(() => {
      if (active) {
        setFontReady(
          document.fonts.check('16px "Burbank Big Cd Bk"') &&
          document.fonts.check('16px "Futura Price"'),
        )
      }
    }).catch(() => {
      if (active) setFontReady(false)
    })
    return () => { active = false }
  }, [])

  const measure = useMemo(() => createBrowserTextMeasure(), [fontReady])
  const sourceProductCount = useMemo(() => parseProductList(sourceText).length, [sourceText])
  const layoutPlans = useMemo(() => createPosterLayouts(products, template, format, measure), [format, measure, products, template])
  const pages = useMemo(() => splitIntoPages(products, format.postersPerSheet), [format.postersPerSheet, products])
  const pageCount = getPageCount(products.length, format)
  const safePageIndex = Math.min(pageIndex, pageCount - 1)
  const pageProducts = pages[safePageIndex] || []
  const selected = products.find((item) => item.id === selectedProductId) || pageProducts[0] || products[0] || null
  const selectedIndex = selected ? products.findIndex((item) => item.id === selected.id) : -1
  const title = selected
    ? [selected.description, selected.subdescription, selected.complement, selected.unit].filter(Boolean).join(' ')
    : 'Sua prévia aparecerá aqui'
  const isAppFormat = formatId === 'A4X2_APP'
  const offerMode = isAppFormat ? 'standard' : (posterStyle.offerMode || 'standard')
  const mainPriceLabel = isAppFormat
    ? 'Preço App'
    : offerMode === 'de-por'
      ? 'Preço oferta'
      : offerMode === 'leve-por'
        ? 'Preço do combo'
        : offerMode === 'atacado-varejo'
          ? 'Preço varejo'
          : offerMode === 'club-app'
            ? 'Preço Clube / App'
            : offerMode === 'second-unit'
              ? '1ª unidade'
              : 'Preço'

  const standardFields = [
    ['description', 'Nome do produto'],
    ['subdescription', 'Marca / variante'],
    ['complement', 'Complemento'],
    ['unit', 'Peso / volume'],
    ['price', mainPriceLabel],
  ]
  const appFields = isAppFormat
    ? [...standardFields, ['validity', 'Validade'], ['regularPrice', 'Preço fora do App']]
    : standardFields

  const reviewWarnings = useMemo(() => {
    const warnings = []
    if (!fontReady) warnings.push('A tipografia da placa ainda está carregando; aguarde um instante antes de imprimir.')
    const noPrice = products.filter((product) => !String(product.price || '').trim()).length
    if (noPrice) warnings.push(`${noPrice} produto(s) sem preço informado.`)
    const noUnit = products.filter((product) => !String(product.unit || '').trim()).length
    if (noUnit) warnings.push(`${noUnit} produto(s) sem peso/volume; confirme se a oferta é por unidade.`)
    const veryLong = products.filter((product) => [product.description, product.subdescription, product.complement].filter(Boolean).join(' ').length > 55).length
    if (veryLong) warnings.push(`${veryLong} nome(s) longo(s); confira a legibilidade na prévia antes de imprimir.`)
    if (offerMode === 'de-por') {
      const missing = products.filter((product) => !String(product.regularPrice || '').trim()).length
      if (missing) warnings.push(`${missing} produto(s) sem preço anterior no modelo De / Por.`)
    }
    if (offerMode === 'leve-por') {
      const missing = products.filter((product) => !String(product.offerQuantity || '').trim()).length
      if (missing) warnings.push(`${missing} produto(s) sem quantidade no modelo Leve X por Y.`)
    }
    if (offerMode === 'atacado-varejo') {
      const missing = products.filter((product) => !String(product.wholesalePrice || '').trim()).length
      if (missing) warnings.push(`${missing} produto(s) sem preço de atacado.`)
      const missingQuantity = products.filter((product) => product.wholesalePrice && !String(product.wholesaleQuantity || '').trim()).length
      if (missingQuantity) warnings.push(`${missingQuantity} produto(s) com atacado sem quantidade mínima; confirme se a condição não exige volume.`)
    }
    if (offerMode === 'club-app') {
      const missing = products.filter((product) => !String(product.regularPrice || '').trim()).length
      if (missing) warnings.push(`${missing} produto(s) sem preço normal no modelo Clube / App.`)
    }
    if (offerMode === 'second-unit') {
      const missing = products.filter((product) => !String(product.secondUnitPrice || '').trim()).length
      if (missing) warnings.push(`${missing} produto(s) sem preço da 2ª unidade.`)
    }
    return warnings
  }, [fontReady, offerMode, products])

  function generateFromSource(nextSource = sourceText) {
    const parsed = preservePromotionFields(
      applyAppDefaults(parseProductList(nextSource), formatId).map((product) => ({
        ...product,
        price: normalizePrice(product.price),
        regularPrice: product.regularPrice ? normalizePrice(product.regularPrice) : '',
      })),
      products,
    )
    setProducts(parsed)
    setSelectedProductId(parsed[0]?.id || null)
    setPageIndex(0)

    if (parsed.length) {
      setRecentJobs(saveRecentJob(nextSource, formatId, parsed.length))
    }

    if (parsed.length && !firstGenerationTracked.current) {
      firstGenerationTracked.current = true
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      trackProductEvent('ofertamatica_first_generation', {
        format_id: formatId,
        product_count: parsed.length,
        time_to_first_generation_ms: Math.max(0, Math.round(now - creatorStartedAt.current)),
      })
    }
  }

  function changeProduct(id, field, value) {
    const priceFields = new Set(['price', 'regularPrice', 'eachPrice', 'wholesalePrice', 'secondUnitPrice'])
    setProducts((items) => items.map((item) => (
      item.id === id
        ? { ...item, [field]: priceFields.has(field) ? value : value.toLocaleUpperCase('pt-BR') }
        : item
    )))
  }

  function finishPrice(id, field, value) {
    setProducts((items) => items.map((item) => item.id === id ? { ...item, [field]: normalizePrice(value) } : item))
  }

  function selectProduct(product, index) {
    setSelectedProductId(product.id)
    setPageIndex(Math.floor(index / format.postersPerSheet))
  }

  function duplicateProduct(product, index) {
    const copy = {
      ...product,
      id: product.id + '-copy-' + Date.now(),
      sourceLine: product.sourceLine || '',
    }
    const next = [...products]
    next.splice(index + 1, 0, copy)
    setProducts(next)
    setSelectedProductId(copy.id)
    setPageIndex(Math.floor((index + 1) / format.postersPerSheet))
  }

  function deleteProduct(product, index) {
    setDeletedSnapshot({ product, index })
    const next = products.filter((item) => item.id !== product.id)
    setProducts(next)
    const fallbackIndex = Math.min(index, Math.max(0, next.length - 1))
    setSelectedProductId(next[fallbackIndex]?.id || null)
    setPageIndex(Math.floor(fallbackIndex / format.postersPerSheet))
  }

  function undoDelete() {
    if (!deletedSnapshot) return
    const next = [...products]
    next.splice(deletedSnapshot.index, 0, deletedSnapshot.product)
    setProducts(next)
    setSelectedProductId(deletedSnapshot.product.id)
    setPageIndex(Math.floor(deletedSnapshot.index / format.postersPerSheet))
    setDeletedSnapshot(null)
  }

  function moveProduct(index, direction) {
    const target = index + direction
    if (target < 0 || target >= products.length) return
    const next = [...products]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    setProducts(next)
    setSelectedProductId(item.id)
    setPageIndex(Math.floor(target / format.postersPerSheet))
  }

  async function pasteAndGenerate() {
    setClipboardError('')
    setImportError('')

    if (!navigator.clipboard?.readText) {
      setClipboardError('Seu navegador não liberou a leitura da área de transferência. Cole a lista no campo e use “Gerar placas”.')
      sourceInputRef.current?.focus()
      return
    }

    try {
      const clipboardText = await navigator.clipboard.readText()
      if (!clipboardText.trim()) {
        setClipboardError('A área de transferência está vazia. Copie sua lista de produtos e tente novamente.')
        sourceInputRef.current?.focus()
        return
      }

      setSourceText(clipboardText)
      setConfirmExample(false)
      generateFromSource(clipboardText)
      trackProductEvent('ofertamatica_clipboard_generate', {
        format_id: formatId,
        source_lines: clipboardText.split(/\r?\n/).filter((line) => line.trim()).length,
      })
    } catch {
      setClipboardError('Não foi possível acessar o conteúdo copiado. Cole a lista manualmente e use “Gerar placas”.')
      sourceInputRef.current?.focus()
    }
  }

  async function importProductFile(file, source = 'picker') {
    if (!file) return
    setImportError('')
    setClipboardError('')

    try {
      const extension = file.name.split('.').pop()?.toLocaleLowerCase('pt-BR')
      let importedSource = ''
      if (extension === 'txt') {
        importedSource = await file.text()
      } else if (extension === 'csv' || extension === 'xls' || extension === 'xlsx') {
        const XLSX = await import('@e965/xlsx')
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        importedSource = spreadsheetRowsToSource(XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: true, defval: '' }))
      } else {
        throw new Error('Formato não suportado. Use TXT, CSV, XLS ou XLSX.')
      }

      if (!importedSource.trim()) throw new Error('O arquivo não possui produtos para importar.')
      setSourceText(importedSource)
      setConfirmExample(false)
      generateFromSource(importedSource)
      trackProductEvent(source === 'drop' ? 'ofertamatica_drag_import' : 'ofertamatica_file_import', {
        format_id: formatId,
        file_extension: extension || 'unknown',
      })
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Não foi possível importar o arquivo.')
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0]
    await importProductFile(file, 'picker')
    event.target.value = ''
  }

  async function handleFileDrop(event) {
    event.preventDefault()
    setDraggingFile(false)
    const file = event.dataTransfer?.files?.[0]
    if (!file) return
    await importProductFile(file, 'drop')
  }

  function handleSourceShortcut(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      if (!sourceText.trim()) return
      generateFromSource()
      trackProductEvent('ofertamatica_keyboard_generate', {
        format_id: formatId,
        product_count: parseProductList(sourceText).length,
      })
    }
  }

  function useExample() {
    if (sourceText.trim() && sourceText.trim() !== EXAMPLE_TEXT.trim() && !confirmExample) {
      setConfirmExample(true)
      return false
    }
    setConfirmExample(false)
    try {
      localStorage.setItem(EXAMPLE_USED_KEY, '1')
    } catch {
      // O exemplo continua disponível mesmo sem armazenamento local.
    }
    setSourceText(EXAMPLE_TEXT)
    generateFromSource(EXAMPLE_TEXT)
    return true
  }

  function addProductLine() {
    setSourceText((value) => value + (value.endsWith('\n') || !value ? '' : '\n'))
    setInputMenuOpen(false)
  }

  function clearProductList() {
    setSourceText('')
    setProducts([])
    setClipboardError('')
    setSelectedProductId(null)
    setPageIndex(0)
    setConfirmExample(false)
    setInputMenuOpen(false)
  }

  function chooseExample() {
    const applied = useExample()
    if (applied) setInputMenuOpen(false)
  }

  function reuseRecentJob(job) {
    setSourceText(job.sourceText)
    setConfirmExample(false)
    setClipboardError('')
    setImportError('')
    generateFromSource(job.sourceText)
    setInputMenuOpen(false)
    trackProductEvent('ofertamatica_recent_job_reused', {
      original_format_id: job.formatId || 'unknown',
      current_format_id: formatId,
      product_count: job.productCount || 0,
    })
  }

  function clearRecentJobs() {
    try {
      localStorage.removeItem(RECENT_JOBS_KEY)
    } catch {
      // O estado em memória ainda pode ser limpo.
    }
    setRecentJobs([])
  }

  function movePage(direction) {
    const next = (() => {
      const candidate = safePageIndex + direction
      if (candidate < 0) return pageCount - 1
      if (candidate >= pageCount) return 0
      return candidate
    })()
    setPageIndex(next)
    setSelectedProductId(pages[next]?.[0]?.id || null)
  }

  useEffect(() => {
    function handleEditorShortcuts(event) {
      if (event.key === 'Escape') {
        if (reviewOpen) setReviewOpen(false)
        if (expanded) setExpanded(false)
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase('pt-BR') === 'p') {
        event.preventDefault()
        if (!products.length) {
          setImportError('Gere pelo menos uma placa antes de imprimir.')
          sourceInputRef.current?.focus()
          return
        }
        openPrintReview('keyboard', 'print')
        trackProductEvent('ofertamatica_keyboard_print_review', {
          format_id: format.id,
          product_count: products.length,
        })
      }
    }

    document.addEventListener('keydown', handleEditorShortcuts)
    return () => document.removeEventListener('keydown', handleEditorShortcuts)
  }, [expanded, reviewOpen, products.length, format.id])

  function openPrintReview(source = 'preview', intent = 'print') {
    setReviewIntent(intent)
    trackProductEvent(intent === 'pdf' ? 'ofertamatica_pdf_review' : 'ofertamatica_print_review', {
      source,
      format_id: format.id,
      product_count: products.length,
      page_count: pageCount,
    })
    setReviewOpen(true)
  }

  async function printPosters() {
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready
      } catch {
        // A impressão continua disponível mesmo se o navegador não expuser o estado final das fontes.
      }
    }

    trackProductEvent(reviewIntent === 'pdf' ? 'ofertamatica_pdf_started' : 'ofertamatica_print_started', {
      format_id: format.id,
      product_count: products.length,
      page_count: pageCount,
    })
    setReviewOpen(false)
    applyPrintPage(format)
    const cleanup = () => {
      clearPrintPage()
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    window.requestAnimationFrame(() => window.print())
  }

  return (
    <main className="editor-page" style={posterStyleVars}>
      <div className="editor-topline">
        <div className="editor-context">
          <strong>{format.shortLabel} · {products.length} {products.length === 1 ? 'produto' : 'produtos'}</strong>
          <span>Ajuste automático do texto e impressão no tamanho físico escolhido.</span>
          <em className={products.length ? 'two-click-result is-ready' : 'two-click-result'}>
            {products.length ? '✓ 2/2 · pronto para imprimir' : '2º clique · cole e gere'}
          </em>
        </div>
        <button className="change-format" type="button" onClick={onChangeFormat} title="Seus produtos serão preservados ao trocar o formato.">
          <span>{format.shortLabel}</span>
          <b>Alterar formato</b>
        </button>
      </div>

      <div className="mobile-editor-tabs" role="tablist" aria-label="Alternar área do editor">
        <button type="button" role="tab" data-mobile-tab="products" aria-selected={mobileTab === 'products'} className={mobileTab === 'products' ? 'active' : ''} onClick={() => setMobileTab('products')}>Produtos</button>
        <button type="button" role="tab" data-mobile-tab="preview" aria-selected={mobileTab === 'preview'} className={mobileTab === 'preview' ? 'active' : ''} onClick={() => setMobileTab('preview')}>Prévia</button>
        <button type="button" role="tab" data-mobile-tab="style" aria-selected={mobileTab === 'style'} className={mobileTab === 'style' ? 'active' : ''} onClick={() => setMobileTab('style')}>Estilo</button>
      </div>

      <section className="editor-layout">
        <div className={'editor-main ' + (mobileTab === 'products' ? 'mobile-panel-active' : 'mobile-panel-hidden')}>
          <section
            className={'editor-card quick-entry-card ' + (draggingFile ? 'is-file-dragging' : '')}
            onDragEnter={(event) => {
              if (event.dataTransfer?.types?.includes('Files')) {
                event.preventDefault()
                setDraggingFile(true)
              }
            }}
            onDragOver={(event) => {
              if (event.dataTransfer?.types?.includes('Files')) event.preventDefault()
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setDraggingFile(false)
            }}
            onDrop={handleFileDrop}
          >
            <header>
              <div>
                <span className="section-label">ENTRADA RÁPIDA</span>
                <h2>Cole seus produtos</h2>
                <p>Uma linha por produto. Ex.: Café 500 g 18,90 · Leite 1 L R$ 4,99. Cole do Excel ou arraste TXT, CSV, XLS e XLSX.</p>
              </div>
              <span className="format-chip">{format.cartSize} · {format.orientationLabel}</span>
            </header>

            <textarea
              ref={sourceInputRef}
              value={sourceText}
              placeholder={'Ex.:\nCerveja Heineken Long Neck 300ml 5,99\nPão Francês kg 10,90\nPão de queijo kg 20,90\nArroz Tipo 1 5kg 24,90'}
              onChange={(event) => {
                setSourceText(event.target.value)
                setConfirmExample(false)
                setClipboardError('')
              }}
              onKeyDown={handleSourceShortcut}
              aria-label="Lista de produtos, uma linha por produto"
            />

            <div className="editor-actions">
              <input ref={fileInput} hidden type="file" accept=".txt,.csv,.xls,.xlsx,text/plain,text/csv" onChange={(event) => { setInputMenuOpen(false); handleFile(event) }} />
              <div className="input-actions-menu-wrap" ref={inputMenuRef}>
                <button
                  className={`icon-button input-menu-trigger ${inputMenuOpen ? 'active' : ''}`}
                  type="button"
                  aria-label="Abrir ações de entrada"
                  aria-expanded={inputMenuOpen}
                  onClick={() => setInputMenuOpen((value) => !value)}
                >
                  ＋
                </button>

                {inputMenuOpen ? (
                  <div className="input-actions-menu" role="menu">
                    <button type="button" role="menuitem" onClick={addProductLine}>
                      <span className="input-menu-icon">＋</span>
                      <span><b>Adicionar produto</b><small>Nova linha para digitar</small></span>
                    </button>
                    <button type="button" role="menuitem" onClick={() => fileInput.current?.click()}>
                      <span className="input-menu-icon">↥</span>
                      <span><b>Importar arquivo</b><small>TXT, CSV ou Excel</small></span>
                    </button>
                    <button type="button" role="menuitem" className={confirmExample ? 'example-confirm-menu' : ''} onClick={chooseExample}>
                      <span className="input-menu-icon">✦</span>
                      <span><b>{confirmExample ? 'Confirmar exemplo' : 'Usar exemplo'}</b><small>{confirmExample ? 'Substitui o conteúdo atual' : 'Preencher uma lista pronta'}</small></span>
                    </button>
                    {recentJobs.length ? (
                      <div className="input-menu-recents">
                        <div className="input-menu-recents-head">
                          <span>Listas recentes</span>
                          <button type="button" onClick={clearRecentJobs}>Limpar</button>
                        </div>
                        {recentJobs.slice(0, 3).map((job) => (
                          <button type="button" role="menuitem" className="input-menu-recent-job" key={job.id} onClick={() => reuseRecentJob(job)}>
                            <span className="input-menu-icon">↺</span>
                            <span>
                              <b>{job.label}</b>
                              <small>{job.productCount || '?'} produtos · {job.formatId || 'formato salvo'}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <button type="button" role="menuitem" className="input-menu-danger" onClick={clearProductList}>
                      <span className="input-menu-icon">×</span>
                      <span><b>Limpar lista</b><small>Remover texto e produtos</small></span>
                    </button>
                  </div>
                ) : null}
              </div>

              <span className={'product-count ' + (sourceProductCount ? 'has-ready-products' : '')}>
                {sourceProductCount
                  ? sourceProductCount + ' ' + (sourceProductCount === 1 ? 'produto pronto' : 'produtos prontos') + ' para gerar'
                  : 'Cole sua lista para começar'}
              </span>
              <span className="keyboard-hint" aria-hidden="true">Ctrl+Enter gera · Ctrl+P imprime</span>
              {!sourceText.trim() && typeof navigator !== 'undefined' && navigator.clipboard?.readText ? (
                <button className="generate-button paste-generate-button" type="button" onClick={pasteAndGenerate}>
                  <span className="generate-step-badge">2</span>
                  Colar e gerar
                </button>
              ) : (
                <button className="generate-button" type="button" disabled={!sourceText.trim()} onClick={() => generateFromSource()}>
                  <span className="generate-step-badge">2</span>
                  Gerar placas
                </button>
              )}
            </div>
            {draggingFile ? <div className="drop-file-overlay" aria-hidden="true"><b>Solte para importar</b><span>TXT, CSV, XLS ou XLSX</span></div> : null}
            {confirmExample ? <div className="inline-warning">“Usar exemplo” substituirá o texto atual. Clique novamente para confirmar.</div> : null}
            {clipboardError ? <div className="oferta-import-error clipboard-error" role="alert">{clipboardError}</div> : null}
            {importError ? <div className="oferta-import-error" role="alert">{importError}</div> : null}
          </section>

          <section className="editor-card interpreted">
            <header>
              <div>
                <span className="section-label">PRODUTOS INTERPRETADOS</span>
                <h2>Revise os dados</h2>
                <p>Edite os campos abaixo. A prévia é atualizada automaticamente.</p>
              </div>
              <div className="interpreted-header-actions">
                {selected && selectedIndex >= 0 ? (
                  <div className="selected-product-tools" aria-label="Ações do produto selecionado">
                    <button type="button" onClick={() => moveProduct(selectedIndex, -1)} disabled={selectedIndex === 0} title="Mover para cima">↑</button>
                    <button type="button" onClick={() => moveProduct(selectedIndex, 1)} disabled={selectedIndex === products.length - 1} title="Mover para baixo">↓</button>
                    <button type="button" onClick={() => duplicateProduct(selected, selectedIndex)} title="Duplicar produto">⧉</button>
                    <button type="button" className="selected-delete" onClick={() => deleteProduct(selected, selectedIndex)} title="Excluir produto">Excluir</button>
                  </div>
                ) : null}
                <span className="round-count">{products.length}</span>
              </div>
            </header>

            {products.length ? (
              <div className={'product-table ' + (isAppFormat ? 'app-product-table' : '')}>
                <div className="product-row product-head">
                  <span></span>
                  {appFields.map(([field, label]) => <span key={field}>{label}</span>)}
                </div>
                {products.map((product, index) => (
                  <div
                    className={'product-row ' + (product.id === selected?.id ? 'selected-row' : '')}
                    key={product.id}
                    title={product.sourceLine ? 'Original: ' + product.sourceLine : undefined}
                  >
                    <button
                      className="row-selector"
                      type="button"
                      aria-label={`Selecionar ${[product.description, product.subdescription].filter(Boolean).join(' ')}`}
                      onClick={() => selectProduct(product, index)}
                    >
                      {product.id === selected?.id ? '●' : '○'}
                    </button>
                    {appFields.map(([field, label]) => (
                      <label className="product-field" key={field}>
                        <span>{label}</span>
                        <input
                          aria-label={`${label} de ${product.description || 'produto'}`}
                          inputMode={field === 'price' || field === 'regularPrice' ? 'decimal' : undefined}
                          className={field === 'price' || field === 'regularPrice' ? 'price-field' : ''}
                          value={product[field] || ''}
                          onFocus={() => selectProduct(product, index)}
                          onChange={(event) => changeProduct(product.id, field, event.target.value)}
                          onBlur={(event) => (field === 'price' || field === 'regularPrice') && finishPrice(product.id, field, event.target.value)}
                        />
                      </label>
                    ))}

                    {!isAppFormat && offerMode !== 'standard' ? (
                      <div className="product-promo-fields">
                        {offerMode === 'de-por' ? (
                          <label>
                            <span>Preço anterior</span>
                            <input
                              inputMode="decimal"
                              className="price-field"
                              value={product.regularPrice || ''}
                              onFocus={() => selectProduct(product, index)}
                              onChange={(event) => changeProduct(product.id, 'regularPrice', event.target.value)}
                              onBlur={(event) => finishPrice(product.id, 'regularPrice', event.target.value)}
                              placeholder="Ex.: 39,99"
                            />
                          </label>
                        ) : null}
                        {offerMode === 'leve-por' ? (
                          <>
                            <label>
                              <span>Quantidade do combo</span>
                              <input
                                inputMode="numeric"
                                value={product.offerQuantity || ''}
                                onFocus={() => selectProduct(product, index)}
                                onChange={(event) => changeProduct(product.id, 'offerQuantity', event.target.value)}
                                placeholder="Ex.: 3"
                              />
                            </label>
                            <label>
                              <span>Preço cada (opcional)</span>
                              <input
                                inputMode="decimal"
                                className="price-field"
                                value={product.eachPrice || ''}
                                onFocus={() => selectProduct(product, index)}
                                onChange={(event) => changeProduct(product.id, 'eachPrice', event.target.value)}
                                onBlur={(event) => finishPrice(product.id, 'eachPrice', event.target.value)}
                                placeholder="Ex.: 4,99"
                              />
                            </label>
                          </>
                        ) : null}
                        {offerMode === 'atacado-varejo' ? (
                          <>
                            <label>
                              <span>Preço atacado</span>
                              <input
                                inputMode="decimal"
                                className="price-field"
                                value={product.wholesalePrice || ''}
                                onFocus={() => selectProduct(product, index)}
                                onChange={(event) => changeProduct(product.id, 'wholesalePrice', event.target.value)}
                                onBlur={(event) => finishPrice(product.id, 'wholesalePrice', event.target.value)}
                                placeholder="Ex.: 24,90"
                              />
                            </label>
                            <label>
                              <span>Quantidade mínima</span>
                              <input
                                inputMode="numeric"
                                value={product.wholesaleQuantity || ''}
                                onFocus={() => selectProduct(product, index)}
                                onChange={(event) => changeProduct(product.id, 'wholesaleQuantity', event.target.value)}
                                placeholder="Ex.: 6"
                              />
                            </label>
                          </>
                        ) : null}
                        {offerMode === 'club-app' ? (
                          <label>
                            <span>Preço normal</span>
                            <input
                              inputMode="decimal"
                              className="price-field"
                              value={product.regularPrice || ''}
                              onFocus={() => selectProduct(product, index)}
                              onChange={(event) => changeProduct(product.id, 'regularPrice', event.target.value)}
                              onBlur={(event) => finishPrice(product.id, 'regularPrice', event.target.value)}
                              placeholder="Ex.: 24,90"
                            />
                          </label>
                        ) : null}
                        {offerMode === 'second-unit' ? (
                          <label>
                            <span>Preço 2ª unidade</span>
                            <input
                              inputMode="decimal"
                              className="price-field"
                              value={product.secondUnitPrice || ''}
                              onFocus={() => selectProduct(product, index)}
                              onChange={(event) => changeProduct(product.id, 'secondUnitPrice', event.target.value)}
                              onBlur={(event) => finishPrice(product.id, 'secondUnitPrice', event.target.value)}
                              placeholder="Ex.: 14,99"
                            />
                          </label>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span>▧</span>
                <strong>Comece colando seus produtos</strong>
                <small>Depois clique em Gerar placas.</small>
              </div>
            )}
          </section>
          {deletedSnapshot ? (
            <div className="undo-bar" role="status">
              Produto excluído.
              <button type="button" onClick={undoDelete}>Desfazer</button>
            </div>
          ) : null}
        </div>

        <aside className={'preview-card ' + (mobileTab === 'preview' ? 'mobile-panel-active' : 'mobile-panel-hidden')}>
          <header>
            <div>
              <span className="section-label">PRÉ-VISUALIZAÇÃO</span>
              <h2>Folha {safePageIndex + 1} de {pageCount}</h2>
              <small className="preview-dimensions">{format.paperLabel} · cartaz {format.cartSize}</small>
            </div>
            <span>
              {products.length
                ? (format.postersPerSheet === 1
                  ? (safePageIndex + 1) + ' / ' + products.length
                  : (safePageIndex * format.postersPerSheet + 1) + '–' + Math.min(products.length, (safePageIndex + 1) * format.postersPerSheet) + ' / ' + products.length)
                : '0 / 0'}
            </span>
          </header>

          <PosterViewport
            format={format}
            products={pageProducts}
            template={template}
            layoutPlans={layoutPlans}
            selectedProductId={selected?.id || null}
            onSelectProduct={(id) => setSelectedProductId(id)}
          />

          <div className="preview-title">{title}</div>

          <div className="preview-pager">
            <button type="button" aria-label="Folha anterior" onClick={() => movePage(-1)} disabled={pageCount <= 1}>‹</button>
            <span>Folha {safePageIndex + 1} de {pageCount}</span>
            <button type="button" aria-label="Próxima folha" onClick={() => movePage(1)} disabled={pageCount <= 1}>›</button>
          </div>

          <button className="outline-button" type="button" disabled={!products.length} onClick={() => setExpanded(true)}>Ampliar placa</button>
          <div className="preview-output-actions">
            <button className="pdf-button" type="button" disabled={!products.length} onClick={() => openPrintReview('preview', 'pdf')}>Salvar PDF</button>
            <button className="print-button" type="button" disabled={!products.length} onClick={() => openPrintReview('preview', 'print')}>Revisar e imprimir</button>
          </div>
        </aside>

        <StyleSidebar
          style={posterStyle}
          onChange={setPosterStyle}
          onReset={() => setPosterStyle({ ...DEFAULT_POSTER_STYLE })}
          mobileActive={mobileTab === 'style'}
          isAppFormat={isAppFormat}
          storeLogo={storeLogo}
          onStoreLogoChange={setStoreLogo}
          customHeader={customHeader}
          onCustomHeaderChange={setCustomHeader}
        />
      </section>

      <div className="poster-print-root" aria-hidden="true">
        {pages.map((productsForPage, index) => (
          <PosterSheet
            key={'print-' + index}
            className="poster-print-sheet"
            format={format}
            products={productsForPage}
            template={template}
            layoutPlans={layoutPlans}
            showBackground
            startIndex={index * format.postersPerSheet}
          />
        ))}
      </div>

      {expanded && products.length ? (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setExpanded(false)}>
          <section className="poster-modal real-preview-modal" role="dialog" aria-modal="true">
            <header>
              <div><span>VISUALIZAÇÃO · {format.shortLabel}</span><h2>{title}</h2></div>
              <button type="button" aria-label="Fechar visualização" onClick={() => setExpanded(false)}>×</button>
            </header>
            <PosterViewport
              className="modal-real-preview"
              format={format}
              products={pageProducts}
              template={template}
              layoutPlans={layoutPlans}
              selectedProductId={selected?.id || null}
              onSelectProduct={(id) => setSelectedProductId(id)}
            />
            <footer>
              <button type="button" onClick={() => setExpanded(false)}>Editar</button>
              <button type="button" onClick={() => { setExpanded(false); openPrintReview('expanded-preview', 'pdf') }}>Salvar PDF</button>
              <button className="generate-button" type="button" onClick={() => { setExpanded(false); openPrintReview('expanded-preview', 'print') }}>Revisar impressão</button>
            </footer>
          </section>
        </div>
      ) : null}

      {reviewOpen ? (
        <ReviewDialog
          format={format}
          products={products}
          pageCount={pageCount}
          warnings={reviewWarnings}
          onClose={() => setReviewOpen(false)}
          onPrint={printPosters}
          intent={reviewIntent}
        />
      ) : null}
    </main>
  )
}

// PRODUCT_RULE_ROOT_IS_CREATOR: a rota / abre diretamente o criador; não inserir landing intermediária.
function CreatorApp() {
  const [routePath, setRoutePath] = useState(() => window.location.pathname || '/')
  const savedDraft = useMemo(() => loadDraft(), [])
  const [draftAvailable, setDraftAvailable] = useState(savedDraft)
  const [screen, setScreen] = useState('formats')
  const [formatId, setFormatId] = useState(() => savedDraft?.formatId || localStorage.getItem(LAST_FORMAT_KEY) || 'A4X4')
  const [sourceText, setSourceText] = useState(() => savedDraft?.sourceText || '')
  const [products, setProducts] = useState(() => savedDraft?.products?.length ? savedDraft.products : [])
  const [selectedProductId, setSelectedProductId] = useState(() => savedDraft?.selectedProductId || savedDraft?.products?.[0]?.id || null)
  const [pageIndex, setPageIndex] = useState(() => savedDraft?.pageIndex || 0)
  const [installPrompt, setInstallPrompt] = useState(null)

  useEffect(() => {
    const handleInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }
    const handleInstalled = () => {
      setInstallPrompt(null)
      trackProductEvent('ofertamatica_app_installed')
    }
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => setRoutePath(window.location.pathname || '/')
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const clean = String(routePath || '/').replace(/\/+$/, '') || '/'
    if (clean === '/criar-placas') {
      window.history.replaceState({}, '', '/')
      setRoutePath('/')
      return
    }

    const redirect = RETIRED_CONTENT_REDIRECTS[clean]
    if (redirect) {
      window.history.replaceState({}, '', redirect)
      setRoutePath(redirect)
    }
  }, [routePath])

  useEffect(() => {
    const draft = {
      formatId,
      sourceText,
      products,
      selectedProductId,
      pageIndex,
      savedAt: Date.now(),
    }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      localStorage.setItem(LAST_FORMAT_KEY, formatId)
      setDraftAvailable(draft)
    } catch {
      // O editor continua funcionando mesmo se o armazenamento do navegador estiver indisponível.
    }
  }, [formatId, sourceText, products, selectedProductId, pageIndex])

  useEffect(() => {
    if (routePath === '/' && screen === 'formats') {
      trackProductEvent('ofertamatica_creator_view', { entry: 'root' })
    }
  }, [routePath, screen])

  async function installApp() {
    if (!installPrompt) return
    installPrompt.prompt()
    const choice = await installPrompt.userChoice
    trackProductEvent('ofertamatica_install_prompt_result', {
      outcome: choice?.outcome || 'unknown',
    })
    setInstallPrompt(null)
  }

  function resumeDraft() {
    if (!draftAvailable) return
    trackProductEvent('ofertamatica_draft_resumed', {
      format_id: draftAvailable.formatId || 'A4X4',
      product_count: draftAvailable.products?.length || 0,
    })
    setFormatId(draftAvailable.formatId || 'A4X4')
    setSourceText(draftAvailable.sourceText || '')
    setProducts(draftAvailable.products || [])
    setSelectedProductId(draftAvailable.selectedProductId || draftAvailable.products?.[0]?.id || null)
    setPageIndex(draftAvailable.pageIndex || 0)
    setScreen('editor')
  }

  function startWithFormat(id) {
    trackProductEvent('ofertamatica_format_selected', { format_id: id })
    setFormatId(id)
    setProducts((current) => applyAppDefaults(current, id))
    setPageIndex(0)
    setScreen('editor')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function showFormats() {
    const createPath = '/'
    if (routePath !== createPath) {
      window.history.pushState({}, '', createPath)
      setRoutePath(createPath)
    }
    setScreen('formats')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const seoPage = getSeoPage(routePath)
  const publicPage = getPublicPage(routePath)

  const appModeClass = screen === 'editor'
    ? 'editor-mode'
    : (seoPage || publicPage ? 'public-mode' : 'format-mode')

  return (
    <div className={'app ' + appModeClass}>
      <Navigation routePath={routePath} screen={screen} onInstall={installPrompt ? installApp : null} />
      {screen === 'editor' ? (
        <>
          <CreatorSeoHead />
          <Editor
          formatId={formatId}
          sourceText={sourceText}
          setSourceText={setSourceText}
          products={products}
          setProducts={setProducts}
          selectedProductId={selectedProductId}
          setSelectedProductId={setSelectedProductId}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          onChangeFormat={showFormats}
        />
        </>
      ) : seoPage ? (
        <SeoLanding page={seoPage} onCreate={showFormats} />
      ) : publicPage ? (
        <PublicPage page={publicPage} onCreate={showFormats} />
      ) : (
        <>
          <CreatorSeoHead />
          <FormatChooser onSelect={startWithFormat} draft={draftAvailable} onResume={resumeDraft} />
        </>
      )}
    </div>
  )
}


function App() {
  if ((window.location.pathname || '/') === '/visual-qa/cartazes') {
    return <PosterVisualQaPage />
  }
  return <CreatorApp />
}

export default App
