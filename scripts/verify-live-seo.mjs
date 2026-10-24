import { setTimeout as sleep } from 'node:timers/promises'
import { PUBLIC_PAGES } from '../src/seo/seoPages.js'

// Verificação após o upload FTP. Não depende de serviços pagos nem de navegador.
// Acompanha principalmente a regressão: URL especializada retornando HTML da home.
const origin = 'https://ofertamatica.com.br'
const checks = [
  { name: 'Home', url: origin + '/', status: 200, contains: ['Criar Placas de Preço e Cartazes Grátis', '"@type": "WebSite"', '/modelos/', '/formatos/'] },
  { name: 'Modelos', url: origin + '/modelos/', status: 200, contains: [PUBLIC_PAGES.find((page) => page.slug === 'modelos').title, 'https://ofertamatica.com.br/modelos/'] },
  { name: 'Formatos', url: origin + '/formatos/', status: 200, contains: ['Cartaz A4, A5 e A3 para Imprimir', 'https://ofertamatica.com.br/formatos/'] },
  { name: 'Guia padaria', url: origin + '/placas-para-padaria/', status: 200, contains: ['Placas de Preço para Padaria Grátis', 'https://ofertamatica.com.br/placas-para-padaria/'] },
  { name: 'Guia Excel', url: origin + '/cartazes-a-partir-de-excel/', status: 200, contains: ['Criar Cartazes a Partir do Excel Grátis', 'https://ofertamatica.com.br/cartazes-a-partir-de-excel/'] },
  { name: 'Hub de guias', url: origin + '/guias-para-varejo/', status: 200, contains: ['/placas-para-padaria/', '/cartazes-a-partir-de-excel/', 'Calcule o lote de impressão', 'Valide o PDF e a impressão física'] },
  { name: 'Validade Zero independente', url: origin + '/validade-zero/', status: 200, contains: ['Validade Zero: Controle de Vencimentos no Varejo', 'https://ofertamatica.com.br/validade-zero/', 'https://helioconde.github.io/validade_zero/', 'target="_blank" rel="noopener noreferrer"'] },
  { name: 'Guia prático completo', url: origin + '/como-fazer-cartaz-de-oferta/', status: 200, contains: ['Monte a descrição e a unidade de venda', 'Exemplo prático: prepare doze ofertas', 'Erros frequentes e como evitar'] },
  { name: 'Sitemap', url: origin + '/sitemap.xml', status: 200, contains: ['/placas-para-padaria/', '/cartazes-a-partir-de-excel/', '/editor-livre/', '/placas-para-hortifruti/', '/validade-zero/'] },
  { name: 'Robots e sitemap público', url: origin + '/robots.txt', status: 200, contains: ['User-agent: *', 'Sitemap: https://ofertamatica.com.br/sitemap.xml'] },
  { name: 'Editor livre indexável', url: origin + '/editor-livre/', status: 200, contains: ['Editor de Cartaz de Oferta Grátis', 'https://ofertamatica.com.br/editor-livre/'] },
  { name: 'ads.txt', url: origin + '/ads.txt', status: 200, contains: ['google.com, pub-9514218545388169, DIRECT'] },
  { name: 'llms.txt', url: origin + '/llms.txt', status: 200, contains: ['# Ofertamática', 'https://ofertamatica.com.br/modelos/'] },
  { name: 'Catálogo agentes', url: origin + '/ai-catalog.json', status: 200, contains: ['"specVersion": "1.0"', '"entries"'] },
  { name: 'Catálogo agentes well-known', url: origin + '/.well-known/ai-catalog.json', status: 200, contains: ['"specVersion": "1.0"', '"entries"'] },
  { name: '301 legado supermercado', url: origin + '/cartazes-para-supermercado', status: 301, location: '/cartaz-para-supermercado/' },
  { name: '301 legado Excel', url: origin + '/excel-para-cartazes', status: 301, location: '/cartazes-a-partir-de-excel/' },
  { name: '301 cartaz padaria antigo', url: origin + '/cartaz-padaria', status: 301, location: '/placas-para-padaria/' },
  { name: '301 placas hortifruti antigo', url: origin + '/placas-hortifruti', status: 301, location: '/placas-para-hortifruti/' },
  { name: '301 modelos antigos', url: origin + '/modelos-de-cartazes', status: 301, location: '/modelos/' },
  // Exemplos exportados como 404 em 22/10/2026: quatro URLs com conteúdo equivalente.
  { name: '301 placas promocionais', url: origin + '/placas-promocionais', status: 301, location: '/gerador-de-cartaz-de-promocao/' },
  { name: '301 cartaz de oferta', url: origin + '/cartaz-de-oferta', status: 301, location: '/criador-de-cartaz-de-oferta/' },
  { name: '301 placas farmácia', url: origin + '/placas-para-farmacia', status: 301, location: '/cartazes-para-farmacia/' },
  { name: '301 placa 2x1', url: origin + '/placa-2x1', status: 301, location: '/formatos/' },
  { name: 'Nova página farmácia', url: origin + '/cartazes-para-farmacia/', status: 200, contains: ['Cartazes de preço para farmácia e perfumaria', 'https://ofertamatica.com.br/cartazes-para-farmacia/'] },
  { name: 'Nova página hortifruti', url: origin + '/placas-para-hortifruti/', status: 200, contains: ['Placas de preço para frutas, verduras e legumes', 'https://ofertamatica.com.br/placas-para-hortifruti/'] },
  { name: 'Página Black Friday restaurada', url: origin + '/cartaz-black-friday/', status: 200, contains: ['Cartaz de Black Friday com preço legível', 'https://ofertamatica.com.br/cartaz-black-friday/'] },
  { name: '410 antiga Copa do Mundo com navegação', url: origin + '/cartaz-copa-do-mundo', status: 410, contains: ['Essa página saiu de linha. Suas ofertas, não.', '/fale-conosco/'] },
  { name: '301 legado açougue', url: origin + '/placas-para-acougue/', status: 301, location: '/cartazes-para-acougue/' },
  { name: '301 legado placas para supermercado', url: origin + '/placas-para-supermercado/', status: 301, location: '/cartaz-para-supermercado/' },
  { name: '301 host www', url: 'https://www.ofertamatica.com.br/', status: 301, location: 'https://ofertamatica.com.br/' },
  { name: '404 página inexistente com navegação', url: origin + '/rota-inexistente-seo-check-2026/', status: 404, contains: ['Essa página saiu de linha. Suas ofertas, não.', 'name="robots" content="noindex, follow"', '/editor-livre/', '/guias-para-varejo/'] },
  { name: '404 URL aleatória com navegação', url: origin + '/rota-que-nao-existe-oferta-2026/', status: 404, contains: ['Onde você quer continuar?', '/modelos/'] },
  { name: '410 login antigo', url: origin + '/login', status: 410 },
  { name: '410 cadastro antigo', url: origin + '/registro', status: 410 },
  { name: '410 cadastro plano grátis', url: origin + '/registro?plan=gratis', status: 410 },
  { name: '410 cadastro plano plus', url: origin + '/registro?plan=plus', status: 410 },
  // Não existe ferramenta de IA nem landing SRA3 autônoma publicada: 404 honestos.
  { name: '404 IA varejo não publicada', url: origin + '/ia-para-varejo', status: 404 },
  { name: '404 IA supermercado não publicada', url: origin + '/ia-para-supermercado', status: 404 },
  { name: '404 landing SRA3 não publicada', url: origin + '/placa-sra3', status: 404 },
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
  if (check.contains && response.status === check.status) {
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
