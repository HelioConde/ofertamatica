// Comparações promocionais precisam de dois preços válidos, sem descontos inventados.
// Aceita moeda brasileira: 19,90 · 1.299,90 · R$ 19,90 (e 19.90 em importações).
export function brlCents(value) {
  const raw = String(value ?? '').trim().replace(/^R\$\s*/i, '').replace(/\s/g, '')
  if (!raw) return null
  const grouped = /^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(raw)
  const brazilian = /^\d+(?:,\d{1,2})?$/.test(raw)
  const dotDecimal = /^\d+\.\d{1,2}$/.test(raw)
  if (!grouped && !brazilian && !dotDecimal) return null
  const normalized = (grouped || brazilian) ? raw.replace(/\./g, '').replace(',', '.') : raw
  const amount = Number(normalized)
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null
}

export function inspectDePor(regularPrice, offerPrice) {
  const regularCents = brlCents(regularPrice)
  const offerCents = brlCents(offerPrice)
  const valid = regularCents !== null && offerCents !== null && regularCents > offerCents
  return {
    valid,
    discountPercent: valid ? Math.round((regularCents - offerCents) * 100 / regularCents) : 0,
  }
}
