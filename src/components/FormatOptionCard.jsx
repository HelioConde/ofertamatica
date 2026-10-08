/**
 * Formatos oficiais compartilhados entre a primeira tela e /formatos/.
 * Os cartões e as miniaturas não devem divergir entre essas páginas.
 */
export const FORMAT_DISPLAY_DETAILS = {
  A4X8: { title: '8 cartazes A7', sheet: 'Imprime em 1 folha A4', use: 'Etiquetas grandes e gôndolas' },
  A4X4: { title: '4 cartazes A6', sheet: 'Imprime em 1 folha A4', use: 'Gôndolas e ofertas do dia' },
  A4X2_CIMA_BAIXO: { title: '2 cartazes por folha', sheet: 'Imprime em 1 folha A4', use: 'Balcão e ponta de gôndola' },
  A4X2_INVERTIDO: { title: '2 cartazes invertidos', sheet: 'Imprime em 1 folha A4', use: 'Dobra e exposição frente e verso' },
  A4X2_APP: { title: '2 ofertas de App', sheet: 'Folha A4 na horizontal', use: 'Preço exclusivo do aplicativo' },
  A4: { title: '1 cartaz A4', sheet: 'Folha A4 inteira', use: 'Ponta de gôndola e destaque' },
  A5: { title: '1 cartaz A5', sheet: 'Folha A5 inteira', use: 'Balcão e gôndolas menores' },
  A3: { title: '1 cartaz A3', sheet: 'Impressora compatível com A3', use: 'Vitrine e leitura à distância' },
}

export function FormatPreview({ format }) {
  const isSplit = format.postersPerSheet === 2 && format.rows === 2
  const isApp = format.specialLayout === 'app-offer'
  const isFour = format.postersPerSheet === 4
  const isEight = format.postersPerSheet === 8

  return (
    <div className="format-thumb" aria-hidden="true">
      <div className={`oferta-format-preview ${isSplit ? 'is-split' : ''} ${isApp ? 'is-app' : ''} ${isFour ? 'is-four' : ''} ${isEight ? 'is-eight' : ''}`}>
        {Array.from({ length: format.postersPerSheet }, (_, index) => (
          <div className={`oferta-format-mini ${format.invertedSlots.includes(index) ? 'is-inverted' : ''}`} key={index}>
            <span>OFERTA</span>
            <i />
            <b><small>R$</small><em>4,99</em></b>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FormatOptionCard({ format, onSelect, lastFormatId = '' }) {
  const details = FORMAT_DISPLAY_DETAILS[format.id]
  if (!details) return null

  return (
    <button
      type="button"
      className={'format-choice ' + (format.id === 'A4X4' ? 'is-recommended ' : '') + (format.id === lastFormatId ? 'is-last-used' : '')}
      data-format-id={format.id}
      onClick={() => onSelect(format.id)}
      // O texto visível inteiro será o nome acessível do botão.
      title={format.helpText}
    >
      <span className="format-choice-badges">
        {format.id === 'A4X8' ? <span className="format-economy">Economiza papel</span> : null}
        {format.id === 'A4X4' ? <span className="format-recommended">Mais usado</span> : null}
        {format.id === 'A3' ? <span className="format-impact">Maior destaque</span> : null}
        {format.id === lastFormatId ? <span className="format-last-used">Último usado</span> : null}
      </span>
      <FormatPreview format={format} />
      <span className="format-copy">
        <strong>{details.title}</strong>
        <small className="format-sheet">{details.sheet}</small>
        <span className="format-use">{details.use}</span>
        <span className="format-meta">{format.cartSize} por cartaz</span>
        <span className="format-card-action">Selecionar <span aria-hidden="true">→</span></span>
      </span>
    </button>
  )
}
