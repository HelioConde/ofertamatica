import { useState } from 'react'
import { HOME_GUIDANCE, HOME_LIMITATIONS, HOME_PRINT_OPTIONS, calculatePrintPlan } from '../seo/homePrintHelp'
import '../styles/home-print-help.css'

export default function HomePrintHelp() {
  const [quantity, setQuantity] = useState('37')
  const [formatId, setFormatId] = useState('A4X4')
  const plan = calculatePrintPlan(quantity, formatId)

  return (
    <section className="home-print-help" aria-labelledby="home-print-help-title">
      <header className="home-print-help-heading">
        <span>ANTES DE IMPRIMIR</span>
        <h2 id="home-print-help-title">Planeje suas placas sem desperdiçar papel</h2>
        <p>Um guia rápido para quem prepara dezenas de ofertas: calcule as folhas, confira os dados e imprima no tamanho certo. O gerador continua disponível logo acima, sem cadastro.</p>
      </header>
      <div className="home-print-help-grid">
        <div className="home-print-plan">
          <h3>Quantas folhas preciso para minhas ofertas?</h3>
          <div className="home-print-plan-fields">
            <label>
              <span>Quantidade de cartazes</span>
              <input type="number" inputMode="numeric" min="1" max="9999" step="1" value={quantity}
                onChange={(event) => setQuantity(event.target.value)} />
            </label>
            <label>
              <span>Como vou imprimir</span>
              <select value={formatId} onChange={(event) => setFormatId(event.target.value)}>
                {HOME_PRINT_OPTIONS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
              </select>
            </label>
          </div>
          <div className="home-print-plan-result" aria-live="polite" aria-atomic="true">
            <span>Para {plan.quantity} {plan.quantity === 1 ? 'cartaz' : 'cartazes'}</span>
            <strong>{plan.sheets} {plan.sheets === 1 ? 'folha' : 'folhas'} {plan.option.paper}</strong>
            <small>{plan.freeSlots === 0 ? 'Todas as posições serão utilizadas.' :
              `${plan.freeSlots} ${plan.freeSlots === 1 ? 'posição ficará livre' : 'posições ficarão livres'} na última folha.`}</small>
          </div>
          <p>É uma estimativa de folhas, sem incluir provas, perdas ou reimpressões. A impressora precisa aceitar o papel escolhido.</p>
          <a href="/qual-papel-usar-para-cartaz/">Veja quais papéis e gramaturas são adequados</a>
        </div>
        <div className="home-print-guide">
          <h3>Da lista do estoque ao cartaz impresso</h3>
          <ol>
            {HOME_GUIDANCE.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <aside className="home-print-boundary">
        <strong>O que a ferramenta faz — e o que você deve conferir</strong>
        <p>{HOME_LIMITATIONS}</p>
        <nav aria-label="Continuar aprendendo a criar cartazes">
          <a href="/como-funciona/">Como funciona</a>
          <a href="/placas-para-hortifruti/">Preços por kg no hortifruti</a>
          <a href="/placas-para-padaria/">Placas para padaria</a>
        </nav>
      </aside>
    </section>
  )
}
