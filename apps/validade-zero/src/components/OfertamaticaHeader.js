import React from 'react';
import './OfertamaticaHeader.css';

// Mesma ordem, títulos e ícone do menu do Ofertamática.
// Os links voltam ao criador; o Validade Zero permanece app independente na rota atual.
const LINKS = [
  ['/', 'Criar placas', 'Criar'],
  ['/modelos/', 'Modelos', 'Modelos'],
  ['/editor-livre/', 'Editor livre', 'Editor'],
  ['/formatos/', 'Formatos', 'Formatos'],
  ['/como-funciona/', 'Como funciona', 'Como'],
  ['/guias-para-varejo/', 'Guias para varejo', 'Guias'],
  ['/validade-zero/', 'Validade Zero', 'Validade'],
];

export default function OfertamaticaHeader() {
  return (
    <header className="vz-site-header no-print">
      <div className="vz-site-nav-shell">
        <a className="vz-site-brand" href="/" aria-label="Ofertamática — voltar ao criador de cartazes">
          <img className="vz-site-brand-icon"
            src="/icons/icon-192.png?v=20261008b" width="36" height="36" alt="" decoding="async"/>
          <span className="vz-site-brand-copy">
            <span className="vz-site-brand-name">Ofertamática</span>
            <span className="vz-site-product">Validade Zero</span>
          </span>
        </a>
        <nav className="vz-site-main-nav" aria-label="Navegação principal do Ofertamática">
          {LINKS.map(([href, desktop, mobile]) => {
            const active = href === '/validade-zero/';
            return (
              <a
                className={'vz-site-nav-link' + (active ? ' is-current' : '')}
                href={href}
                key={href}
                aria-current={active ? 'page' : undefined}
              >
                <span className="vz-site-label-full">{desktop}</span>
                <span className="vz-site-label-mobile">{mobile}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
