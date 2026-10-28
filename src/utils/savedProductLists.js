// Listas nomeadas ficam somente no navegador; não substituem o rascunho.
export const SAVED_LISTS_KEY = 'ofertamatica:saved-product-lists:v1'
export const MAX_SAVED_LISTS = 12
export const MAX_LIST_TEXT_LENGTH = 15000
export const MAX_LIST_NAME_LENGTH = 48

export function normalizeListName(name) {
  return String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_LIST_NAME_LENGTH)
}

export function validSavedLists(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  return value.filter((item) => {
    if (!item || typeof item !== 'object' || typeof item.sourceText !== 'string') return false
    if (typeof item.id !== 'string' || !/^[a-z0-9-]{5,80}$/i.test(item.id)) return false
    const name = normalizeListName(item.name)
    if (name.length < 2 || !item.sourceText.trim() || item.sourceText.length > MAX_LIST_TEXT_LENGTH) return false
    const key = name.toLocaleLowerCase('pt-BR')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, MAX_SAVED_LISTS).map((item) => ({
    id: item.id,
    name: normalizeListName(item.name),
    sourceText: item.sourceText,
    formatId: typeof item.formatId === 'string' ? item.formatId.slice(0, 24) : 'A4X4',
    savedAt: Number.isFinite(item.savedAt) && item.savedAt > 0 ? item.savedAt : 0,
  }))
}

export function loadSavedLists(storage) {
  try {
    return validSavedLists(JSON.parse(storage?.getItem(SAVED_LISTS_KEY) || '[]'))
  } catch {
    return []
  }
}

function persistSavedLists(storage, lists) {
  try {
    if (!storage) return { ok: false, error: 'Armazenamento indisponível neste navegador.' }
    storage.setItem(SAVED_LISTS_KEY, JSON.stringify(lists))
    return { ok: true, lists }
  } catch {
    return { ok: false, error: 'Não foi possível salvar no navegador. Confira o espaço disponível ou as permissões de armazenamento.' }
  }
}

export function saveNamedList(storage, previous, { name, sourceText, formatId }) {
  const cleanName = normalizeListName(name)
  const source = String(sourceText ?? '').trim()
  if (cleanName.length < 2) return { ok: false, error: 'Informe um nome com pelo menos 2 caracteres.' }
  if (!source) return { ok: false, error: 'Cole ou importe produtos antes de salvar a lista.' }
  if (source.length > MAX_LIST_TEXT_LENGTH) return { ok: false, error: 'A lista é muito grande. Salve em um arquivo TXT ou divida em partes menores.' }
  const existing = validSavedLists(previous)
  const index = existing.findIndex((item) => item.name.toLocaleLowerCase('pt-BR') === cleanName.toLocaleLowerCase('pt-BR'))
  if (index < 0 && existing.length >= MAX_SAVED_LISTS) {
    return { ok: false, error: 'Limite de ' + MAX_SAVED_LISTS + ' listas salvas. Exclua uma lista antiga antes de criar outra.' }
  }
  const previousItem = index >= 0 ? existing[index] : null
  const item = {
    id: previousItem?.id || 'lista-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9),
    name: cleanName,
    sourceText: source,
    formatId: typeof formatId === 'string' ? formatId.slice(0, 24) : 'A4X4',
    savedAt: Date.now(),
  }
  const next = [item, ...existing.filter((value) => value.id !== previousItem?.id)]
  return persistSavedLists(storage, next)
}

export function deleteNamedList(storage, previous, id) {
  const existing = validSavedLists(previous)
  if (!existing.some((item) => item.id === id)) return { ok: false, error: 'Lista não encontrada.' }
  return persistSavedLists(storage, existing.filter((item) => item.id !== id))
}

export function exportNamedListText(item) {
  return item && typeof item.sourceText === 'string' ? item.sourceText : ''
}

export function suggestedListFilename(name) {
  const normalized = String(name ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const safe = normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
  return (safe || 'lista-produtos') + '.txt'
}
