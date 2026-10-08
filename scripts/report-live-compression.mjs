// Inspeciona a compactação HTTP da versão REAL publicada, sem bloquear deploys
// quando o Apache/host não oferece gzip/br. O relatório orienta a configuração.
const origin = process.env.OFERTAMATICA_ORIGIN || 'https://ofertamatica.com.br'
const timeoutMs = 16000
const results = []

async function check(name, path) {
  const url = new URL(path, origin)
  url.searchParams.set('compression-check', String(Date.now()))
  try {
    const response = await fetch(url, {
      headers: {
        'accept-encoding': 'gzip, br',
        'cache-control': 'no-cache',
        'user-agent': 'Ofertamatica-Compression-QA/1.0',
      },
      signal: AbortSignal.timeout(timeoutMs),
    })
    const encoding = response.headers.get('content-encoding') || 'sem compressão'
    const length = Number(response.headers.get('content-length')) || null
    const size = response.ok ? (await response.arrayBuffer()).byteLength : 0
    results.push({ name, status: response.status, encoding, length, size })
    if (!response.ok || (size > 2048 && encoding === 'sem compressão')) {
      console.warn('::warning::' + name + ' HTTP ' + response.status + ': ' + encoding)
    }
    return response.ok ? { text: name === 'HTML' ? new TextDecoder().decode(new Uint8Array(await Promise.resolve(new ArrayBuffer(0)))) : null } : null
  } catch (error) {
    results.push({ name, status: 'erro', encoding: 'não verificado', length: null, size: 0 })
    console.warn('::warning::Não foi possível verificar ' + name + ': ' + String(error.message || error))
    return null
  }
}

async function checkAsset(name, url) {
  const address = new URL(url, origin)
  address.searchParams.set('compression-check', String(Date.now()))
  try {
    const response = await fetch(address, {
      headers: { 'accept-encoding': 'gzip, br', 'cache-control': 'no-cache', 'user-agent': 'Ofertamatica-Compression-QA/1.0' },
      signal: AbortSignal.timeout(timeoutMs),
    })
    const encoding = response.headers.get('content-encoding') || 'sem compressão'
    const size = response.ok ? (await response.arrayBuffer()).byteLength : 0
    results.push({ name, status: response.status, encoding, size })
    if (!response.ok || (size > 2048 && encoding === 'sem compressão')) {
      console.warn('::warning::' + name + ': ' + encoding)
    }
  } catch (error) {
    results.push({ name, status: 'erro', encoding: 'não verificado', size: 0 })
    console.warn('::warning::Falha ao verificar ' + name + ': ' + String(error.message || error))
  }
}

try {
  const response = await fetch(origin + '/?compression-check=' + Date.now(), {
    headers: { 'accept-encoding': 'gzip, br', 'cache-control': 'no-cache', 'user-agent': 'Ofertamatica-Compression-QA/1.0' },
    signal: AbortSignal.timeout(timeoutMs),
  })
  const encoding = response.headers.get('content-encoding') || 'sem compressão'
  const html = await response.text()
  results.push({ name: 'HTML inicial', status: response.status, encoding, size: Buffer.byteLength(html) })
  if (response.ok && Buffer.byteLength(html) > 2048 && encoding === 'sem compressão') {
    console.warn('::warning::HTML inicial não está comprimido no servidor')
  }
  const js = html.match(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+\.js)["']/i)?.[1]
  const css = html.match(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+\.css)["']/i)?.[1]
  if (js) await checkAsset('JavaScript principal', js)
  if (css) await checkAsset('CSS principal', css)
  await checkAsset('Consentimento', '/consent-bootstrap.js')
} catch (error) {
  console.warn('::warning::Não foi possível avaliar a compactação HTTP: ' + String(error.message || error))
}

console.log('### Compactação HTTP — produção')
console.log('')
console.log('| Recurso | HTTP | Content-Encoding | Tamanho após decodificação |')
console.log('|---|---:|---|---:|')
for (const item of results) {
  console.log('| ' + item.name + ' | ' + item.status + ' | ' + item.encoding + ' | ' + item.size + ' bytes |')
}
if (results.some((item) => item.size > 2048 && item.encoding === 'sem compressão')) {
  console.log('')
  console.log('**Atenção:** a hospedagem ainda não comprime todos os recursos de texto; conferir mod_deflate/Brotli e cache/CDN.')
}
