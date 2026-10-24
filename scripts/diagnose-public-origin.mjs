// Diagnóstico SOMENTE-LEITURA do domínio publicado; não consulta credenciais nem banco.
const origin = 'https://ofertamatica.com.br'
const paths = [
  '/',
  '/robots.txt',
  '/assets/index-g71VLkg9.js',
  '/assets/index-ClZQTKks.css',
  '/validade-zero/',
  '/validade-zero/static/js/main.40031d69.js',
  '/validade-zero/push-sw.js'
]
const timeout = 12000
async function probe(p) {
  try {
    const url = origin + p + '?origin_diagnostic=' + Date.now()
    const r = await fetch(url,{
      redirect:'manual',
      signal:AbortSignal.timeout(timeout),
      headers:{'cache-control':'no-cache','accept':'*/*','user-agent':'Ofertamatica-Origin-Diagnostics/1.0'}
    })
    const text = await r.text()
    const html = /^\s*<!doctype html|^\s*<html/i.test(text) || (r.headers.get('content-type')||'').includes('text/html')
    const title = html ? (text.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]||'(sem title)').slice(0,110) : '-'
    // Nunca registrar valores secretos, cookies, corpo de respostas ou cabeçalhos sensíveis.
    return {path:p, status:r.status, type:r.headers.get('content-type')||'-',
      length:text.length, htmlTitle:title,
      location:(r.headers.get('location')||'').slice(0,180),
      server:(r.headers.get('server')||'').slice(0,90),
      cache:(r.headers.get('x-cache')||r.headers.get('cf-cache-status')||'').slice(0,60)}
  } catch(e){return{path:p,error:String(e.message||e).slice(0,130)}}
}
const results=await Promise.all(paths.map(probe))
console.log('Diagnóstico do domínio público (sem credenciais):')
for(const x of results)console.log(JSON.stringify(x))
const assets=results.filter(x=>x.path.startsWith('/assets/')||x.path.includes('/static/'))
const bad=assets.filter(x=>x.status!==200 || !(/javascript|ecmascript|css/i.test(x.type||'')))
if(bad.length)console.log('AVISO: '+bad.length+' arquivos estáticos retornaram HTML, status inesperado ou erro. Não trocar HTML de produção.')
// Diagnóstico não deve falhar; o deploy de produção continua tendo sua própria trava de segurança.
