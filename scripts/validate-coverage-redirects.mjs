import fs from 'node:fs'
import assert from 'node:assert/strict'
import { INDEXABLE_PAGES, SITE_URL } from '../src/seo/seoPages.js'

// Inventário exato das 31 URLs exportadas em 12/10/2026.
const redirects = {
  "ferramenta-para-cartazes": "criador-de-cartaz-de-oferta",
  "como-fazer-cartaz-de-supermercado": "como-fazer-cartaz-de-oferta",
  "cartaz-promocional": "gerador-de-cartaz-de-promocao",
  "cartaz-padaria": "placas-para-padaria",
  "placa-para-imprimir": "cartaz-de-oferta-para-imprimir",
  "cartaz-para-imprimir-gratis": "cartaz-de-oferta-para-imprimir",
  "placa-promocional": "gerador-de-cartaz-de-promocao",
  "placa-mercado": "cartaz-para-supermercado",
  "como-criar-placas-de-oferta": "como-fazer-cartaz-de-oferta",
  "placas-hortifruti": "placas-para-hortifruti",
  "cartaz-mercado": "cartaz-para-supermercado",
  "cartaz-online-gratis": "criador-de-cartaz-de-oferta",
  "cartaz-a4-1x1": "cartaz-a4",
  "cartazes-prontos-para-impressao": "modelos",
  "cartazes-prontos": "modelos",
  "cartaz-promocional-gratis": "gerador-de-cartaz-de-promocao",
  "placa-de-preco": "cartaz-de-preco-online",
  "modelos-de-cartazes": "modelos",
  "placas-prontas-para-impressao": "modelos",
  "placa-de-oferta": "criador-de-cartaz-de-oferta",
  "automacao-de-cartazes": "cartazes-a-partir-de-excel",
  "placa-de-promocao": "gerador-de-cartaz-de-promocao",
  "placa-promocional-gratis": "gerador-de-cartaz-de-promocao",
  "cartaz-a4-4x1": "cartaz-a4",
  "placa-supermercado": "cartaz-para-supermercado",
  "cartaz-amarelo": "modelos",
  "cartaz-promocao": "gerador-de-cartaz-de-promocao"
}
// Exportação adicional de 404 em 22/10/2026: redirecionar apenas intenções equivalentes.
const notFoundRedirects = {
  "placas-promocionais": "gerador-de-cartaz-de-promocao",
  "cartaz-de-oferta": "criador-de-cartaz-de-oferta",
  "placas-para-farmacia": "cartazes-para-farmacia",
  "placa-2x1": "formatos"
}
const legitimatelyMissing = ["ia-para-varejo", "placa-sra3", "ia-para-supermercado"]
const restored = ["cartazes-para-farmacia","cartaz-black-friday"]
const gone = ["cartaz-copa-do-mundo"]
const alreadyCanonical = ["cartaz-a4"]
const entries = [...Object.keys(redirects), ...restored, ...gone, ...alreadyCanonical]
assert.equal(entries.length, 31, 'A exportação deve conter 31 URLs')
assert.equal(new Set(entries).size, 31, 'URLs duplicadas no diagnóstico')

const ht = fs.readFileSync('dist/.htaccess', 'utf8')
const sitemap = fs.readFileSync('dist/sitemap.xml', 'utf8')
const pages = new Set(INDEXABLE_PAGES.map(page => page.slug))
for (const [oldSlug, target] of Object.entries(redirects)) {
  assert.ok(pages.has(target), 'Destino SEO não indexável: ' + target)
  assert.ok(ht.includes('RewriteRule ^' + oldSlug + '/?$ /' + target + '/ [R=301,L]'), '301 ausente: ' + oldSlug)
  assert.ok(!sitemap.includes('<loc>' + SITE_URL + '/' + oldSlug + '/</loc>'), 'URL antiga no sitemap: ' + oldSlug)
}
for (const [oldSlug, target] of Object.entries(notFoundRedirects)) {
  assert.ok(pages.has(target), 'Destino 404 não indexável: ' + target)
  assert.ok(ht.includes('RewriteRule ^' + oldSlug + '/?$ /' + target + '/ [R=301,L]'), '301 de recuperação ausente: ' + oldSlug)
  assert.ok(!sitemap.includes('<loc>' + SITE_URL + '/' + oldSlug + '/</loc>'), '404 antiga no sitemap: ' + oldSlug)
}
for (const slug of legitimatelyMissing) {
  assert.ok(!sitemap.includes('<loc>' + SITE_URL + '/' + slug + '/</loc>'), 'Página não publicada no sitemap: ' + slug)
  assert.ok(!ht.includes('RewriteRule ^' + slug + '/?$ /'), 'Redirecionamento sem equivalência: ' + slug)
}
assert.ok(ht.includes('RewriteRule ^(login|registro)/?$ - [G,L]'), 'Conta desativada deve manter 410')
for (const slug of restored) {
  assert.ok(pages.has(slug), 'Página restaurada ausente: ' + slug)
  assert.ok(fs.existsSync('dist/' + slug + '/index.html'), 'HTML restaurado ausente: ' + slug)
  assert.ok(sitemap.includes('<loc>' + SITE_URL + '/' + slug + '/</loc>'), 'URL restaurada fora do sitemap: ' + slug)
}
for (const slug of gone) {
  assert.ok(ht.includes('RewriteRule ^' + slug + '/?$ - [G,L]'), '410 ausente: ' + slug)
  assert.ok(!sitemap.includes('<loc>' + SITE_URL + '/' + slug + '/</loc>'), 'Página removida no sitemap: ' + slug)
}
for (const slug of alreadyCanonical) {
  assert.ok(pages.has(slug), 'Página canônica não encontrada: ' + slug)
  assert.ok(sitemap.includes('<loc>' + SITE_URL + '/' + slug + '/</loc>'), 'Canônica fora do sitemap: ' + slug)
}
const html = fs.readFileSync('dist/placas-para-hortifruti/index.html', 'utf8')
assert.ok(html.includes('Preço por quilo não é preço por unidade'), 'Conteúdo original de hortifruti ausente')
assert.ok(!sitemap.includes('<loc>' + SITE_URL + '/placas-hortifruti/</loc>'), 'Slug antigo hortifruti indevido')
console.log('Cobertura: 31 URLs soft 404 e 9 URLs 404 auditadas; 4 redirecionamentos equivalentes adicionais, sem redirecionamentos artificiais de IA/SRA3.')
