import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const home = read('dist/index.html')
const app = read('dist/validade-zero/index.html')
const about = read('dist/conheca-validade-zero/index.html')
const sitemap = read('dist/sitemap.xml')
const indexSrc = read('src/App.jsx')
const editorSrc = read('src/CreatorApp.jsx')
const marketing = read('src/components/SiteMarketing.jsx')
const appDir = path.join(root, 'dist', 'validade-zero')

// O Ofertamática segue sendo o criador de cartazes; o sistema de validades é secundário.
assert.match(home, /Escolha o formato da sua placa de oferta/)
assert.match(home, /class="format-grid"/)
for (const src of [indexSrc, editorSrc]) {
  assert.doesNotMatch(src, /\['\/validade-zero',\s*'Validade Zero'/)
  assert.match(src, /href="\/validade-zero\/" target="_blank" rel="noopener noreferrer"/)
  assert.match(src, /href="\/conheca-validade-zero\/"/)
}
assert.match(home, /href="\/validade-zero\/" target="_blank" rel="noopener noreferrer"/)
assert.doesNotMatch(home, /helioconde\.github\.io\/validade_zero/)

// Esta rota é uma aplicação CRA real com arquivos internos, não uma landing/redirect.
assert.match(app, /<title>Validade Zero \| Controle de vencimentos<\/title>/)
assert.match(app, /id="root"/)
assert.match(app, /\/validade-zero\/static\/js\//)
assert.match(app, /\/validade-zero\/manifest\.json/)
assert.match(app, /https:\/\/ofertamatica\.com\.br\/validade-zero\//)
assert.doesNotMatch(app, /http-equiv="refresh"|window\.location\s*=|helioconde\.github\.io/)
for (const item of ['push-sw.js','manifest.json','favicon.ico','logo192.png','logo512.png','asset-manifest.json']) {
  assert.ok(fs.existsSync(path.join(appDir,item)), 'Arquivo do aplicativo ausente: '+item)
}
const assets = JSON.parse(read('dist/validade-zero/asset-manifest.json'))
assert.ok(Array.isArray(assets.entrypoints) && assets.entrypoints.some(x=>x.includes('.js')), 'JS do aplicativo não compilado')
for (const entry of assets.entrypoints) {
  const resource = entry.replace(/^\/validade-zero\//, '')
  assert.ok(fs.existsSync(path.join(appDir,resource)), 'Asset do Validade Zero não encontrado: ' + entry)
}
const manifest=JSON.parse(read('dist/validade-zero/manifest.json'))
assert.equal(manifest.theme_color,'#1d63e9')
assert.equal(manifest.display,'standalone')

// Página de apresentação separada e indexável; nenhuma page duplicada com canonical incorreto.
assert.match(about,/https:\/\/ofertamatica\.com\.br\/conheca-validade-zero\//)
assert.match(sitemap,/\/conheca-validade-zero\//)
assert.match(marketing,/href="\/validade-zero\/" target="_blank" rel="noopener noreferrer"/)
assert.match(read('dist/.htaccess'), /camera=\(self\)/)

console.log('Validade Zero: aplicativo completo em /validade-zero/, SEO e navegação secundária — PASS')
