import { setTimeout as sleep } from 'node:timers/promises'

// Verificação após o upload FTP. Não depende de serviços pagos nem de navegador.
// Acompanha principalmente a regressão: URL especializada retornando HTML da home.
const origin = 'https://ofertamatica.com.br'
const checks = [
  { name: 'Home', url: origin + '/', status: 200, contains: ['Criar Placas de Preço e Cartazes Grátis', '"@type": "WebSite"', '/modelos/', '/formatos/'] },
  { name: 'Modelos', url: origin + '/modelos/', status: 200, contains: ['Modelos de Placas de Preço Grátis', 'https://ofertamatica.com.br/modelos/'] },
  { name: 'Formatos', url: origin + '/formatos/', status: 200, contains: ['Cartaz A4, A5 e A3 para Imprimir', 'https://ofertamatica.com.br/formatos/'] },
  { name: 'Guia padaria', url: origin + '/placas-para-padaria/', status: 200, contains: ['Placas de Preço para Padaria Grátis', 'https://ofertamatica.com.br/placas-para-padaria/'] },
  { name: 'Guia Excel', url: origin + '/cartazes-a-partir-de-excel/', status: 200, contains: ['Criar Cartazes a Partir do Excel Grátis', 'https://ofertamatica.com.br/cartazes-a-partir-de-excel/'] },
  { name: 'Hub de guias', url: origin + '/guias-para-varejo/', status: 200, contains: ['/placas-para-padaria/', '/cartazes-a-partir-de-excel/'] },
  { name: 'Sitemap', url: origin + '/sitemap.xml', status: 200, contains: ['/placas-para-padaria/', '/cartazes-a-partir-de-excel/'] },
  { name: 'ads.txt', url: origin + '/ads.txt', status: 200, contains: ['google.com, pub-9514218545388169, DIRECT'] },
  { name: 'llms.txt', url: origin + '/llms.txt', status: 200, contains: ['# Ofertamática', 'https://ofertamatica.com.br/modelos/'] },
  { name: 'Catálogo agentes', url: origin + '/ai-catalog.json', status: 200, contains: ['"specVersion": "1.0"', '"entries"'] },
  { name: 'Catálogo agentes well-known', url: origin + '/.well-known/ai-catalog.json', status: 200, contains: ['"specVersion": "1.0"', '"entries"'] },
  { name: '301 legado supermercado', url: origin + '/cartazes-para-supermercado', status: 301, location: '/cartaz-para-supermercado/' },
  { name: '301 legado Excel', url: origin + '/excel-para-cartazes', status: 301, location: '/cartazes-a-partir-de-excel/' },
  { name: '301 host www', url: 'https://www.ofertamatica.com.br/', status: 301, location: 'https://ofertamatica.com.br/' },
  { name: '404 página inexistente', url: origin + '/rota-inexistente-seo-check-2026/', status: 404 },
  { name: '410 login antigo', url: origin + '/login', status: 410 },
  { name: '410 cadastro antigo', url: origin + '/registro', status: 410 },
]

async function checkPage(check) {
  const response = await fetch(check.url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(12000),
    headers: { 'user-agent': 'Ofertamatica-SEO-SmokeTest/1.0' },
  })
  const errors = []
  if (response.status !== check.status) errors.push('HTTP ' + response.status + ', esperado ' + check.status)
  if (check.location) {
    const location = response.headers.get('location') || ''
    if (!location.includes(check.location)) errors.push('Location inesperado: ' + (location || '(ausente)'))
  }
  if (check.contains && response.status === 200) {
    const html = await response.text()
    for (const term of check.contains) if (!html.includes(term)) errors.push('Não contém: ' + term)
  } else {
    await response.body?.cancel()
  }
  return errors.length ? check.name + ': ' + errors.join('; ') : null
}

let errors = []
for (let attempt = 1; attempt <= 5; attempt += 1) {
  errors = []
  for (const check of checks) {
    try {
      const error = await checkPage(check)
      if (error) errors.push(error)
    } catch (error) {
      errors.push(check.name + ': falha de acesso (' + error.message + ')')
    }
  }
  if (errors.length === 0) {
    console.log('SEO publicado: ' + checks.length + ' verificações HTTP, redirecionamentos e sitemap passaram.')
    process.exit(0)
  }
  console.warn('Verificação pós-deploy ' + attempt + '/5: ' + errors.join(' | '))
  if (attempt < 5) await sleep(15000)
}
console.error('A produção ainda não reflete o build validado:\n' + errors.map((error) => ' - ' + error).join('\n'))
process.exitCode = 1
