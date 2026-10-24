import fs from 'node:fs'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const mode = process.argv[2]
if (!['--assets-only','--html-and-assets'].includes(mode))
  throw new Error('Uso: node scripts/verify-live-validade-zero.mjs --assets-only|--html-and-assets')

const origin = 'https://ofertamatica.com.br'
const sourceHtml = fs.readFileSync(path.resolve('dist/validade-zero/index.html'),'utf8')
const urls = [...sourceHtml.matchAll(/(?:src|href)="(\/validade-zero\/static\/[^"]+\.(?:js|css))"/g)].map(m=>m[1])
if (!urls.length) throw new Error('Nenhum JS/CSS estático do Validade Zero foi encontrado no build.')
for (const url of urls) {
  const local = path.resolve('dist',url.slice(1))
  if (!local.startsWith(path.resolve('dist') + path.sep) || !fs.existsSync(local))
    throw new Error('Asset local ausente: '+url)
}

async function checkStatic(url) {
  const response=await fetch(origin+url,{method:'GET',signal:AbortSignal.timeout(15000),headers:{'user-agent':'Ofertamatica-ValidadeZero-DeployCheck/1.0'}})
  try {
    if(!response.ok) throw new Error(url+': HTTP '+response.status)
    const mime=response.headers.get('content-type')||''
    if(url.endsWith('.js') && !/javascript|ecmascript/.test(mime))throw new Error(url+': Content-Type '+mime)
    if(url.endsWith('.css') && !/css/.test(mime))throw new Error(url+': Content-Type '+mime)
  } finally {await response.body?.cancel()}
}
let error
for(let attempt=0;attempt<6;attempt++){
  try {
    await Promise.all(urls.map(checkStatic))
    error=null
    break
  } catch(e){
    error=e
    if(attempt<5)await sleep(4000)
  }
}
if(error)throw error
console.log('[validade-zero] '+urls.length+' JS/CSS imutáveis publicados e acessíveis.')

if(mode==='--html-and-assets'){
  const response=await fetch(origin+'/validade-zero/',{redirect:'manual',signal:AbortSignal.timeout(15000)})
  const live=await response.text()
  if(response.status!==200)throw new Error('Validade Zero HTTP '+response.status+' (esperado 200, sem redirecionar).')
  for(const expected of [...urls,'id="root"','/validade-zero/manifest.json','<title>Validade Zero | Controle de vencimentos</title>']){
    if(!live.includes(expected))throw new Error('HTML publicado não contém: '+expected)
  }
  if(live.includes('helioconde.github.io/validade_zero/'))throw new Error('Página ainda aponta para GitHub Pages.')
  const policy=response.headers.get('permissions-policy')||''
  if(!policy.includes('camera=(self)'))throw new Error('A câmera foi bloqueada na resposta HTTP: '+(policy||'cabeçalho ausente'))
  const sw=await fetch(origin+'/validade-zero/push-sw.js',{signal:AbortSignal.timeout(10000)})
  if(!sw.ok)throw new Error('Service Worker Push indisponível: HTTP '+sw.status)
  console.log('[validade-zero] HTTP 200 direto, bundle correspondente, câmera permitida e Push SW acessível.')
}
