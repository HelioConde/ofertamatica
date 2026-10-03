import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import PosterSheet from './components/posters/PosterSheet'
import { AdUnit, CreatorSeoHead, PublicPage, SeoLanding, getPublicPage, getSeoPage } from './components/SiteMarketing'
import { getPageCount, getPosterFormat, POSTER_FORMAT_OPTIONS } from './config/posterFormats'
import { getDefaultTemplateForFormat } from './config/posterTemplates'
import { createPosterLayouts } from './poster-engine/layoutPlan'
import { parseProductList } from './poster-engine/parseProduct'
import { createBrowserTextMeasure } from './utils/posterBrowserMeasure'

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
const HEADER_OPTIONS = [
  { id: DEFAULT_HEADER_OPTION_ID, label: 'Oferta', url: '' },
  ...HEADER_IMAGES,
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
].join('\n')

const PRINT_STYLE_ID = 'ofertamatica-poster-page'
const PX_PER_MM = 96 / 25.4
const DRAFT_KEY = 'ofertamatica:draft:v1'
const LAST_FORMAT_KEY = 'ofertamatica:last-format'
const POSTER_STYLE_KEY = 'ofertamatica:poster-style:v1'
const POSTER_HEADER_KEY = 'ofertamatica:poster-header:v1'
const RECENT_HEADERS_KEY = 'ofertamatica:recent-headers:v1'
const EXAMPLE_USED_KEY = 'ofertamatica:example-used:v1'
const STORE_LOGO_KEY = 'ofertamatica:store-logo:v1'

function trackProductEvent(event, details = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...details })
}

const DEFAULT_POSTER_STYLE = {
  backgroundColor: '#fff200',
  textColor: '#050505',
  priceColor: '#e60025',
  headerColor: '#e51e31',
  headerTextColor: '#ffffff',
  fontFamily: '"Burbank Big Cd Bk", Impact, "Arial Black", sans-serif',
  headerStyle: 'band',
  headerText: 'OFERTA',
  headerImage: '',
  showCurrency: true,
  offerMode: 'standard',
  validityText: '',
  limitText: '',
}

const POSTER_STYLE_PRESETS = [
  { id: 'classic', name: 'Clássico', values: DEFAULT_POSTER_STYLE },
  { id: 'red', name: 'Vermelho', values: { ...DEFAULT_POSTER_STYLE, backgroundColor: '#ef233c', textColor: '#ffffff', priceColor: '#fff200', headerColor: '#b60925' } },
  { id: 'green', name: 'Verde', values: { ...DEFAULT_POSTER_STYLE, backgroundColor: '#17a768', textColor: '#ffffff', priceColor: '#ffe500', headerColor: '#0b7547' } },
  { id: 'premium', name: 'Premium', values: { ...DEFAULT_POSTER_STYLE, backgroundColor: '#141b2d', textColor: '#ffffff', priceColor: '#ffe000', headerColor: '#1d63e9' } },
]

const OFFER_MODES = [
  { id: 'standard', name: 'Padrão', note: 'Produto + preço' },
  { id: 'de-por', name: 'De / Por', note: 'Preço anterior + oferta' },
  { id: 'leve-por', name: 'Leve X por Y', note: 'Promoção por quantidade' },
  { id: 'atacado-varejo', name: 'Atacado / Varejo', note: 'Dois preços na placa' },
]

function loadPosterStyle() {
  try {
    const saved = JSON.parse(localStorage.getItem(POSTER_STYLE_KEY) || 'null')
    if (!saved) return DEFAULT_POSTER_STYLE

    const storedHeader = saved.headerImage || localStorage.getItem(POSTER_HEADER_KEY) || ''
    const migratedHeader = storedHeader
      ? (HEADER_IMAGE_BY_ID[storedHeader]
        ? storedHeader
        : normalizeHeaderImageId(storedHeader))
      : ''

    return {
      ...DEFAULT_POSTER_STYLE,
      ...saved,
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
    const isLegacyExample = String(draft.sourceText || '').trim() === EXAMPLE_TEXT.trim()
      && draft.products.length === 3
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

function Navigation({ routePath, screen }) {
  const cleanPath = String(routePath || '/').replace(/\/+$/, '') || '/'
  const links = [
    ['/', 'Criar placas'],
    ['/modelos', 'Modelos'],
    ['/formatos', 'Formatos'],
    ['/como-funciona', 'Como funciona'],
    ['/guias-para-varejo', 'Guias para varejo'],
  ]

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Brand />
        <nav className="main-nav" aria-label="Navegação principal">
          {links.map(([href, label]) => {
            const active = cleanPath === href || (label === 'Criar placas' && screen === 'editor')
            const target = href === '/' ? '/' : href + '/'
            return (
              <a
                className={'nav-link ' + (active ? 'active' : '')}
                href={target}
                key={href}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </a>
            )
          })}
        </nav>
        <div className="nav-meta">
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

  return (
    <div className="format-thumb">
      <div className={`oferta-format-preview ${isSplit ? 'is-split' : ''} ${isApp ? 'is-app' : ''} ${isFour ? 'is-four' : ''}`}>
        {Array.from({ length: format.postersPerSheet }, (_, index) => (
          <div className={`oferta-format-mini ${format.invertedSlots.includes(index) ? 'is-inverted' : ''}`} key={index}>
            <span>✓ OFERTA</span>
            <i></i>
            <b>R$</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function FormatChooser({ onSelect, draft, onResume }) {
  return (
    <main className="format-page" id="formatos">
      <section className="format-dialog">
        <header className="format-dialog-head">
          <span className="eyebrow two-click-kicker">2 CLIQUES · PLACA PRONTA</span>
          <h1>Escolha o formato e comece.</h1>
          <p>1º clique: escolha o formato. 2º clique: cole a lista e gere as placas. Personalização é opcional e vem depois do resultado.</p>
          <div className="creator-value-row" aria-label="Vantagens do criador">
            <span>✓ Grátis</span>
            <span>✓ Sem cadastro</span>
            <span>✓ TXT, CSV e Excel</span>
            <span>✓ Várias placas de uma vez</span>
          </div>
          <div className="format-steps two-click-steps" aria-label="Fluxo principal em dois cliques">
            <span><b>1</b> Escolher formato</span><i>→</i><span><b>2</b> Colar e gerar</span>
            <small>Depois, se quiser: personalize e imprima.</small>
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
          {POSTER_FORMAT_OPTIONS.map((format) => (
            <button
              className={'format-choice ' + (format.id === 'A4X4' ? 'is-recommended' : '')}
              type="button"
              key={format.id}
              onClick={() => onSelect(format.id)}
              aria-label={'Escolher ' + format.label + ', ' + format.application}
            >
              {format.id === 'A4X4' ? <span className="format-recommended">Mais usado</span> : null}
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

        </div>

        <div className="format-ad-row">
          <AdUnit placement="format-grid" />
        </div>
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

function StyleSidebar({ style, onChange, onReset, mobileActive, isAppFormat = false, storeLogo = '', onStoreLogoChange }) {
  const [headerSearch, setHeaderSearch] = useState('')
  const [logoError, setLogoError] = useState('')
  const logoInputRef = useRef(null)
  const [headerLimit, setHeaderLimit] = useState(18)
  const [recentHeaderIds, setRecentHeaderIds] = useState(loadRecentHeaders)
  const normalizedSearch = headerSearch.trim().toLocaleLowerCase('pt-BR')
  const filteredHeaders = normalizedSearch
    ? HEADER_OPTIONS.filter((item) => item.label.toLocaleLowerCase('pt-BR').includes(normalizedSearch))
    : HEADER_OPTIONS
  const visibleHeaders = filteredHeaders.slice(0, headerLimit)
  const recentHeaders = recentHeaderIds
    .map((id) => HEADER_IMAGES.find((item) => item.id === id))
    .filter(Boolean)

  function chooseHeader(id) {
    if (id === DEFAULT_HEADER_OPTION_ID) {
      onChange({ ...style, headerImage: '' })
      return
    }

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
          <>
            <section className="style-section offer-mode-section">
              <div className="style-section-title-row">
                <strong>Tipo de oferta</strong>
                <small>Opcional · não atrasa os 2 cliques</small>
              </div>
              <div className="offer-mode-grid">
                {OFFER_MODES.map((mode) => (
                  <button
                    type="button"
                    key={mode.id}
                    className={style.offerMode === mode.id ? 'active' : ''}
                    onClick={() => {
                      onChange({ ...style, offerMode: mode.id })
                      trackProductEvent('ofertamatica_offer_mode_selected', { offer_mode: mode.id })
                    }}
                  >
                    <b>{mode.name}</b>
                    <small>{mode.note}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="style-section offer-details-section">
              <div className="style-section-title-row">
                <strong>Detalhes da oferta</strong>
                <small>Opcional</small>
              </div>
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
            </section>
          </>
        ) : null}

        <section className="style-section">
          <strong>Modelos rápidos</strong>
          <div className="style-presets">
            {POSTER_STYLE_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                onClick={() => onChange({
                  ...preset.values,
                  headerImage: style.headerImage,
                  headerText: style.headerText,
                  headerStyle: style.headerStyle,
                  offerMode: style.offerMode || 'standard',
                  validityText: style.validityText || '',
                  limitText: style.limitText || '',
                })}
              >
                <span style={{ background: preset.values.backgroundColor, color: preset.values.priceColor }}>Aa</span>
                <small>{preset.name}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="style-section">
          <strong>Cores</strong>
          <div className="style-color-list">
            {colorFields.map(([field, label]) => (
              <label className="style-color-row" key={field}>
                <span>{label}</span>
                <span className="style-color-control">
                  <input
                    type="color"
                    value={style[field]}
                    onChange={(event) => onChange({ ...style, [field]: event.target.value })}
                    aria-label={'Cor de ' + label.toLocaleLowerCase('pt-BR')}
                  />
                  <code>{style[field].toUpperCase()}</code>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="style-section">
          <strong>Tipografia</strong>
          <label className="style-select-row">
            <span>Fonte principal</span>
            <select value={style.fontFamily} onChange={(event) => onChange({ ...style, fontFamily: event.target.value })}>
              <option value={'"Burbank Big Cd Bk", Impact, "Arial Black", sans-serif'}>Ofertamática</option>
              <option value={'Impact, "Arial Black", sans-serif'}>Impact</option>
              <option value={'"Arial Black", Arial, sans-serif'}>Arial Black</option>
              <option value={'Arial, sans-serif'}>Arial</option>
            </select>
          </label>
        </section>

        <section className="style-section store-brand-section">
          <div className="style-section-title-row">
            <strong>Logo da loja</strong>
            <small>Opcional · fica salva neste dispositivo</small>
          </div>
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
        </section>

        <section className="style-section header-library-section">
          <div className="style-section-title-row">
            <strong>Header da placa</strong>
            <small>{HEADER_OPTIONS.length} opções</small>
          </div>

          {style.headerImage ? (
            <div className="selected-header-preview">
              <img src={HEADER_IMAGE_BY_ID[style.headerImage]} alt="" />
              <div>
                <strong>{HEADER_IMAGES.find((item) => item.id === style.headerImage)?.label || 'Header selecionado'}</strong>
                <button type="button" onClick={() => chooseHeader(DEFAULT_HEADER_OPTION_ID)}>Usar padrão</button>
              </div>
            </div>
          ) : null}

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
                setHeaderLimit(18)
              }}
              placeholder="Ex.: padaria, açougue..."
            />
          </label>

          <div className="header-art-grid">
            {visibleHeaders.map((item) => {
              const isDefault = item.id === DEFAULT_HEADER_OPTION_ID
              const isActive = isDefault ? !style.headerImage : style.headerImage === item.id
              return (
                <button
                  type="button"
                  key={item.id}
                  className={isActive ? 'active' : ''}
                  onClick={() => chooseHeader(item.id)}
                  title={isDefault ? 'OFERTA — cabeçalho padrão' : item.label}
                >
                  {isDefault ? (
                    <div className="header-default-thumb" aria-hidden="true">
                      <span className="ofertamatica-bag-mark">✓</span>
                      <b>OFERTA</b>
                    </div>
                  ) : (
                    <img src={item.url} alt="" loading="lazy" />
                  )}
                  <span>{isDefault ? 'Oferta (padrão)' : item.label}</span>
                </button>
              )
            })}
          </div>

          {!filteredHeaders.length ? <p className="header-empty">Nenhum header encontrado.</p> : null}
          {filteredHeaders.length > visibleHeaders.length ? (
            <button type="button" className="header-show-more" onClick={() => setHeaderLimit((value) => value + 18)}>
              Mostrar mais headers ({filteredHeaders.length - visibleHeaders.length})
            </button>
          ) : null}
        </section>

        <section className="style-section">
          <strong>Cabeçalho padrão</strong>
          <div className="header-style-switch">
            <button type="button" className={style.headerStyle === 'band' ? 'active' : ''} onClick={() => onChange({ ...style, headerStyle: 'band' })}>Faixa</button>
            <button type="button" className={style.headerStyle === 'simple' ? 'active' : ''} onClick={() => onChange({ ...style, headerStyle: 'simple' })}>Simples</button>
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
        </section>

        <section className="style-section">
          <strong>Preço</strong>
          <label className="style-toggle-row">
            <span><b>Mostrar R$</b><small>Exibir símbolo da moeda junto ao preço</small></span>
            <input type="checkbox" checked={style.showCurrency} onChange={(event) => onChange({ ...style, showCurrency: event.target.checked })} />
          </label>
        </section>

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
  const [fontReady, setFontReady] = useState(false)
  const [confirmExample, setConfirmExample] = useState(false)
  const [mobileTab, setMobileTab] = useState('products')
  const [deletedSnapshot, setDeletedSnapshot] = useState(null)
  const [inputMenuOpen, setInputMenuOpen] = useState(false)
  const [posterStyle, setPosterStyle] = useState(loadPosterStyle)
  const [storeLogo, setStoreLogo] = useState(loadStoreLogo)
  const fileInput = useRef(null)
  const inputMenuRef = useRef(null)
  const creatorStartedAt = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now())
  const firstGenerationTracked = useRef(false)

  const format = getPosterFormat(formatId)
  const baseTemplate = getDefaultTemplateForFormat(formatId)
  const template = useMemo(() => ({
    ...baseTemplate,
    showCurrency: posterStyle.showCurrency,
    headerText: posterStyle.headerText || 'OFERTA',
    headerStyle: posterStyle.headerStyle,
    headerImage: HEADER_IMAGE_BY_ID[posterStyle.headerImage] || '',
    offerMode: formatId === 'A4X2_APP' ? 'standard' : (posterStyle.offerMode || 'standard'),
    validityText: formatId === 'A4X2_APP' ? '' : (posterStyle.validityText || ''),
    limitText: formatId === 'A4X2_APP' ? '' : (posterStyle.limitText || ''),
    storeLogo,
  }), [baseTemplate, formatId, posterStyle.showCurrency, posterStyle.headerText, posterStyle.headerStyle, posterStyle.headerImage, posterStyle.offerMode, posterStyle.validityText, posterStyle.limitText, storeLogo])

  const posterStyleVars = {
    '--poster-background': posterStyle.backgroundColor,
    '--poster-text-color': posterStyle.textColor,
    '--poster-price-color': posterStyle.priceColor,
    '--poster-header-color': posterStyle.headerColor,
    '--poster-header-text-color': posterStyle.headerTextColor,
    '--poster-font-family': posterStyle.fontFamily,
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
    document.fonts.load('16px "Burbank Big Cd Bk"').then(() => {
      if (active) setFontReady(document.fonts.check('16px "Burbank Big Cd Bk"'))
    }).catch(() => {
      if (active) setFontReady(false)
    })
    return () => { active = false }
  }, [])

  const measure = useMemo(() => createBrowserTextMeasure(), [fontReady])
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
    }
    return warnings
  }, [offerMode, products])

  function generateFromSource(nextSource = sourceText) {
    const parsed = applyAppDefaults(parseProductList(nextSource), formatId).map((product) => ({
      ...product,
      price: normalizePrice(product.price),
      regularPrice: product.regularPrice ? normalizePrice(product.regularPrice) : '',
    }))
    setProducts(parsed)
    setSelectedProductId(parsed[0]?.id || null)
    setPageIndex(0)

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
    const priceFields = new Set(['price', 'regularPrice', 'wholesalePrice'])
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

  async function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setImportError('')
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
        throw new Error('Formato não suportado.')
      }
      if (!importedSource.trim()) throw new Error('O arquivo não possui produtos para importar.')
      setSourceText(importedSource)
      generateFromSource(importedSource)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Não foi possível importar o arquivo.')
    } finally {
      event.target.value = ''
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
    setSelectedProductId(null)
    setPageIndex(0)
    setConfirmExample(false)
    setInputMenuOpen(false)
  }

  function chooseExample() {
    const applied = useExample()
    if (applied) setInputMenuOpen(false)
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

  function printPosters() {
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
            {products.length ? '✓ 2/2 · placas geradas' : '2º clique · cole e gere'}
          </em>
        </div>
        <button className="change-format" type="button" onClick={onChangeFormat} title="Seus produtos serão preservados ao trocar o formato.">
          <span>{format.shortLabel}</span>
          <b>Alterar formato</b>
        </button>
      </div>

      <div className="mobile-editor-tabs" role="tablist" aria-label="Alternar área do editor">
        <button type="button" role="tab" aria-selected={mobileTab === 'products'} className={mobileTab === 'products' ? 'active' : ''} onClick={() => setMobileTab('products')}>Produtos</button>
        <button type="button" role="tab" aria-selected={mobileTab === 'preview'} className={mobileTab === 'preview' ? 'active' : ''} onClick={() => setMobileTab('preview')}>Prévia</button>
        <button type="button" role="tab" aria-selected={mobileTab === 'style'} className={mobileTab === 'style' ? 'active' : ''} onClick={() => setMobileTab('style')}>Estilo</button>
      </div>

      <section className="editor-layout">
        <div className={'editor-main ' + (mobileTab === 'products' ? 'mobile-panel-active' : 'mobile-panel-hidden')}>
          <section className="editor-card">
            <header>
              <div>
                <span className="section-label">ENTRADA RÁPIDA</span>
                <h2>Cole seus produtos</h2>
                <p>Uma linha por produto. Ex.: Café 500 g 18,90 · Leite 1 L R$ 4,99. Aceita vírgula ou ponto decimal.</p>
              </div>
              <span className="format-chip">{format.cartSize} · {format.orientationLabel}</span>
            </header>

            <textarea value={sourceText} onChange={(event) => { setSourceText(event.target.value); setConfirmExample(false) }} aria-label="Lista de produtos, uma linha por produto" />

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
                    <button type="button" role="menuitem" className="input-menu-danger" onClick={clearProductList}>
                      <span className="input-menu-icon">×</span>
                      <span><b>Limpar lista</b><small>Remover texto e produtos</small></span>
                    </button>
                  </div>
                ) : null}
              </div>

              <span className="product-count">{products.length} produtos identificados</span>
              <button className="generate-button" type="button" onClick={() => generateFromSource()}>
                <span className="generate-step-badge">2</span>
                Gerar placas
              </button>
            </div>
            {confirmExample ? <div className="inline-warning">“Usar exemplo” substituirá o texto atual. Clique novamente para confirmar.</div> : null}
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
                        ) : null}
                        {offerMode === 'atacado-varejo' ? (
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
            <span>{products.length ? (safePageIndex * format.postersPerSheet + 1) + '–' + Math.min(products.length, (safePageIndex + 1) * format.postersPerSheet) : '0'} / {products.length}</span>
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
function App() {
  const [routePath, setRoutePath] = useState(() => window.location.pathname || '/')
  const savedDraft = useMemo(() => loadDraft(), [])
  const [draftAvailable, setDraftAvailable] = useState(savedDraft)
  const [screen, setScreen] = useState('formats')
  const [formatId, setFormatId] = useState(() => savedDraft?.formatId || localStorage.getItem(LAST_FORMAT_KEY) || 'A4X4')
  const [sourceText, setSourceText] = useState(() => savedDraft?.sourceText || '')
  const [products, setProducts] = useState(() => savedDraft?.products?.length ? savedDraft.products : [])
  const [selectedProductId, setSelectedProductId] = useState(() => savedDraft?.selectedProductId || savedDraft?.products?.[0]?.id || null)
  const [pageIndex, setPageIndex] = useState(() => savedDraft?.pageIndex || 0)

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

  return (
    <div className={'app ' + (screen === 'editor' ? 'editor-mode' : 'format-mode')}>
      <Navigation routePath={routePath} screen={screen} />
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

export default App
