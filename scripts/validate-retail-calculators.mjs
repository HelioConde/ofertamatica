import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  calculateDiscount, calculatePriceByWeight, calculatorKindForSlug,
  calculatorStaticExample, formatBrl, parseBrlCents,
} from '../src/seo/retailCalculators.js'

assert.equal(parseBrlCents('14,90'), 1490)
assert.equal(parseBrlCents('14.9'), 1490)
assert.equal(parseBrlCents('0,01'), 1)
assert.equal(parseBrlCents('24,999'), null)
assert.equal(parseBrlCents('-1,00'), null)
assert.equal(parseBrlCents('1.234,56'), null)
assert.equal(parseBrlCents('<script>'), null)
assert.equal(parseBrlCents('999999,99'), 99999999)
assert.equal(parseBrlCents('1000000'), null)
assert.match(formatBrl(522), /5,22/)
assert.equal(calculatePriceByWeight('14,90', '350').totalCents, 522)
assert.equal(calculatePriceByWeight('12,90', '350').totalCents, 452)
assert.equal(calculatePriceByWeight('49,90', '750').totalCents, 3743)
assert.equal(calculatePriceByWeight('14,90', '1e3'), null)
assert.equal(calculatePriceByWeight('14,90', 1000).totalCents, 1490)
assert.equal(calculatePriceByWeight('14,90', 100).centsPer100g, 149)
assert.equal(calculatePriceByWeight('0,00', 100), null)
assert.equal(calculatePriceByWeight('14,90', 0), null)
assert.equal(calculatePriceByWeight('14,90', '10.5'), null)
assert.equal(calculatePriceByWeight('14,90', 100001), null)
assert.equal(calculateDiscount('24,90', '19,90').savedCents, 500)
assert.equal(calculateDiscount('24,90', '19,90').percent, 20.1)
assert.equal(calculateDiscount('19,90', '24,90'), null)
assert.equal(calculateDiscount('19,90', '19,90'), null)
assert.equal(calculateDiscount('0,00', '0,00'), null)
assert.equal(calculatorKindForSlug('placas-para-hortifruti'), 'weight')
assert.equal(calculatorKindForSlug('cartaz-de-por'), 'discount')
assert.equal(calculatorKindForSlug('modelos'), null)

for (const [slug, title, price] of [
  ['placas-para-hortifruti', 'Simulador de preço por peso', '5,22'],
  ['placas-para-padaria', 'Simulador de preço por peso', '4,52'],
  ['cartazes-para-acougue', 'Simulador de preço por peso', '37,43'],
  ['cartaz-de-por', 'Comparador De/Por', '20,1%'],
  ['cartaz-black-friday', 'Comparador De/Por', '20,1%'],
]) {
  const example = calculatorStaticExample(slug)
  assert.ok(example && example.output.includes(price), slug + ': cálculo do exemplo incorreto')
  const html = fs.readFileSync('dist/' + slug + '/index.html', 'utf8')
  assert.ok(html.includes(title), slug + ': simulador não está no HTML inicial')
  assert.ok(html.includes(price), slug + ': falta resultado de exemplo no HTML')
  assert.ok(html.includes('fictício') || html.includes('fictícios'), slug + ': falta transparência nos exemplos')
  if (slug === 'placas-para-padaria') assert.ok(html.includes('PÃO FRANCÊS'))
  if (slug === 'cartazes-para-acougue') assert.ok(html.includes('ALCATRA'))
  if (slug === 'cartaz-black-friday') assert.ok(html.includes('CAFÉ TORRADO 500 G'))
}

console.log('Calculadoras para varejo: valores, limites, pesos, descontos e HTML estático OK')
