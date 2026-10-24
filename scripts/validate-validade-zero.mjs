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
  assert.match(src, /\['\/validade-zero',\s*'Validade Zero'/)
  assert.match(src, /target=\{href === '\/validade-zero' \? '_blank' : undefined\}/)
  assert.match(src, /rel=\{href === '\/validade-zero' \? 'noopener noreferrer' : undefined\}/)
  assert.match(src, /href="\/validade-zero\/" target="_blank" rel="noopener noreferrer"/)
  assert.match(src, /href="\/conheca-validade-zero\/"/)
}
assert.match(home, /href="\/validade-zero\/" target="_blank" rel="noopener noreferrer"/)
assert.match(home, /class="main-nav"[\s\S]*?href="\/validade-zero\/" target="_blank" rel="noopener noreferrer"/)
assert.doesNotMatch(home, /helioconde\.github\.io\/validade_zero/)

// Esta rota é uma aplicação CRA real com arquivos internos, não uma landing/redirect.
assert.match(app, /<title>Validade Zero \| Controle de vencimentos \| Ofertamática<\/title>/)
assert.match(app, /id="root"/)
assert.match(app, /href="https:\/\/ofertamatica\.com\.br\/validade-zero\/"/)
assert.match(app, /name="robots" content="index,follow/)
assert.match(app, /property="og:title"/)
assert.match(app, /property="og:image"/)
assert.match(app, /name="twitter:card"/)
assert.match(app, /application\/ld\+json/)
assert.match(app, /"@type"\s*:\s*"WebApplication"/)
assert.match(app, /"@type"\s*:\s*"BreadcrumbList"/)
assert.match(app, /<h1[^>]*>Validade Zero: controle de vencimentos e lotes<\/h1>/)
assert.match(app, /src="\/icons\/icon-192\.png\?v=20261008b"/)
assert.match(app, /href="\/modelos\/"/)
assert.match(sitemap, /<loc>https:\/\/ofertamatica\.com\.br\/validade-zero\/<\/loc>/)
const navbarSource = read('apps/validade-zero/src/components/OfertamaticaHeader.js')
const navbarCss = read('apps/validade-zero/src/components/OfertamaticaHeader.css')
const appSource = read('apps/validade-zero/src/App.js')
assert.match(appSource, /<OfertamaticaHeader \/>/)
for (const href of ['/', '/modelos/', '/editor-livre/', '/formatos/', '/como-funciona/', '/guias-para-varejo/', '/validade-zero/']) {
  assert.ok(navbarSource.includes("'"+href+"'"), 'Menu principal ausente no Validade Zero: '+href)
}
assert.match(navbarSource, /src="\/icons\/icon-192\.png\?v=20261008b"/)
assert.match(navbarCss, /max-width: 820px/)
assert.match(navbarSource, /className="vz-site-brand-copy"/)
assert.match(navbarSource, /className="vz-site-product">Validade Zero<\/span>/)
assert.doesNotMatch(navbarSource, /className="vz-site-tool"/)
assert.match(navbarSource, /aria-current="page"/)
assert.match(navbarSource, /href="\/validade-zero\/"/)
assert.match(navbarCss, /\.vz-site-nav-link\.is-current::after/)
assert.match(navbarSource, /className="vz-site-nav-scroll"/)
assert.match(navbarSource, /className="vz-site-nav-link vz-site-nav-current is-current"/)
assert.match(navbarCss, /grid-template-columns: minmax\(0, 1fr\) auto/)

assert.doesNotMatch(appSource, /className="brand"/)
assert.doesNotMatch(appSource, /className="ecosystem-link"/)

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
assert.ok(manifest.icons.some(icon => icon.src === '/icons/icon-192.png'),'Manifesto deve utilizar logo do Ofertamática')

// Página de apresentação separada e indexável; nenhuma page duplicada com canonical incorreto.
assert.match(about,/https:\/\/ofertamatica\.com\.br\/conheca-validade-zero\//)
assert.match(sitemap,/\/conheca-validade-zero\//)
assert.match(marketing,/href="\/validade-zero\/" target="_blank" rel="noopener noreferrer"/)
assert.match(read('dist/.htaccess'), /camera=\(self\)/)

console.log('Validade Zero: aplicativo completo em /validade-zero/, SEO e navegação secundária — PASS')
