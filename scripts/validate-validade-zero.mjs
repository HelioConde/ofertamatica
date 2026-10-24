import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

// Valida a integração sem acessar o aplicativo externo nem dados privados.
const root = process.cwd()
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

const home = read('dist/index.html')
const landing = read('dist/validade-zero/index.html')
const sitemap = read('dist/sitemap.xml')
const homepage = read('src/App.jsx')
const creator = read('src/CreatorApp.jsx')
const marketing = read('src/components/SiteMarketing.jsx')
const appUrl = 'https://helioconde.github.io/validade_zero/'

// O Ofertamática deve continuar abrindo no criador, sem uma landing obrigatória.
assert.match(home, /Escolha o formato da sua placa de oferta/)
assert.match(home, /class="format-grid"/)

// O app secundário não ocupa mais espaço na navegação principal.
for (const source of [homepage, creator]) {
  assert.doesNotMatch(source, /\['\/validade-zero',\s*'Validade Zero'/)
  assert.match(source, /<details className="format-more-links">/)
  assert.match(source, /href="https:\/\/helioconde\.github\.io\/validade_zero\/" target="_blank" rel="noopener noreferrer"/)
}
const mainNav = home.match(/<nav class="main-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || ''
assert.doesNotMatch(mainNav, /Validade Zero/)
assert.match(home, /Validade Zero ↗/)
assert.match(home, /target="_blank" rel="noopener noreferrer"/)

// A página explicativa continua indexável; abrir o app nunca mistura origens.
assert.match(sitemap, /\/validade-zero\//)
assert.match(landing, /Validade Zero/)
assert.ok(landing.includes(appUrl), 'CTA do aplicativo ausente no HTML estático')
assert.match(landing, /target="_blank" rel="noopener noreferrer"/)
assert.match(marketing, /aria-label="Abrir Validade Zero em nova aba"/)
assert.match(marketing, /O mesmo padrão visual do Ofertamática/)

console.log('Validade Zero: integração secundária, SEO e acesso em nova aba — PASS')
