import './paper-guide.css'

export default function PaperGuide({ page }) {
  return (
    <article className="paper-guide" aria-label="Guia de papel para cartazes de oferta">
      <nav className="paper-guide-jump" aria-label="Nesta página">
        <span>Neste guia</span>
        <a href="#papel-gramatura">Tipo de papel</a>
        <a href="#papel-formatos">Tamanhos de folha</a>
        <a href="#papel-impressao">Como imprimir</a>
        <a href="#papel-duvidas">Dúvidas frequentes</a>
      </nav>

      <section className="marketing-section paper-guide-section" id="papel-gramatura">
        <div className="marketing-heading">
          <span className="marketing-kicker">ESCOLHA O MATERIAL</span>
          <h2>Qual tipo de papel e gramatura usar?</h2>
          <p>A gramatura, expressa em g/m², ajuda a indicar a espessura e a firmeza do material. As faixas abaixo são referências práticas, não requisitos: confirme sempre o limite da impressora.</p>
        </div>
        <div className="paper-guide-choices">
          {page.paperChoices.map((choice) => (
            <article key={choice.label}>
              <span>{choice.label}</span>
              <h3>{choice.paper}</h3>
              <strong>{choice.weight}</strong>
              <p>{choice.why}</p>
            </article>
          ))}
        </div>
        <div className="paper-guide-prose">
          {page.sections.slice(0, 2).map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.text}</p>
            </section>
          ))}
        </div>
      </section>

      <section className="marketing-section paper-guide-section" id="papel-formatos">
        <div className="marketing-heading">
          <span className="marketing-kicker">A4, A5 OU A3?</span>
          <h2>O tamanho da folha é diferente do tamanho do cartaz</h2>
          <p>Nos modelos divididos, você coloca dois, quatro ou oito cartazes em uma única folha. Abaixo estão os tamanhos físicos usados pelo gerador.</p>
        </div>
        <p className="paper-guide-table-hint">Deslize a tabela para os lados para conferir todos os tamanhos e usos <span aria-hidden="true">↔</span></p>
        <div className="paper-guide-table-wrap" role="region" tabIndex="0" aria-label="Tabela comparativa de formatos; deslize horizontalmente para ver todas as colunas">
          <table className="paper-guide-table">
            <caption>Comparação de folhas, cartazes e usos no mercado</caption>
            <thead><tr><th scope="col">Layout</th><th scope="col">Papel da impressora</th><th scope="col">Tamanho do cartaz</th><th scope="col">Onde usar</th></tr></thead>
            <tbody>
              {page.formatChoices.map((format) => (
                <tr key={format.id}>
                  <th scope="row">{format.name}</th>
                  <td>{format.sheet}</td>
                  <td>{format.area}</td>
                  <td>{format.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="paper-guide-tip">
          <strong>Importante:</strong> os cartazes A6 e A7 da ferramenta saem em uma folha <b>A4</b>. Você não precisa comprar papel A6 ou A7 para esses layouts: imprima a A4 e recorte.
        </div>
        <div className="paper-guide-prose">
          {page.sections.slice(2, 4).map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.text}</p>
            </section>
          ))}
        </div>
        <a className="paper-guide-related-link" href="/formatos/">Ver todos os formatos disponíveis no gerador <span aria-hidden="true">→</span></a>
      </section>

      <section className="marketing-section paper-guide-section" id="papel-impressao">
        <div className="marketing-heading">
          <span className="marketing-kicker">CHECKLIST DE IMPRESSÃO</span>
          <h2>5 passos para imprimir a placa no tamanho certo</h2>
          <p>Use o checklist antes de imprimir um lote inteiro.</p>
        </div>
        <ol className="paper-guide-steps">
          {page.printSteps.map((step, index) => (
            <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>
          ))}
        </ol>
        <div className="paper-guide-prose">
          {page.sections.slice(4).map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.text}</p>
            </section>
          ))}
        </div>
      </section>

      <section className="marketing-section paper-guide-section" id="papel-duvidas">
        <div className="marketing-heading">
          <span className="marketing-kicker">DÚVIDAS FREQUENTES</span>
          <h2>Respostas sobre papel e impressão de cartazes</h2>
        </div>
        <div className="paper-guide-faq">
          {page.faq.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <nav className="related-pages paper-guide-related" aria-label="Mais informações sobre cartazes">
        <span className="marketing-kicker">PRÓXIMOS PASSOS</span>
        <h2>Continue preparando suas placas de preço</h2>
        <div>
          {page.links.map((link) => (
            <a href={link.href} key={link.href}>{link.label}<span aria-hidden="true">→</span></a>
          ))}
        </div>
      </nav>
    </article>
  )
}
