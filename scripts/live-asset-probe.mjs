// O navegador solicita URLs de assets com hash SEM parâmetros aleatórios.
// Nunca use o resultado deste módulo para liberar HTML sem JS/CSS válidos.
export function browserAssetUrl(resource, origin) {
  if (!/^\/assets\/[A-Za-z0-9._-]+\.(?:js|css)$/.test(resource)) {
    throw new Error('Referência de asset imutável inválida')
  }
  const url = new URL(resource, origin)
  url.search = ''
  url.hash = ''
  return url
}

export function validAssetMime(resource, status, contentType) {
  const type = String(contentType || '').toLowerCase()
  if (status !== 200) return false
  if (resource.endsWith('.js')) return /javascript|ecmascript/.test(type)
  if (resource.endsWith('.css')) return /text\/css/.test(type)
  return false
}

// Só identifica a CLASSE do problema; nunca imprime o HTML bruto, cookies ou IP.
export function unexpectedDocumentClass(contentType, sample = '') {
  if (!/html/i.test(contentType || '')) return 'mime_incorreto'
  const normalized = String(sample).slice(0, 16000).normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (/verificacao de seguranca|security verification|checking your browser|captcha|just a moment/i.test(normalized)) {
    return 'possivel_desafio_waf'
  }
  if (/<div\s+id=["']root["']/i.test(sample)) return 'html_do_aplicativo_em_vez_de_asset'
  return 'html_inesperado_em_vez_de_asset'
}
