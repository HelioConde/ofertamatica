import { useId, useState } from 'react'
import {
  calculateDiscount, calculatePriceByWeight, calculatorKindForSlug,
  formatBrl, RETAIL_CALCULATOR_EXAMPLES,
} from '../seo/retailCalculators'
import '../styles/retail-calculators.css'

export default function RetailCalculator({ slug }) {
  const kind = calculatorKindForSlug(slug)
  const defaults = RETAIL_CALCULATOR_EXAMPLES[kind]
  const baseId = useId()
  const [first, setFirst] = useState(defaults?.primary || '')
  const [second, setSecond] = useState(defaults?.secondary || '')
  if (!defaults) return null
  const result = kind === 'weight' ? calculatePriceByWeight(first, second) : calculateDiscount(first, second)
  return (
    <section className="retail-calculator marketing-section" aria-labelledby={baseId + '-title'}>
      <div className="retail-calculator-intro">
        <span className="marketing-kicker">FERRAMENTA PRÁTICA E GRATUITA</span>
        <h2 id={baseId + '-title'}>{defaults.heading}</h2>
        <p>{defaults.lead}</p>
      </div>
      <div className="retail-calculator-layout">
        <div className="retail-calculator-fields">
          <label htmlFor={baseId + '-first'}>
            {kind === 'weight' ? 'Preço por kg (R$)' : 'Preço anterior (R$)'}
          </label>
          <input id={baseId + '-first'} type="text" inputMode="decimal" value={first}
            onChange={(event) => setFirst(event.target.value)} placeholder="Ex.: 14,90" maxLength={9} />
          <label htmlFor={baseId + '-second'}>
            {kind === 'weight' ? 'Peso do produto (gramas)' : 'Preço promocional (R$)'}
          </label>
          <input id={baseId + '-second'} type="text" inputMode={kind === 'weight' ? 'numeric' : 'decimal'}
            value={second} onChange={(event) => setSecond(event.target.value)}
            placeholder={kind === 'weight' ? 'Ex.: 350' : 'Ex.: 19,90'} maxLength={9} />
          <button type="button" onClick={() => { setFirst(defaults.primary); setSecond(defaults.secondary) }}>
            Restaurar exemplo
          </button>
        </div>
        <div className="retail-calculator-result" aria-live="polite" aria-atomic="true">
          <small>SIMULAÇÃO • VALORES DE EXEMPLO</small>
          {result ? (
            kind === 'weight' ? (
              <>
                <span>Valor proporcional para {result.grams.toLocaleString('pt-BR')} g</span>
                <strong>{formatBrl(result.totalCents)}</strong>
                <p>Referência do cartaz: <b>{formatBrl(result.centsPerKg)}/kg</b></p>
                <p>Referência para 100 g: aproximadamente {formatBrl(result.centsPer100g)}</p>
              </>
            ) : (
              <>
                <span>Economia ao comparar os valores</span>
                <strong>{formatBrl(result.savedCents)}</strong>
                <p>Desconto calculado: <b>{result.percent.toFixed(1).replace('.', ',')}%</b></p>
                <p>De {formatBrl(result.oldCents)} por {formatBrl(result.offerCents)}</p>
              </>
            )
          ) : (
            <p role="status" className="retail-calculator-error">
              {kind === 'weight' ? 'Informe um preço válido maior que zero e um peso inteiro entre 1 e 100.000 g.' :
                'Informe preços válidos. O preço anterior deve ser maior que o promocional.'}
            </p>
          )}
        </div>
      </div>
      <p className="retail-calculator-disclaimer">
        {kind === 'weight'
          ? 'O total é uma simulação com valores fictícios; pode haver diferença de arredondamento na balança e no caixa. A ferramenta não consulta preços reais. Revise produto, unidade e valor antes de imprimir.'
          : 'O cálculo não comprova que o preço anterior foi praticado nem que uma promoção está em conformidade com regras comerciais. Use somente preços e condições conferidos na loja.'}
      </p>
    </section>
  )
}
