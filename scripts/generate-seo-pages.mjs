import fs from 'node:fs'
import path from 'node:path'
import { SEO_PAGES, SITE_URL } from '../src/seo/seoPages.js'

const dist = path.resolve('dist')
const indexPath = path.join(dist, 'index.html')
if (!fs.existsSync(indexPath)) process.exit(0)

const baseHtml = fs.readFileSync(indexPath, 'utf8')

const esc = (value='') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

function replaceMeta(html, page) {
  const canonical = `${SITE_URL}/${page.slug}/`
  return html
    .replace(/<title>.*?<\/title>/s, `<title>${esc(page.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${esc(page.description)}" />`)
    .replace(/<meta name="keywords" content="[^"]*"\s*\/>/, `<meta name="keywords" content="${esc(page.keywords)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(page.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(page.description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
}

function snapshot(page) {
  const benefits = page.benefits.map((item) => `<li>${esc(item)}</li>`).join('')
  return `<main style="font-family:Arial,sans-serif;max-width:1080px;margin:60px auto;padding:0 22px;color:#1f2d47"><p style="font-weight:700;color:#1d63e9">${esc(page.eyebrow)}</p><h1 style="font-size:48px;line-height:1.05">${esc(page.h1)}</h1><p style="font-size:18px;line-height:1.7">${esc(page.intro)}</p><ul>${benefits}</ul><p><a href="/" style="color:#1d63e9;font-weight:700">Criar meu cartaz no Ofertamática</a></p></main>`
}

for (const page of SEO_PAGES) {
  let html = replaceMeta(baseHtml, page)
  html = html.replace('<div id="root"></div>', `<div id="root">${snapshot(page)}</div>`)
  html = html.replaceAll('src="./assets/', 'src="../assets/').replaceAll('href="./assets/', 'href="../assets/')
  const dir = path.join(dist, page.slug)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html)
}

const urls = [SITE_URL + '/', ...SEO_PAGES.map((page) => `${SITE_URL}/${page.slug}/`)]
const sitemap = ['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',...urls.map((url) => `  <url><loc>${url}</loc></url>`),'</urlset>'].join('\n')
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`)
