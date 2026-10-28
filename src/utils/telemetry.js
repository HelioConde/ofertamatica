/**
 * Monitoramento próprio, separado do GA4/GTM.
 * Não cria identificadores nem envia requisições sem consentimento analítico.
 * Sessão aleatória somente nesta aba. Nenhum IP ou conteúdo de cartazes enviado.
 */
let started = false
let lastView = ''
let memorySession = ''
let memorySource = ''

const sessionKey = 'ofertamatica:telemetry-session:v1'
const sourceKey = 'ofertamatica:telemetry-source:v1'
const events = new Set([
  'page_view', 'format_selected', 'print_started', 'pdf_started',
  'background_print_started', 'free_editor_print', 'free_editor_pdf', 'gallery_background_print',
  'model_selected',
])

function enabled() {
  return window.ofertaConsent?.getState()?.analyticsEnabled === true
}

function sessionValue(key, fallback) {
  try { return sessionStorage.getItem(key) || fallback } catch { return fallback }
}

function storeSession(key, value) {
  try { sessionStorage.setItem(key, value) } catch { /* Sessão somente em memória */ }
}

function sessionId() {
  let id = sessionValue(sessionKey, memorySession)
  if (!/^[a-f0-9]{32}$/.test(id)) {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    storeSession(sessionKey, id)
  }
  memorySession = id
  return id
}

function channel() {
  const existing = sessionValue(sourceKey, memorySource)
  if (existing) return existing
  const query = new URLSearchParams(window.location.search)
  const paid = query.has('gclid') || query.has('msclkid') ||
    /^(cpc|ppc|paid|display)$/i.test(query.get('utm_medium') || '')
  let category = paid ? 'Campanha' : 'Direto'
  if (!paid) {
    try {
      const ref = new URL(document.referrer)
      const hostname = ref.hostname.toLowerCase()
      if (hostname === location.hostname) category = 'Direto'
      else if (hostname === 'google.com' || /(^|\.)google\.[a-z.]+$/.test(hostname)) category = 'Google'
      else if (hostname === 'bing.com' || hostname.endsWith('.bing.com')) category = 'Bing'
      else if (/duckduckgo|yahoo|ecosia|baidu/.test(hostname)) category = 'Outras buscas'
      else if (/instagram|facebook|tiktok|youtube|twitter|x\.com|linkedin|whatsapp/.test(hostname)) category = 'Redes sociais'
      else if (hostname) category = 'Outros sites'
    } catch { /* Sem referrer */ }
    if (query.has('utm_source') && category === 'Direto') category = 'Campanha'
  }
  memorySource = category
  storeSession(sourceKey, category)
  return category
}

function pathOnly() {
  const pathname = window.location.pathname || '/'
  if (/^\/(monitoramento|api)(\/|$)/.test(pathname)) return null
  return /^[a-zA-Z0-9/_-]{0,120}$/.test(pathname) ? pathname : '/'
}

export function trackEvent(event, details = {}) {
  if (!started || !enabled() || !events.has(event) || typeof window === 'undefined') return
  const path = pathOnly()
  if (!path) return
  const modelId = event === 'model_selected' && /^[a-z0-9][a-z0-9-]{0,47}$/.test(details.modelId || '')
    ? details.modelId : ''
  if (event === 'model_selected' && !modelId) return
  const payload = JSON.stringify({ consented: true, event, path, source: channel(), session: sessionId(),
    ...(modelId ? { model_id: modelId } : {}) })
  // A própria requisição não transporta cookies; nenhum rastreamento externo.
  try {
    fetch('/api/telemetria.php', {
      method: 'POST',
      body: payload,
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      cache: 'no-store',
    }).catch(() => {})
  } catch { /* Estatísticas nunca bloqueiam o editor. */ }
}

function pageView() {
  if (!enabled()) {
    lastView = ''
    memorySession = ''
    memorySource = ''
    try {
      sessionStorage.removeItem(sessionKey)
      sessionStorage.removeItem(sourceKey)
    } catch { /* Nenhuma sessão identificável retida em memória. */ }
    return
  }
  const path = pathOnly()
  if (path && path !== lastView) {
    lastView = path
    trackEvent('page_view')
  }
}

export function startTelemetry() {
  if (started || typeof window === 'undefined') return
  started = true
  window.addEventListener('oferta-consent-change', pageView)
  window.addEventListener('popstate', pageView)
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method]
    history[method] = function (...args) {
      const result = original.apply(this, args)
      pageView()
      return result
    }
  }
  pageView()
}
