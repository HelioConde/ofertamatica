import { useEffect, useMemo, useRef, useState } from 'react'

const FORMAT_OPTIONS = [
  { id: 'a4-4x1', label: 'A4 4x1', note: '4 placas por folha' },
  { id: 'a4-2x1', label: 'A4 2x1', note: '2 placas por folha' },
  { id: 'a4', label: 'A4', note: '1 placa por folha' },
  { id: 'a3', label: 'A3', note: '1 placa por folha' },
]

const EXAMPLE_TEXT = [
  'Cerveja Heineken Long Neck 300ml 5,99',
  'Pão Francês kg 10,90',
  'Pão de queijo kg 20,90',
].join('\n')

const CATEGORY_CARDS = [
  ['🛒', 'Supermercado'],
  ['🥖', 'Padaria'],
  ['🥩', 'Açougue'],
  ['🥬', 'Hortifruti'],
  ['💊', 'Farmácia'],
  ['🍾', 'Bebidas'],
]

const money = (value) => String(value || '').replace('.', ',')

function splitProductName(text) {
  const clean = text.trim().replace(/\s+/g, ' ')
  const lower = clean.toLocaleLowerCase('pt-BR')

  if (lower.startsWith('pão francês')) {
    return { description: 'PÃO FRANCÊS', subdescription: '', complement: clean.slice(11).trim().toUpperCase() }
  }

  if (lower.startsWith('pão de queijo')) {
    return { description: 'PÃO DE QUEIJO', subdescription: '', complement: clean.slice(13).trim().toUpperCase() }
  }

  const words = clean.split(' ').filter(Boolean)
  if (words.length <= 2) {
    return { description: clean.toUpperCase(), subdescription: '', complement: '' }
  }

  return {
    description: words[0].toUpperCase(),
    subdescription: words[1].toUpperCase(),
    complement: words.slice(2).join(' ').toUpperCase(),
  }
}

function parseProductLine(line, index) {
  let working = line.trim().replace(/\s+/g, ' ')
  if (!working) return null

  const priceMatch = working.match(/(?:R\$\s*)?(\d{1,5}[.,]\d{2})\s*$/i)
  const price = priceMatch ? money(priceMatch[1]) : ''
  if (priceMatch) working = working.slice(0, priceMatch.index).trim()

  const unitMatch = working.match(/(?:^|\s)(\d+(?:[.,]\d+)?\s?(?:kg|g|mg|l|ml|un|und|u|pct|pcte|cx|dz)|kg)\s*$/i)
  const unit = unitMatch ? unitMatch[1].replace(/\s+/g, '').toUpperCase() : ''
  if (unitMatch) working = working.slice(0, unitMatch.index).trim()

  const parts = splitProductName(working)

  return {
    id: `product-${Date.now()}-${index}`,
    ...parts,
    unit,
    price,
  }
}

function parseProducts(text) {
  return text
    .split(/\r?\n/)
    .map((line, index) => parseProductLine(line, index))
    .filter(Boolean)
}

function AdBanner() {
  return (
    <aside className="ad-banner" aria-label="Espaço para anúncio">
      <div>
        <span>ESPAÇO PARA ANÚNCIO</span>
        <strong>Divulgue sua marca aqui</strong>
      </div>
      <p>Um espaço integrado ao produto, sem interromper a criação das placas.</p>
      <button type="button">Anunciar agora</button>
      <div className="ad-megaphone" aria-hidden="true">📣</div>
    </aside>
  )
}

function PosterArtwork({ product }) {
  const display = product || {
    description: 'SUA OFERTA',
    subdescription: 'APARECE',
    complement: 'AQUI',
    unit: '',
    price: '0,00',
  }

  return (
    <div className="offer-poster">
      <div className="offer-header">
        <span className="mini-bag" aria-hidden="true">✓</span>
        OFERTA
      </div>
      <div className="offer-copy">
        <strong>{display.description || 'PRODUTO'}</strong>
        {display.subdescription && <strong>{display.subdescription}</strong>}
        {display.complement && <strong className="poster-complement">{display.complement}</strong>}
        {display.unit && <span className="poster-unit">{display.unit}</span>}
      </div>
      <div className="offer-price">
        <span>R$</span>
        <b>{display.price || '0,00'}</b>
      </div>
      <div className="poster-corner">É completo!<br />É barato!</div>
    </div>
  )
}

function App() {
  const [format, setFormat] = useState('a4-4x1')
  const [input, setInput] = useState(EXAMPLE_TEXT)
  const [products, setProducts] = useState(() => parseProducts(EXAMPLE_TEXT))
  const [activeIndex, setActiveIndex] = useState(0)
  const [history, setHistory] = useState([])
  const [showMoreFormats, setShowMoreFormats] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const fileInput = useRef(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ofertamatica-history-v2') || '[]')
      if (Array.isArray(saved)) setHistory(saved.slice(0, 4))
    } catch {
      setHistory([])
    }
  }, [])

  const currentProduct = products[activeIndex] || null
  const selectedFormat = FORMAT_OPTIONS.find((item) => item.id === format) || FORMAT_OPTIONS[0]

  const posterTitle = useMemo(() => {
    if (!currentProduct) return 'Sua prévia aparecerá aqui'
    return [currentProduct.description, currentProduct.subdescription, currentProduct.complement]
      .filter(Boolean)
      .join(' ')
  }, [currentProduct])

  function saveHistory(nextProducts) {
    if (!nextProducts.length) return
    const first = nextProducts[0]
    const entry = {
      id: Date.now(),
      title: [first.description, first.subdescription, first.complement].filter(Boolean).join(' '),
      count: nextProducts.length,
      format: selectedFormat.label,
      price: first.price,
      createdAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    }
    const next = [entry, ...history].slice(0, 4)
    setHistory(next)
    localStorage.setItem('ofertamatica-history-v2', JSON.stringify(next))
  }

  function generate() {
    const next = parseProducts(input)
    setProducts(next)
    setActiveIndex(0)
    saveHistory(next)
  }

  function changeProduct(id, field, value) {
    setProducts((current) => current.map((product) => (
      product.id === id ? { ...product, [field]: field === 'price' ? money(value) : value.toUpperCase() } : product
    )))
  }

  function navigate(direction) {
    if (!products.length) return
    setActiveIndex((current) => {
      const next = current + direction
      if (next < 0) return products.length - 1
      if (next >= products.length) return 0
      return next
    })
  }

  function useExample() {
    setInput(EXAMPLE_TEXT)
    const next = parseProducts(EXAMPLE_TEXT)
    setProducts(next)
    setActiveIndex(0)
  }

  function clearAll() {
    setInput('')
    setProducts([])
    setActiveIndex(0)
  }

  function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result || '')
      setInput(value)
      const next = parseProducts(value)
      setProducts(next)
      setActiveIndex(0)
    }
    reader.readAsText(file, 'UTF-8')
    event.target.value = ''
  }

  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="Ofertamática">
            <span className="brand-symbol"><i>✓</i></span>
            <span>Ofertamática</span>
          </a>

          <nav className="main-nav" aria-label="Navegação principal">
            <a className="active" href="#criar">Criar placas</a>
            <a href="#modelos">Modelos</a>
            <a href="#como-funciona">Como funciona</a>
          </nav>

          <div className="header-actions">
            <span className="header-promise">▣ <small>Placas profissionais<br />e gratuitas</small></span>
            <button className="login-button" type="button">♙ <span>Entrar</span></button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <h1>Crie placas de oferta <span>em segundos</span></h1>
            <p>Digite, cole ou importe seus produtos. É grátis e não exige cadastro.</p>
            <div className="hero-trust">
              <span>✓ Pronto para imprimir</span>
              <span>✓ Sem complicação</span>
              <span>✓ Gratuito com anúncios</span>
            </div>
          </div>

          <div className="hero-posters" aria-hidden="true">
            {[
              ['CERVEJA', '5,99'],
              ['PÃO FRANCÊS', '10,90'],
              ['PÃO DE QUEIJO', '20,90'],
            ].map(([name, price], index) => (
              <div className={`mini-poster mini-poster-${index + 1}`} key={name}>
                <span>OFERTA</span>
                <b>{name}</b>
                <strong>R$ {price}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="creator-shell" id="criar">
          <div className="creator-main">
            <section className="tool-step format-step">
              <div className="step-heading">
                <span className="step-number">1</span>
                <div>
                  <h2>Escolha o formato da placa</h2>
                  <p>Você pode trocar depois sem perder seus produtos.</p>
                </div>
              </div>

              <div className="format-options">
                {FORMAT_OPTIONS.map((item) => (
                  <button
                    className={format === item.id ? 'format-card selected' : 'format-card'}
                    key={item.id}
                    type="button"
                    onClick={() => setFormat(item.id)}
                  >
                    <span className="format-icon">{item.id.includes('4x1') ? '▦' : item.id.includes('2x1') ? '▥' : '▯'}</span>
                    <span><b>{item.label}</b><small>{item.note}</small></span>
                  </button>
                ))}
                <button className="format-card more-format" type="button" onClick={() => setShowMoreFormats((value) => !value)}>
                  <span className="format-icon">•••</span>
                  <span><b>Mais formatos</b><small>Ver todos</small></span>
                </button>
              </div>

              {showMoreFormats && (
                <div className="more-formats-popover">
                  <button type="button" onClick={() => setFormat('a4-2x1')}>A4 2x1 invertido</button>
                  <button type="button" onClick={() => setFormat('a4-2x1')}>A4 2x1 App</button>
                  <button type="button" onClick={() => setFormat('a4')}>A5</button>
                  <button type="button" onClick={() => setFormat('a3')}>SRA3</button>
                </div>
              )}
            </section>

            <section className="tool-step input-step">
              <div className="step-heading">
                <span className="step-number">2</span>
                <div>
                  <h2>Cole seus produtos</h2>
                  <p>Uma linha por produto. Nós separamos descrição, complemento, gramatura e preço para você.</p>
                </div>
              </div>

              <textarea
                aria-label="Uma linha por produto"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={'Café tradicional 500g 18,99\nLeite integral 1L 4,99\nCerveja Long Neck 330ml 5,49'}
              />

              <div className="input-actions">
                <input ref={fileInput} onChange={handleFile} type="file" accept=".txt,.csv,text/plain,text/csv" hidden />
                <button className="square-button" type="button" onClick={() => fileInput.current?.click()} aria-label="Adicionar arquivo">＋</button>
                <button className="soft-button" type="button" onClick={() => fileInput.current?.click()}>↥ <span>Importar arquivo</span></button>
                <button className="soft-button" type="button" onClick={useExample}>▤ <span>Usar exemplo</span></button>
                <button className="soft-button danger" type="button" onClick={clearAll}>♲ <span>Limpar lista</span></button>
                <span className="identified-count">{products.length} {products.length === 1 ? 'produto identificado' : 'produtos identificados'}</span>
                <button className="primary-button" type="button" onClick={generate}>▦ Gerar placas</button>
              </div>
            </section>

            <section className="tool-step products-step">
              <div className="step-heading">
                <span className="step-number">3</span>
                <div>
                  <h2>Lista de placas <span>(conteúdo interpretado)</span></h2>
                  <p>Revise os campos antes de imprimir. Você pode editar se quiser.</p>
                </div>
                <span className="count-badge">{products.length}</span>
              </div>

              {products.length ? (
                <div className="product-table" role="table" aria-label="Conteúdo interpretado">
                  <div className="product-row product-head" role="row">
                    <span></span>
                    <span>Descrição</span>
                    <span>Subdescrição</span>
                    <span>Complemento</span>
                    <span>Gramatura</span>
                    <span>Venda</span>
                  </div>
                  {products.map((product, index) => (
                    <div className={index === activeIndex ? 'product-row active-row' : 'product-row'} role="row" key={product.id}>
                      <button className="row-select" type="button" onClick={() => setActiveIndex(index)} aria-label="Visualizar esta placa">
                        {index === activeIndex ? '●' : '○'}
                      </button>
                      <input value={product.description} onFocus={() => setActiveIndex(index)} onChange={(e) => changeProduct(product.id, 'description', e.target.value)} />
                      <input value={product.subdescription} onFocus={() => setActiveIndex(index)} onChange={(e) => changeProduct(product.id, 'subdescription', e.target.value)} />
                      <input value={product.complement} onFocus={() => setActiveIndex(index)} onChange={(e) => changeProduct(product.id, 'complement', e.target.value)} />
                      <input value={product.unit} onFocus={() => setActiveIndex(index)} onChange={(e) => changeProduct(product.id, 'unit', e.target.value)} />
                      <input className="price-input" value={product.price} onFocus={() => setActiveIndex(index)} onChange={(e) => changeProduct(product.id, 'price', e.target.value)} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-products">
                  <span>▧</span>
                  <strong>Comece colando seus produtos</strong>
                  <p>Use uma linha por produto e clique em Gerar placas.</p>
                  <div>
                    <button type="button" onClick={useExample}>Usar exemplo</button>
                    <button type="button" onClick={() => fileInput.current?.click()}>Importar arquivo</button>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="preview-panel">
            <div className="preview-heading">
              <div>
                <span className="preview-kicker">4 · PRÉ-VISUALIZAÇÃO</span>
                <h2>Folha {products.length ? activeIndex + 1 : 1} de {Math.max(products.length, 1)}</h2>
              </div>
              <span className="preview-format">{selectedFormat.label}</span>
            </div>

            <div className="poster-frame">
              <PosterArtwork product={currentProduct} />
            </div>

            <div className="preview-caption">{posterTitle}</div>

            <div className="preview-controls">
              <button type="button" onClick={() => navigate(-1)} disabled={!products.length}>‹</button>
              <span>{products.length ? activeIndex + 1 : 0} / {products.length || 0}</span>
              <button type="button" onClick={() => navigate(1)} disabled={!products.length}>›</button>
            </div>

            <div className="preview-actions">
              <button type="button" onClick={() => currentProduct && setShowPreview(true)} disabled={!currentProduct}>⌕ Ampliar placa</button>
              <button type="button" onClick={() => window.print()} disabled={!currentProduct}>▣ Imprimir esta folha</button>
            </div>
            <button className="print-button" type="button" onClick={() => window.print()} disabled={!currentProduct}>▣ Revisar e imprimir</button>
          </aside>
        </section>

        <AdBanner />

        <section className="support-grid">
          <article className="support-card" id="modelos">
            <div className="support-title">
              <div><span className="section-icon green">▰</span><h2>Modelos para seu negócio</h2></div>
              <a href="#criar">Ver todos →</a>
            </div>
            <p>Modelos preparados para diferentes segmentos do varejo.</p>
            <div className="category-grid">
              {CATEGORY_CARDS.map(([icon, name]) => (
                <button type="button" key={name}>
                  <span>{icon}</span>
                  <b>{name}</b>
                </button>
              ))}
            </div>
          </article>

          <article className="support-card how-card" id="como-funciona">
            <div className="support-title">
              <div><span className="section-icon">⚙</span><h2>Como funciona</h2></div>
            </div>
            <p>Em três passos, suas placas estão prontas.</p>
            <ol>
              <li><span>1</span><div><b>Cole os produtos</b><small>Digite, cole do WhatsApp ou importe um arquivo.</small></div></li>
              <li><span>2</span><div><b>Confira a interpretação</b><small>Revise e ajuste os campos se necessário.</small></div></li>
              <li><span>3</span><div><b>Imprima suas placas</b><small>Use a prévia e imprima. Pronto.</small></div></li>
            </ol>
          </article>

          <article className="support-card history-card">
            <div className="support-title">
              <div><span className="section-icon green">◷</span><h2>Histórico neste dispositivo</h2></div>
            </div>
            <p>Seus últimos trabalhos ficam salvos apenas neste navegador.</p>
            <div className="history-list">
              {history.length ? history.slice(0, 2).map((item) => (
                <button type="button" key={item.id}>
                  <span className="history-thumb"><b>OFERTA</b><strong>{item.price || '0,00'}</strong></span>
                  <span><b>{item.title}</b><small>{item.count} placas · {item.createdAt}</small></span>
                  <i>›</i>
                </button>
              )) : (
                <div className="history-empty">Seu primeiro trabalho aparecerá aqui depois de gerar as placas.</div>
              )}
            </div>
          </article>
        </section>

        <section className="mission-strip">
          <strong>Entrou. Colou a oferta. Imprimiu.</strong>
          <span>Sem cadastro obrigatório, sem precisar saber design.</span>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand"><span className="brand-symbol small"><i>✓</i></span><b>Ofertamática</b></div>
        <span>Placas de oferta profissionais, de forma simples e gratuita.</span>
        <nav><a href="#como-funciona">Como funciona</a><a href="#modelos">Modelos</a><a href="#">Privacidade</a><a href="#">Termos</a><a href="#">Contato</a></nav>
        <small>♥ Gratuito, mantido por anúncios</small>
      </footer>

      {showPreview && currentProduct && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowPreview(false)}>
          <section className="preview-modal" role="dialog" aria-modal="true" aria-label="Visualização ampliada">
            <header>
              <div><span>VISUALIZAÇÃO · {selectedFormat.label}</span><h2>{posterTitle}</h2></div>
              <button type="button" onClick={() => setShowPreview(false)}>×</button>
            </header>
            <div className="modal-poster"><PosterArtwork product={currentProduct} /></div>
            <footer>
              <button type="button" onClick={() => navigate(-1)}>‹</button>
              <span>{activeIndex + 1} / {products.length}</span>
              <button type="button" onClick={() => navigate(1)}>›</button>
              <div className="modal-actions"><button type="button" onClick={() => setShowPreview(false)}>Editar</button><button className="primary-button" type="button" onClick={() => window.print()}>▣ Imprimir / Salvar PDF</button></div>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
