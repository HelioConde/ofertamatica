import { useEffect, useRef, useState } from 'react'

// Navegação única usada pela Home, páginas públicas e editor.
const LINKS = [
  ['/', 'Criar placas', 'Criar'],
  ['/modelos', 'Modelos', 'Modelos'],
  ['/editor-livre', 'Editor livre', 'Editor'],
  ['/formatos', 'Formatos', 'Formatos'],
  ['/como-funciona', 'Como funciona', 'Como'],
  ['/guias-para-varejo', 'Guias para varejo', 'Guias'],
  ['/validade-zero', 'Validade Zero', 'Validade'],
]

export default function SiteNavigation({ routePath, screen, onInstall }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const headerRef = useRef(null)
  const toggleRef = useRef(null)

  // O menu mobile permanece acessível ao teclado mesmo quando o foco sai dos links.
  useEffect(() => {
    if (!menuOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }
    const onPointerDown = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [menuOpen])

  const cleanPath = String(routePath || '/').replace(/\/+$/, '') || '/'

  return (
    <header ref={headerRef} className="site-header">
      <div className="nav-shell">
        <a className="brand" href="/" aria-label="Ofertamática — ir para a página inicial">
          <img className="brand-icon" src="/icons/icon-192.png?v=20261008b" width="36" height="36" alt="" decoding="async" />
          <span>Ofertamática</span>
        </a>
        <button
          type="button"
          className="nav-menu-toggle"
          ref={toggleRef}
          aria-controls="ofertamatica-main-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
          <span>{menuOpen ? 'Fechar' : 'Menu'}</span>
        </button>
        <nav
          id="ofertamatica-main-navigation"
          className={'main-nav' + (menuOpen ? ' is-open' : '')}
          aria-label="Navegação principal"
        >
          {LINKS.map(([href, label, mobileLabel]) => {
            const active = cleanPath === href || (href === '/' && screen === 'editor')
            const target = href === '/' ? '/' : href + '/'
            return (
              <a
                className={'nav-link ' + (active ? 'active' : '')}
                href={target}
                key={href}
                target={href === '/validade-zero' ? '_blank' : undefined}
                rel={href === '/validade-zero' ? 'noopener noreferrer' : undefined}
                aria-current={active ? 'page' : undefined}
                aria-label={href === '/validade-zero' ? 'Validade Zero — controle de vencimentos (abre nova aba)' : undefined}
                onClick={() => setMenuOpen(false)}
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
