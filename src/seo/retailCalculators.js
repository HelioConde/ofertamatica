// Ferramentas educativas para conferir exemplos de etiquetas, sem consultar preços reais.
// Preços em centavos inteiros: evita artefatos binários nos totais exibidos.
export const RETAIL_CALCULATOR_PAGES = Object.freeze({
  'placas-para-hortifruti': 'weight',
  'placas-para-padaria': 'weight',
  'cartazes-para-acougue': 'weight',
  'cartaz-de-por': 'discount',
  'cartaz-black-friday': 'discount',
})

export const RETAIL_CALCULATOR_EXAMPLES = Object.freeze({
  weight: {
    heading: 'Simulador de preço por peso',
    lead: 'Para produtos anunciados por quilo, confira quanto custaria um peso específico. O cartaz continua mostrando o preço por kg.',
    primary: '14,90',
    secondary: '350',
    product: 'BANANA PRATA',
    unit: 'kg',
  },
  discount: {
    heading: 'Conferir oferta De/Por',
    lead: 'Calcule a diferença e o percentual entre um preço anterior e um preço promocional. Confirme que o preço anterior era realmente praticado.',
    primary: '24,90',
    secondary: '19,90',
    product: 'ARROZ 5 KG',
    unit: 'unidade',
  },
})

export function parseBrlCents(value) {
  const raw = String(value ?? '').trim()
  if (!/^\d{1,6}(?:[,.]\d{1,2})?$/.test(raw)) return null
  const [whole, decimal = ''] = raw.replace(',', '.').split('.')
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents <= 99999999 ? cents : null
}

export function formatBrl(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export function calculatePriceByWeight(pricePerKg, grams) {
  const cents = parseBrlCents(pricePerKg)
  const weight = Number(grams)
  if (cents === null || cents <= 0 || !Number.isInteger(weight) || weight < 1 || weight > 100000) return null
  return {
    centsPerKg: cents,
    grams: weight,
    totalCents: Math.round(cents * weight / 1000),
    centsPer100g: Math.round(cents / 10),
  }
}

export function calculateDiscount(oldPrice, offerPrice) {
  const oldCents = parseBrlCents(oldPrice)
  const offerCents = parseBrlCents(offerPrice)
  if (oldCents === null || offerCents === null || oldCents <= 0 || offerCents < 0 || offerCents >= oldCents) return null
  const savedCents = oldCents - offerCents
  return {
    oldCents, offerCents, savedCents,
    percent: Math.round((savedCents / oldCents) * 1000) / 10,
  }
}

export function calculatorKindForSlug(slug) {
  return RETAIL_CALCULATOR_PAGES[slug] || null
}

export function calculatorStaticExample(slug) {
  const kind = calculatorKindForSlug(slug)
  if (kind === 'weight') {
    const result = calculatePriceByWeight('14,90', 350)
    return {
      kind,
      title: 'Simulador de preço por peso: exemplo de conferência',
      input: 'BANANA PRATA — R$ 14,90 por kg · peso: 350 g',
      output: 'Total ilustrativo: ' + formatBrl(result.totalCents) + ' pelos 350 g',
      note: 'Valor fictício, não cotação atual nem preço verificado no caixa. A placa deve informar R$ 14,90/kg e não apenas o valor do peso de exemplo.',
    }
  }
  if (kind === 'discount') {
    const result = calculateDiscount('24,90', '19,90')
    return {
      kind,
      title: 'Comparador De/Por: exemplo de conferência',
      input: 'Preço anterior: R$ 24,90 · preço da oferta: R$ 19,90',
      output: 'Economia ilustrativa: ' + formatBrl(result.savedCents) + ' (' + result.percent.toFixed(1).replace('.', ',') + '%)',
      note: 'Preços fictícios. Só anuncie De/Por quando houver comprovação do preço anterior e clareza sobre período e condições da oferta.',
    }
  }
  return null
}
