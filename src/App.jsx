const formats = ['A4 · 4×1', 'A4 · 2×1', 'A4 · 1×1', 'A3', 'SRA3']

function App() {
  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Ofertamática">
          <span className="brand-mark">O</span>
          <span>Ofertamática</span>
        </a>

        <nav className="nav" aria-label="Navegação principal">
          <a href="#produto">Produto</a>
          <a href="#recursos">Recursos</a>
          <a href="#formatos">Formatos</a>
        </nav>

        <button className="ghost-button" type="button">Entrar</button>
      </header>

      <section className="hero" id="produto">
        <div className="hero-copy">
          <span className="eyebrow">OFERTAMÁTICA V2 · EM DESENVOLVIMENTO</span>
          <h1>Cartazes de oferta prontos para vender mais.</h1>
          <p>
            Crie comunicação promocional para supermercado e varejo com velocidade,
            consistência visual e inteligência no preenchimento dos produtos.
          </p>

          <div className="hero-actions">
            <button className="primary-button" type="button">Criar meu primeiro cartaz</button>
            <a className="text-link" href="#formatos">Ver formatos</a>
          </div>

          <div className="trust-row">
            <span>Descrição inteligente</span>
            <span>Preço em destaque</span>
            <span>Pronto para impressão</span>
          </div>
        </div>

        <div className="poster-stage" aria-label="Prévia de cartaz promocional">
          <div className="poster-card">
            <div className="poster-topline">
              <span>OFERTA</span>
              <span>HOJE</span>
            </div>
            <div className="poster-product">CAFÉ TRADICIONAL</div>
            <div className="poster-detail">500 g</div>
            <div className="poster-price">
              <span className="currency">R$</span>
              <strong>18</strong>
              <span className="cents">,99</span>
            </div>
            <div className="poster-footer">cada</div>
          </div>
          <div className="stage-note">Prévia em tempo real</div>
        </div>
      </section>

      <section className="feature-grid" id="recursos">
        <article>
          <span>01</span>
          <h2>Digite. A IA organiza.</h2>
          <p>Produto, complemento, unidade e preço entram na hierarquia correta automaticamente.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Edite sem quebrar o layout.</h2>
          <p>O cartaz preserva legibilidade e proporção enquanto você ajusta o conteúdo.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Imprima no formato certo.</h2>
          <p>Modelos pensados para a rotina real de lojas, setores e campanhas promocionais.</p>
        </article>
      </section>

      <section className="formats" id="formatos">
        <div>
          <span className="eyebrow">FORMATOS</span>
          <h2>Comece pelo tamanho. O restante se adapta.</h2>
        </div>
        <div className="format-list">
          {formats.map((format) => (
            <button type="button" key={format}>{format}</button>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
