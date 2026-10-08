import fs from 'node:fs'

const [mobilePath, desktopPath] = process.argv.slice(2)
if (!mobilePath || !desktopPath) {
  console.error('Uso: node scripts/summarize-lighthouse.mjs mobile.json desktop.json')
  process.exit(2)
}
const reports = [mobilePath, desktopPath].map((path) => JSON.parse(fs.readFileSync(path, 'utf8')))
const [mobile, desktop] = reports
const esc = (text) => String(text || '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ')
const category = (r, key) => {
  const score = r.categories?.[key]?.score
  return Number.isFinite(score) ? String(Math.round(score * 100)) : '—'
}
const metric = (r, key) => {
  const n = r.audits?.[key]?.numericValue
  if (!Number.isFinite(n)) return '—'
  return key === 'cumulative-layout-shift' ? n.toFixed(3) : Math.round(n) + ' ms'
}
console.log('## Lighthouse — Ofertamática (produção)')
console.log('')
console.log('URL: https://ofertamatica.com.br/ — ' + new Date().toISOString())
console.log('')
console.log('| Indicador | Celular | Computador |')
console.log('|---|---:|---:|')
for (const [label, key] of [
  ['Desempenho', 'performance'],
  ['Acessibilidade', 'accessibility'],
  ['Boas práticas', 'best-practices'],
  ['SEO', 'seo'],
]) {
  console.log('| ' + label + ' | ' + category(mobile, key) + '/100 | ' + category(desktop, key) + '/100 |')
}
for (const [label, key] of [
  ['FCP', 'first-contentful-paint'],
  ['LCP', 'largest-contentful-paint'],
  ['TBT', 'total-blocking-time'],
  ['CLS', 'cumulative-layout-shift'],
  ['Speed Index', 'speed-index'],
]) {
  console.log('| ' + label + ' | ' + metric(mobile, key) + ' | ' + metric(desktop, key) + ' |')
}
console.log('')
console.log('### Oportunidades mobile')
const opportunities = [
  ['Resposta sem compactação (gzip/br)', 'uses-text-compression'],
  ['JavaScript não utilizado', 'unused-javascript'],
  ['CSS não utilizado', 'unused-css-rules'],
  ['Recursos que bloqueiam a renderização', 'render-blocking-resources'],
  ['Cadeia de solicitações críticas', 'network-dependency-tree'],
  ['Imagens sem dimensões explícitas', 'unsized-images'],
  ['Imagens responsivas', 'uses-responsive-images'],
  ['Cache eficiente', 'uses-long-cache-ttl'],
]
let shown = 0
for (const [label, key] of opportunities) {
  const audit = mobile.audits?.[key]
  if (!audit || audit.score === null || audit.score === 1) continue
  const saving = Number.isFinite(audit.details?.overallSavingsMs)
    ? ' (~' + Math.round(audit.details.overallSavingsMs) + ' ms estimados)'
    : ''
  console.log('- ' + esc(label) + ': ' + esc(audit.displayValue || 'requer revisão') + saving)
  shown++
}
if (!shown) console.log('- Nenhuma oportunidade relevante detectada entre as verificações selecionadas.')
console.log('')
console.log('As notas são estimativas de laboratório e variam entre execuções. Não são Core Web Vitals de usuários reais.')
