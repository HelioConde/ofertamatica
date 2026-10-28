import { parseProductList } from '../poster-engine/parseProduct.js'

// A prévia usa exatamente o mesmo parser da produção. Não tenta validar
// preços comerciais reais nem declarar que a oferta está aprovada.
export const REVIEW_SAMPLE = [
  'Produto\tMarca\tUnidade\tPreço',
  'Café\tMelitta\t500 g\t18,90',
  'Pão de queijo KG 20,90',
  'Leite integral 1 L',
].join('\n')

export const REVIEW_MAX_LINES = 80
export const REVIEW_MAX_CHARS = 12000

function keyFor(product) {
  return [product.description, product.subdescription, product.complement, product.unit]
    .join('|').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
}

export function inspectRetailList(input) {
  const text = String(input ?? '')
  const lineCount = text.split(/\r?\n/).filter((line) => line.trim()).length
  if (text.length > REVIEW_MAX_CHARS || lineCount > REVIEW_MAX_LINES + 1) {
    return {
      rows: [], ready: 0, attention: 0, total: 0,
      error: `A prévia aceita até ${REVIEW_MAX_LINES} produtos e ${REVIEW_MAX_CHARS.toLocaleString('pt-BR')} caracteres. Divida a lista em lotes menores.`,
    }
  }

  const products = parseProductList(text)
  const seen = new Set()
  const rows = products.map((product) => {
    const issues = []
    const name = [product.description, product.subdescription, product.complement].filter(Boolean).join(' ')
    if (!name || name.length < 2) issues.push('Descrição insuficiente')
    if (!product.price) issues.push('Preço ausente')
    if (!product.unit) issues.push('Conferir unidade de venda')
    const key = keyFor(product)
    if (seen.has(key)) issues.push('Possível produto repetido')
    seen.add(key)
    return {
      id: product.id,
      name: name || 'Sem descrição',
      unit: product.unit || '—',
      price: product.price || '—',
      issues,
      ready: issues.length === 0,
    }
  })
  return {
    rows,
    total: rows.length,
    ready: rows.filter((row) => row.ready).length,
    attention: rows.filter((row) => !row.ready).length,
    error: '',
  }
}
