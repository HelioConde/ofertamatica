import { useMemo, useRef, useState } from 'react'

const FORMATS = [
  { id: 'a4-4x1', label: 'A4 4x1', note: '4 placas por folha A4', badge: '4 POR FOLHA', preview: 'single' },
  { id: 'a4-2x1', label: 'A4 2x1', note: '2 placas, cima e baixo', badge: '2 VERTICAL', preview: 'split' },
  { id: 'a4-2x1-invertido', label: 'A4 2x1 Invertido', note: '2 placas, superior invertida', badge: '2 + INVERTIDO', preview: 'inverted' },
  { id: 'a4-2x1-app', label: 'A4 2x1 App', note: '2 ofertas de aplicativo lado a lado', badge: '2 APP', preview: 'app' },
  { id: 'a4', label: 'A4', note: '1 placa por folha', badge: '1 POR FOLHA', preview: 'single' },
  { id: 'a5', label: 'A5', note: '1 placa A5', badge: 'A5', preview: 'a5' },
  { id: 'a3', label: 'A3', note: '1 placa A3', badge: 'A3', preview: 'a3' },
]

const EXAMPLE_TEXT = [
  'Cerveja Heineken Long Neck 300ml 5,99',
  'Pão Francês kg 10,90',
  'Pão de queijo kg 20,90',
].join('\n')

function parseLine(line, index) {
  let source = line.trim().replace(/\s+/g, ' ')
  if (!source) return null

  const priceMatch = source.match(/(?:R\$\s*)?(\d{1,5}[.,]\d{2})\s*$/i)
  const price = priceMatch ? priceMatch[1].replace('.', ',') : ''
  if (priceMatch) source = source.slice(0, priceMatch.index).trim()

  const unitMatch = source.match(/(?:^|\s)(\d+(?:[.,]\d+)?\s?(?:kg|g|mg|l|ml|un|und|pct|pcte|cx)|kg)\s*$/i)
  const unit = unitMatch ? unitMatch[1].replace(/\s+/g, '').toUpperCase() : ''
  if (unitMatch) source = source.slice(0, unitMatch.index).trim()

  const lower = source.toLocaleLowerCase('pt-BR')
  let description = ''
  let subdescription = ''
  let complement = ''

  if (lower.startsWith('pão francês')) {
    description = 'PÃO FRANCÊS'
    complement = source.slice(11).trim().toUpperCase()
  } else if (lower.startsWith('pão de queijo')) {
    description = 'PÃO DE QUEIJO'
    complement = source.slice(13).trim().toUpperCase()
  } else {
    const words = source.split(' ').filter(Boolean)
    description = (words[0] || '').toUpperCase()
    subdescription = (words[1] || '').toUpperCase()
    complement = words.slice(2).join(' ').toUpperCase()
  }

  return {
    id: `product-${Date.now()}-${index}`,
    description,
    subdescription,
    complement,
    unit,
    price,
  }
}

function parseProducts(text) {
  return text.split(/\r?\n/).map(parseLine).filter(Boolean)
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

function FormatPreview({ type }) {
  if (type === 'app') {
    return (
      <div className="format-thumb">
        <div className="app-sheet">
          <div className="app-top"><span>BAIXE O NOSSO APP</span><span>BAIXE O NOSSO APP</span></div>
          <div className="app-panels"><i></i><i></i></div>
        </div>
      </div>
    )
  }

  if (type === 'split' || type === 'inverted') {
    return (
      <div className="format-thumb">
        <div className={`split-sheet ${type === 'inverted' ? 'is-inverted' : ''}`}>
          <div className="split-panel"><span>OFERTA</span><b>R$</b></div>
          <div className="split-panel"><span>OFERTA</span><b>R$</b></div>
        </div>
      </div>
    )
  }

  return (
    <div className="format-thumb">
      <div className={`single-sheet ${type === 'a5' ? 'is-a5' : ''} ${type === 'a3' ? 'is-a3' : ''}`}>
        <div className="sheet-offer">✓ OFERTA</div>
        <div className="sheet-body"></div>
        <span>R$</span>
      </div>
    </div>
  )
}

function FormatChooser({ onSelect }) {
  return (
    <main className="format-page" id="formatos">
      <section className="format-dialog">
        <header className="format-dialog-head">
          <span className="eyebrow">NOVO CARTAZ</span>
          <h1>Qual formato deseja criar?</h1>
          <p>Escolha o tamanho para começar. Você poderá trocar o formato depois sem perder seus produtos.</p>
        </header>

        <div className="format-grid">
          {FORMATS.map((format) => (
            <button className="format-choice" type="button" key={format.id} onClick={() => onSelect(format.id)}>
              <FormatPreview type={format.preview} />
              <span className="format-copy">
                <strong>{format.label}</strong>
                <small>{format.note}</small>
                <b>{format.badge}</b>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="discovery-strip" id="guias">
        <div>
          <span>Não sabe qual escolher?</span>
          <strong>Comece pelo A4 4x1 para ofertas rápidas ou A4 para uma placa maior.</strong>
        </div>
        <div className="discovery-links">
          <a href="#como-funciona">Como criar uma placa</a>
          <a href="#modelos">Modelos para supermercado</a>
          <a href="#formatos">Guia de formatos</a>
        </div>
      </section>
    </main>
  )
}

function PosterArtwork({ product }) {
  const item = product || {
    description: 'SUA OFERTA',
    subdescription: '',
    complement: '',
    unit: '',
    price: '0,00',
  }

  return (
    <div className="poster-art">
      <div className="poster-offer">✓ OFERTA</div>
      <div className="poster-text">
        <strong>{item.description || 'PRODUTO'}</strong>
        {item.subdescription && <strong>{item.subdescription}</strong>}
        {item.complement && <strong className="poster-complement">{item.complement}</strong>}
        {item.unit && <span>{item.unit}</span>}
      </div>
      <div className="poster-price"><small>R$</small><b>{item.price || '0,00'}</b></div>
      <div className="poster-slogan">É completo!<br />É barato!</div>
    </div>
  )
}

function Editor({ formatId, onChangeFormat }) {
  const [input, setInput] = useState(EXAMPLE_TEXT)
  const [products, setProducts] = useState(() => parseProducts(EXAMPLE_TEXT))
  const [activeIndex, setActiveIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const fileInput = useRef(null)

  const format = FORMATS.find((item) => item.id === formatId) || FORMATS[0]
  const current = products[activeIndex] || null
  const title = useMemo(() => (
    current
      ? [current.description, current.subdescription, current.complement].filter(Boolean).join(' ')
      : 'Sua prévia aparecerá aqui'
  ), [current])

  function generate() {
    const next = parseProducts(input)
    setProducts(next)
    setActiveIndex(0)
  }

  function changeProduct(id, field, value) {
    setProducts((items) => items.map((item) => (
      item.id === id
        ? { ...item, [field]: field === 'price' ? value.replace('.', ',') : value.toUpperCase() }
        : item
    )))
  }

  function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result || '')
      setInput(value)
      setProducts(parseProducts(value))
      setActiveIndex(0)
    }
    reader.readAsText(file, 'UTF-8')
    event.target.value = ''
  }

  return (
    <main className="editor-page">
      <div className="editor-topline">
        <div>
          <span className="eyebrow">CRIAR CARTAZ</span>
          <h1>Monte suas placas</h1>
          <p>Cole seus produtos, confira a interpretação e imprima.</p>
        </div>
        <button className="change-format" type="button" onClick={onChangeFormat}>
          <span>{format.label}</span>
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
                <p>Uma linha por produto. Nós separamos descrição, complemento, gramatura e preço para você revisar.</p>
              </div>
              <span className="format-chip">Formato: {format.label}</span>
            </header>

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              aria-label="Uma linha por produto"
            />

            <div className="editor-actions">
              <input ref={fileInput} hidden type="file" accept=".txt,.csv,text/plain,text/csv" onChange={handleFile} />
              <button className="icon-button" type="button" onClick={() => fileInput.current?.click()}>＋</button>
              <button className="quiet-button" type="button" onClick={() => fileInput.current?.click()}>Importar arquivo</button>
              <button className="quiet-button" type="button" onClick={() => { setInput(EXAMPLE_TEXT); setProducts(parseProducts(EXAMPLE_TEXT)); setActiveIndex(0) }}>Usar exemplo</button>
              <span className="product-count">{products.length} produtos identificados</span>
              <button className="generate-button" type="button" onClick={generate}>Gerar placas</button>
            </div>
          </section>

          <section className="editor-card interpreted">
            <header>
              <div>
                <span className="section-label">CONTEÚDO INTERPRETADO</span>
                <h2>Lista de placas</h2>
                <p>Revise os campos antes de imprimir. Alterações aparecem na prévia.</p>
              </div>
              <span className="round-count">{products.length}</span>
            </header>

            {products.length ? (
              <div className="product-table">
                <div className="product-row product-head">
                  <span></span>
                  <span>Descrição</span>
                  <span>Subdescrição</span>
                  <span>Complemento</span>
                  <span>Gramatura</span>
                  <span>Venda</span>
                </div>
                {products.map((product, index) => (
                  <div className={`product-row ${index === activeIndex ? 'selected-row' : ''}`} key={product.id}>
                    <button className="row-selector" type="button" onClick={() => setActiveIndex(index)}>{index === activeIndex ? '●' : '○'}</button>
                    <input value={product.description} onFocus={() => setActiveIndex(index)} onChange={(e) => changeProduct(product.id, 'description', e.target.value)} />
                    <input value={product.subdescription} onFocus={() => setActiveIndex(index)} onChange={(e) => changeProduct(product.id, 'subdescription', e.target.value)} />
                    <input value={product.complement} onFocus={() => setActiveIndex(index)} onChange={(e) => changeProduct(product.id, 'complement', e.target.value)} />
                    <input value={product.unit} onFocus={() => setActiveIndex(index)} onChange={(e) => changeProduct(product.id, 'unit', e.target.value)} />
                    <input className="price-field" value={product.price} onFocus={() => setActiveIndex(index)} onChange={(e) => changeProduct(product.id, 'price', e.target.value)} />
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
              <h2>Folha {products.length ? activeIndex + 1 : 1} de {Math.max(products.length, 1)}</h2>
            </div>
            <span>{activeIndex + 1} / {products.length || 0}</span>
          </header>

          <div className="preview-stage"><PosterArtwork product={current} /></div>
          <div className="preview-title">{title}</div>

          <div className="preview-pager">
            <button type="button" onClick={() => setActiveIndex((value) => products.length ? (value - 1 + products.length) % products.length : 0)}>‹</button>
            <span>{products.length ? activeIndex + 1 : 0} / {products.length || 0}</span>
            <button type="button" onClick={() => setActiveIndex((value) => products.length ? (value + 1) % products.length : 0)}>›</button>
          </div>

          <button className="outline-button" type="button" disabled={!current} onClick={() => setExpanded(true)}>Ampliar placa</button>
          <button className="print-button" type="button" disabled={!current} onClick={() => window.print()}>Revisar e imprimir</button>
        </aside>
      </section>

      <aside className="ad-placeholder">ESPAÇO PARA ANÚNCIO</aside>

      <section className="editor-info" id="como-funciona">
        <article id="modelos"><span>01</span><h3>Modelos prontos</h3><p>Vamos adicionar páginas por segmento para supermercado, padaria, açougue, hortifruti e outros.</p></article>
        <article><span>02</span><h3>Escolha o formato</h3><p>A4 4x1, A4 2x1, A4, A5, A3 e formatos especiais em um único fluxo.</p></article>
        <article><span>03</span><h3>Imprima sem cadastro</h3><p>A ferramenta principal continuará liberada para uso imediato.</p></article>
      </section>

      {expanded && current && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setExpanded(false)}>
          <section className="poster-modal" role="dialog" aria-modal="true">
            <header><div><span>VISUALIZAÇÃO · {format.label}</span><h2>{title}</h2></div><button type="button" onClick={() => setExpanded(false)}>×</button></header>
            <div className="modal-stage"><PosterArtwork product={current} /></div>
            <footer><button type="button" onClick={() => setExpanded(false)}>Editar</button><button className="generate-button" type="button" onClick={() => window.print()}>Imprimir / Salvar PDF</button></footer>
          </section>
        </div>
      )}
    </main>
  )
}

function App() {
  const [screen, setScreen] = useState('formats')
  const [formatId, setFormatId] = useState('a4-4x1')

  function startWithFormat(id) {
    setFormatId(id)
    setScreen('editor')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function showFormats() {
    setScreen('formats')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <Navigation onCreate={showFormats} />
      {screen === 'formats' ? (
        <FormatChooser onSelect={startWithFormat} />
      ) : (
        <Editor formatId={formatId} onChangeFormat={showFormats} />
      )}
      <footer className="site-footer">
        <Brand />
        <p>Crie placas de oferta profissionais, sem cadastro obrigatório.</p>
        <nav><a href="#modelos">Modelos</a><a href="#formatos">Formatos</a><a href="#como-funciona">Como funciona</a><a href="#guias">Guias</a></nav>
      </footer>
    </div>
  )
}

export default App
