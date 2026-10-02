import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import PosterSheet from './components/posters/PosterSheet'
import { getPageCount, getPosterFormat, POSTER_FORMAT_OPTIONS } from './config/posterFormats'
import { getDefaultTemplateForFormat } from './config/posterTemplates'
import { createPosterLayouts } from './poster-engine/layoutPlan'
import { parseProductList } from './poster-engine/parseProduct'
import { createBrowserTextMeasure } from './utils/posterBrowserMeasure'

const EXAMPLE_TEXT = [
  'Cerveja Heineken Long Neck 300ml 5,99',
  'Pão Francês kg 10,90',
  'Pão de queijo kg 20,90',
].join('\n')

const PRINT_STYLE_ID = 'ofertamatica-poster-page'
const PX_PER_MM = 96 / 25.4

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
  style.textContent = '@page { size: ' + format.paper + ' ' + format.orientation + '; margin: 0; }'
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

function Navigation({ onCreate }) {
  return (
    <header className="site-header">
      <div className="nav-shell">
        <Brand />
        <nav className="main-nav" aria-label="Navegação principal">
          <button className="nav-link active" type="button" onClick={onCreate}>Criar placas</button>
          <a className="nav-link" href="#modelos">Modelos</a>
          <a className="nav-link" href="#formatos">Formatos</a>
          <a className="nav-link" href="#como-funciona">Como funciona</a>
          <a className="nav-link" href="#guias">Guias para varejo</a>
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

function FormatChooser({ onSelect }) {
  return (
    <main className="format-page" id="formatos">
      <section className="format-dialog">
        <header className="format-dialog-head">
          <span className="eyebrow">CRIE SEUS CARTAZES</span>
          <h1>Qual formato você quer imprimir?</h1>
          <p>Escolha o papel e a quantidade de cartazes por folha. Depois, adicione os produtos e imprima.</p>
          <div className="format-steps" aria-label="Fluxo de criação">
            <span><b>1</b> Formato</span><i>→</i><span><b>2</b> Produtos</span><i>→</i><span><b>3</b> Impressão</span>
          </div>
        </header>

        <div className="format-grid">
          {POSTER_FORMAT_OPTIONS.map((format) => (
            <button className="format-choice" type="button" key={format.id} onClick={() => onSelect(format.id)}>
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
            <span className="ad-label">PUBLICIDADE</span>
            <div className="ad-slot-reserved">
              <span className="ad-icon">AD</span>
              <strong>Espaço para anúncio</strong>
              <small>Google AdSense</small>
            </div>
          </aside>
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

function ReviewDialog({ format, products, pageCount, warnings, onClose, onPrint }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
        <header>
          <div>
            <span className="section-label">REVISÃO DE IMPRESSÃO</span>
            <h2 id="review-title">Confira antes de imprimir</h2>
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
          <strong>Na janela de impressão</strong>
          <span>Use escala de <b>100%</b> e evite “Ajustar à página”.</span>
          <span>Selecione papel <b>{format.paper}</b> e orientação <b>{format.orientationLabel}</b>.</span>
          <span>Desative cabeçalhos e rodapés do navegador para não aparecer URL/data na folha.</span>
          {format.paper === 'A3' ? <span className="print-alert">Este trabalho exige papel/impressora A3.</span> : null}
        </div>

        <footer>
          <button type="button" className="quiet-button review-back" onClick={onClose}>Voltar e corrigir</button>
          <button type="button" className="generate-button review-print" onClick={onPrint}>Imprimir agora</button>
        </footer>
      </section>
    </div>
  )
}

function Editor({
  formatId, sourceText, setSourceText, products, setProducts, selectedProductId,
  setSelectedProductId, pageIndex, setPageIndex, onChangeFormat,
}) {
  const [expanded, setExpanded] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [importError, setImportError] = useState('')
  const [fontReady, setFontReady] = useState(false)
  const [confirmExample, setConfirmExample] = useState(false)
  const fileInput = useRef(null)

  const format = getPosterFormat(formatId)
  const template = getDefaultTemplateForFormat(formatId)

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
  const title = selected
    ? [selected.description, selected.subdescription, selected.complement, selected.unit].filter(Boolean).join(' ')
    : 'Sua prévia aparecerá aqui'
  const isAppFormat = formatId === 'A4X2_APP'

  const standardFields = [
    ['description', 'Nome do produto'],
    ['subdescription', 'Marca / variante'],
    ['complement', 'Complemento'],
    ['unit', 'Peso / volume'],
    ['price', isAppFormat ? 'Preço App' : 'Preço'],
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
    return warnings
  }, [products])

  function generateFromSource(nextSource = sourceText) {
    const parsed = applyAppDefaults(parseProductList(nextSource), formatId).map((product) => ({
      ...product,
      price: normalizePrice(product.price),
      regularPrice: product.regularPrice ? normalizePrice(product.regularPrice) : '',
    }))
    setProducts(parsed)
    setSelectedProductId(parsed[0]?.id || null)
    setPageIndex(0)
  }

  function changeProduct(id, field, value) {
    setProducts((items) => items.map((item) => (
      item.id === id
        ? { ...item, [field]: field === 'price' || field === 'regularPrice' ? value : value.toLocaleUpperCase('pt-BR') }
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
      return
    }
    setConfirmExample(false)
    setSourceText(EXAMPLE_TEXT)
    generateFromSource(EXAMPLE_TEXT)
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

  function printPosters() {
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
    <main className="editor-page">
      <div className="editor-topline">
        <div className="editor-context">
          <strong>{format.shortLabel} · {products.length} {products.length === 1 ? 'produto' : 'produtos'}</strong>
          <span>Ajuste automático do texto e impressão no tamanho físico escolhido.</span>
        </div>
        <button className="change-format" type="button" onClick={onChangeFormat} title="Seus produtos serão preservados ao trocar o formato.">
          <span>{format.shortLabel}</span>
          <b>Alterar formato</b>
        </button>
      </div>

      <section className="editor-layout">
        <div className="editor-main">
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
              <input ref={fileInput} hidden type="file" accept=".txt,.csv,.xls,.xlsx,text/plain,text/csv" onChange={handleFile} />
              <button className="quiet-button add-product-button" type="button" onClick={() => setSourceText((value) => value + (value.endsWith('\n') || !value ? '' : '\n'))}>＋ Adicionar produto</button>
              <button className="quiet-button" type="button" onClick={() => fileInput.current?.click()}>Importar TXT/CSV/Excel</button>
              <button className={`quiet-button ${confirmExample ? 'example-confirm' : ''}`} type="button" onClick={useExample}>
                {confirmExample ? 'Confirmar exemplo' : 'Usar exemplo'}
              </button>
              <span className="product-count">{products.length} produtos identificados</span>
              <button className="generate-button" type="button" onClick={() => generateFromSource()}>Gerar placas</button>
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
              <span className="round-count">{products.length}</span>
            </header>

            {products.length ? (
              <div className={'product-table ' + (isAppFormat ? 'app-product-table' : '')}>
                <div className="product-row product-head">
                  <span>Selecionar</span>
                  {appFields.map(([field, label]) => <span key={field}>{label}</span>)}
                </div>
                {products.map((product, index) => (
                  <div className={'product-row ' + (product.id === selected?.id ? 'selected-row' : '')} key={product.id}>
                    <button
                      className="row-selector"
                      type="button"
                      aria-label={`Selecionar ${[product.description, product.subdescription].filter(Boolean).join(' ')}`}
                      onClick={() => selectProduct(product, index)}
                    >
                      {product.id === selected?.id ? '✓' : 'Selecionar'}
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
        </div>

        <aside className="preview-card">
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

          <aside className="preview-ad-card" aria-label="Publicidade">
            <span>PUBLICIDADE</span>
            <div><b>AD</b><strong>Espaço para anúncio</strong><small>Google AdSense</small></div>
          </aside>

          <button className="outline-button" type="button" disabled={!products.length} onClick={() => setExpanded(true)}>Ampliar placa</button>
          <button className="print-button" type="button" disabled={!products.length} onClick={() => setReviewOpen(true)}>Revisar e imprimir</button>
        </aside>
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
              <button className="generate-button" type="button" onClick={() => { setExpanded(false); setReviewOpen(true) }}>Revisar impressão</button>
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
        />
      ) : null}
    </main>
  )
}

function App() {
  const initialProducts = useMemo(() => parseProductList(EXAMPLE_TEXT).map((product) => ({ ...product, price: normalizePrice(product.price) })), [])
  const [screen, setScreen] = useState('formats')
  const [formatId, setFormatId] = useState('A4X4')
  const [sourceText, setSourceText] = useState(EXAMPLE_TEXT)
  const [products, setProducts] = useState(initialProducts)
  const [selectedProductId, setSelectedProductId] = useState(initialProducts[0]?.id || null)
  const [pageIndex, setPageIndex] = useState(0)

  function startWithFormat(id) {
    setFormatId(id)
    setProducts((current) => applyAppDefaults(current, id))
    setPageIndex(0)
    setScreen('editor')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function showFormats() {
    setScreen('formats')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={'app ' + (screen === 'editor' ? 'editor-mode' : 'format-mode')}>
      <Navigation onCreate={showFormats} />
      {screen === 'formats' ? (
        <FormatChooser onSelect={startWithFormat} />
      ) : (
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
      )}
    </div>
  )
}

export default App
