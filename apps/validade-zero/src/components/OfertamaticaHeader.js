import React, { useEffect, useRef, useState } from 'react';
import './OfertamaticaHeader.css';

// Os links voltam ao criador. A opção atual fica marcada dentro do menu.
const LINKS = [
  ['/', 'Criar placas', 'Criar'],
  ['/modelos/', 'Modelos', 'Modelos'],
  ['/editor-livre/', 'Editor livre', 'Editor'],
  ['/formatos/', 'Formatos', 'Formatos'],
  ['/como-funciona/', 'Como funciona', 'Como'],
  ['/guias-para-varejo/', 'Guias para varejo', 'Guias'],
  ['/validade-zero/', 'Validade Zero', 'Validade Zero'],
];

export default function OfertamaticaHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointerDown = event => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [menuOpen]);

  return (
    <header ref={headerRef} className="vz-site-header no-print">
      <div className="vz-site-nav-shell">
        <a className="vz-site-brand" href="/" aria-label="Ofertamática — voltar ao criador de cartazes">
          <img className="vz-site-brand-icon"
            src="/icons/icon-192.png?v=20261008b" width="36" height="36" alt="" decoding="async"/>
          <span className="vz-site-brand-copy">
            <span className="vz-site-brand-name">Ofertamática</span>
            <span className="vz-site-product">Validade Zero</span>
          </span>
        </a>
        <button ref={toggleRef} type="button" className="vz-site-menu-toggle"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-controls="vz-site-menu-links" aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}>
          <span className="vz-site-menu-glyph" aria-hidden="true">
            <span/><span/><span/>
          </span>
          <span className="vz-site-menu-caption">Menu</span>
        </button>
        <nav id="vz-site-menu-links"
          className={'vz-site-main-nav' + (menuOpen ? ' is-open' : '')}
          aria-label="Navegação principal do Ofertamática">
          <span className="vz-site-nav-scroll">
            {LINKS.filter(([href]) => href !== '/validade-zero/').map(([href, desktop, mobile]) => (
              <a className="vz-site-nav-link" href={href} key={href} onClick={() => setMenuOpen(false)}>
                <span className="vz-site-label-full">{desktop}</span>
                <span className="vz-site-label-mobile">{mobile}</span>
              </a>
            ))}
          </span>
          <a className="vz-site-nav-link vz-site-nav-current is-current"
            href="/validade-zero/" aria-current="page" onClick={() => setMenuOpen(false)}>
            <span className="vz-site-label-full">Validade Zero</span>
            <span className="vz-site-label-mobile">Validade Zero</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
