// Auditoria orientativa; não é critério oficial de aprovação do AdSense.
// Executar: npm run audit:content
import { INDEXABLE_PAGES } from '../src/seo/seoPages.js'

const normalize = (s) => String(s || '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
const wordCount = (s) => normalize(s).split(/\s+/).filter(Boolean).length
const asText = (page) => [
  page.heading, page.lead,
  ...(page.benefits || []),
  ...(page.sections || []).flatMap(s => [s.title, s.text]),
  ...(page.tips || []),
  ...(page.storeUse || []),
  ...(page.faq || []).flatMap(f => [f.q, f.a]),
].join(' ')
const textSets = INDEXABLE_PAGES.map(p => ({ page: p, tokens: new Set(normalize(asText(p)).split(' ').filter(w => w.length > 3)) }))
const findings = []
for (const { page } of textSets) {
  const words = wordCount(asText(page))
  if (words < 120) findings.push({ slug: page.slug, issue: 'revisar profundidade editorial', detail: words + ' palavras de conteúdo configurado' })
  if (!page.heading || !page.lead) findings.push({ slug: page.slug, issue: 'heading/lead ausente', detail: '' })
}
for (let i = 0; i < textSets.length; i++) {
  for (let j = i + 1; j < textSets.length; j++) {
    const a = textSets[i], b = textSets[j]
    if (a.tokens.size < 20 || b.tokens.size < 20) continue
    const intersect = [...a.tokens].filter(x => b.tokens.has(x)).length
    const similarity = intersect / new Set([...a.tokens, ...b.tokens]).size
    if (similarity >= 0.55) findings.push({ slug: a.page.slug + ' / ' + b.page.slug, issue: 'revisar possível sobreposição', detail: Math.round(similarity * 100) + '% de similaridade lexical' })
  }
}
console.log('Auditoria editorial: ' + INDEXABLE_PAGES.length + ' páginas indexáveis; ' + findings.length + ' alertas de revisão manual.')
console.table(findings)
console.log('Nota: páginas de ferramenta podem ter pouco texto e ainda oferecer valor; verifique a experiência real antes de alterar, mesclar ou desindexar.')
