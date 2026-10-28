// Curadoria inicial de alto contraste. Dados agregados só promovem modelos com amostra suficiente.
export const FEATURED_MODEL_IDS = [
  'oferta-dia', 'super-oferta', 'relampago', 'hortifruti',
  'foto-esquerda', 'foto-direita', 'foto-central',
  'classic', 'oferta-transparente', 'de-por', 'atacado',
]
export const MIN_GLOBAL_SELECTIONS = 5
const STORAGE_KEY = 'ofertamatica:model-usage:v1'
const MODEL_ID = /^[a-z0-9][a-z0-9-]{0,47}$/
const MAX_LOCAL_COUNT = 10000

export function sanitizeModelCounts(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw).filter(([id, count]) =>
      MODEL_ID.test(id) && Number.isInteger(count) && count > 0 && count <= 1000000
    ).slice(0, 100)
  )
}

export function readPersonalModelCounts() {
  try {
    if (typeof localStorage === 'undefined') return {}
    return sanitizeModelCounts(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'))
  } catch { return {} }
}

export function addPersonalModelSelection(counts, id) {
  if (!MODEL_ID.test(id)) return sanitizeModelCounts(counts)
  const next = sanitizeModelCounts(counts)
  next[id] = Math.min(MAX_LOCAL_COUNT, (next[id] || 0) + 1)
  return next
}

export function recordPersonalModelSelection(id) {
  if (!MODEL_ID.test(id)) return
  const next = addPersonalModelSelection(readPersonalModelCounts(), id)
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* preferência opcional */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('ofertamatica-model-usage'))
}

const priorityById = new Map(FEATURED_MODEL_IDS.map((id, index) => [id, index]))
export function sortPosterModels(models, { globalCounts = {}, personalCounts = {}, mode = 'featured' } = {}) {
  const original = new Map(models.map((model, index) => [model.id, index]))
  const curated = (id) => priorityById.has(id) ? 70 - priorityById.get(id) * 3 : 0
  const global = sanitizeModelCounts(globalCounts)
  const personal = sanitizeModelCounts(personalCounts)
  if (mode === 'original') return [...models]
  function score(model) {
    const id = model.id
    const globalCount = global[id] || 0
    const personalCount = personal[id] || 0
    if (mode === 'personal') return personalCount ? 200 + Math.log1p(personalCount) * 16 : curated(id)
    // Sinal público conta apenas escolhas com amostra mínima, nunca pageviews.
    return globalCount >= MIN_GLOBAL_SELECTIONS
      ? 120 + Math.log1p(globalCount) * 16
      : curated(id)
  }
  return [...models].sort((a, b) =>
    score(b) - score(a) || (original.get(a.id) - original.get(b.id))
  )
}

export function modelPopularityBadge(id, globalCounts) {
  if ((sanitizeModelCounts(globalCounts)[id] || 0) >= MIN_GLOBAL_SELECTIONS) return 'Em alta'
  if (FEATURED_MODEL_IDS.includes(id)) return 'Destaque'
  return ''
}
