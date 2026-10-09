import { lazy, Suspense, useState } from 'react'
import { AdUnit } from './components/AdUnit'
import CreatorSeoHead from './components/CreatorSeoHead'
import FormatOptionCard from './components/FormatOptionCard'
import { getPosterFormat, POSTER_FORMAT_OPTIONS } from './config/posterFormats'

// A Home usa somente navegação e seletor: o editor completo e suas dependências
// entram por import() após o primeiro clique. Preserva a UX em dispositivos lentos.
const FullApp = lazy(() => import('./CreatorApp.jsx'))
const DRAFT_KEY = 'ofertamatica:draft:v1'
const LAST_FORMAT_KEY = 'ofertamatica:last-format'
const EXAMPLE_USED_KEY = 'ofertamatica:example-used:v1'
const LEGACY_EXAMPLE_TEXTS = [
  ['Cerveja Heineken Long Neck 300ml 5,99', 'Pão Francês kg 10,90', 'Pão de queijo kg 20,90'].join('\n'),
  ['Cerveja Heineken Long Neck 300ml 5,99', 'Pão Francês kg 10,90', 'Pão de queijo kg 20,90', 'Arroz Tipo 1 5kg 24,90'].join('\n'),
]
function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw)
    if (!draft || !Array.isArray(draft.products)) return null
    if (LEGACY_EXAMPLE_TEXTS.includes(String(draft.sourceText || '').trim()) && localStorage.getItem(EXAMPLE_USED_KEY) !== '1') {
      localStorage.removeItem(DRAFT_KEY)
      return null
    }
    return draft
  } catch { return null }
}

function Brand() {
  return (
    <a className="brand" href="/" aria-label="Ofertamática">
      <img className="brand-icon" src="/icons/icon-192.png?v=20261008b" width="36" height="36" alt="" decoding="async" />
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

function FormatChooser({ onSelect, draft, onResume }) {
  const lastFormatId = (() => {
    try {
      return localStorage.getItem(LAST_FORMAT_KEY) || ''
    } catch {
      return ''
    }
  })()

  return (
    <main className="format-page format-home-refresh" id="formatos">
      <section className="format-dialog">
        <header className="format-dialog-head format-dialog-head-clean">
          <div className="format-home-intro">
            <div className="format-home-intro-copy">
              <span className="eyebrow two-click-kicker">CARTAZES DE OFERTA GRÁTIS</span>
              <h1>Escolha o formato da sua placa de oferta</h1>
              <p>Escolha A4, A5 ou A3, cole seus produtos e imprima suas ofertas. Sem cadastro.</p>
              <div className="format-trust-row" aria-label="Vantagens do Ofertamática">
                <span>Grátis e sem cadastro</span>
                <span>Lista, Excel, CSV ou TXT</span>
                <span>PDF no tamanho correto</span>
              </div>
            </div>
            <a className="format-paper-guide-link" href="/qual-papel-usar-para-cartaz/">
              <span className="format-paper-icon" aria-hidden="true">▤</span>
              <span><b>Dúvida sobre o papel?</b><small>Confira folhas, gramaturas e impressão</small></span>
              <strong aria-hidden="true">→</strong>
            </a>
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

        <section className="format-home-chooser" aria-labelledby="format-picker-title">
          <div className="format-home-section-title">
            <div>
              <h2 id="format-picker-title">Selecione o tamanho do cartaz</h2>
              <p>8 opções de impressão · clique em uma para começar</p>
            </div>
            <span>1. Formato <i aria-hidden="true">→</i> 2. Produtos <i aria-hidden="true">→</i> 3. PDF</span>
          </div>
          <div className="format-grid">
            {POSTER_FORMAT_OPTIONS.filter((format) => format.id !== 'SRA3').map((format) => (
              <FormatOptionCard
                key={format.id}
                format={format}
                onSelect={onSelect}
                lastFormatId={lastFormatId}
              />
            ))}
          </div>
        </section>
        <aside className="format-ad-card format-ad-zone" aria-label="Publicidade separada dos formatos">
          <AdUnit placement="format-grid" />
        </aside>
        <nav className="format-trust-links" aria-label="Atalhos e informações">
          <a href="/modelos/">Modelos de cartazes</a>
          <a href="/qual-papel-usar-para-cartaz/">Qual papel usar?</a>
          <a href="/como-funciona/">Como funciona</a>
          <details className="format-more-links">
            <summary>Mais informações</summary>
            <div>
              <a href="/guias-para-varejo/">Guias para varejo</a>
              <a href="/fale-conosco/">Ajuda e contato</a>
              <a href="/privacidade/">Privacidade</a>
              <a href="/termos/">Termos de uso</a>
            </div>
          </details>
        </nav>
      </section>
    </main>
  )
}

function App() {
  const [entry, setEntry] = useState(() => {
    // Links do HTML inicial continuam utilizáveis mesmo antes do bundle React.
    const format = new URLSearchParams(window.location.search).get('formato')
    return POSTER_FORMAT_OPTIONS.some((option) => option.id === format) ? { formatId: format } : null
  })
  const [savedDraft] = useState(loadDraft)
  const path = window.location.pathname || '/'
  const onHome = path === '/' || path === '/criar-placas' || path === '/criar-placas/'
  if (!onHome || entry) {
    return (
      <Suspense fallback={
        <div className="app format-mode" aria-live="polite">
          <Navigation routePath={path} screen="formats" />
          <main className="format-page"><div className="format-dialog" style={{padding:24}}>Preparando {entry ? 'editor' : 'página'} da Ofertamática...</div></main>
        </div>
      }>
        <FullApp initialFormatId={entry?.formatId || null} resumeOnLoad={Boolean(entry?.resume)} />
      </Suspense>
    )
  }
  return (
    <div className="app format-mode">
      <Navigation routePath="/" screen="formats" />
      <CreatorSeoHead />
      <FormatChooser
        onSelect={(formatId) => {
          window.dataLayer = window.dataLayer || []
          window.dataLayer.push({ event: 'ofertamatica_format_selected', format_id: formatId })
          setEntry({ formatId })
        }}
        draft={savedDraft}
        onResume={() => setEntry({ resume: true })}
      />
    </div>
  )
}

export default App
