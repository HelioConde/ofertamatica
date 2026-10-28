import fs from 'node:fs'
import assert from 'node:assert/strict'
import { calculatePrintPlan, HOME_GUIDANCE } from '../src/seo/homePrintHelp.js'

assert.deepEqual(
  (({ sheets, freeSlots, option }) => [sheets, freeSlots, option.paper])(calculatePrintPlan(37, 'A4X4')),
  [10, 3, 'A4'],
  '37 placas em A4 4x1 exigem 10 folhas e sobram três espaços',
)
assert.equal(calculatePrintPlan(37, 'A4X8').sheets, 5)
assert.equal(calculatePrintPlan(1, 'A3').sheets, 1)
assert.equal(calculatePrintPlan(0, 'A4X4').quantity, 1)
assert.equal(calculatePrintPlan('sem número', 'A4X4').quantity, 1)
assert.ok(HOME_GUIDANCE.length >= 3 && HOME_GUIDANCE.every((step) => step.text.length >= 140))

const home = fs.readFileSync('dist/index.html', 'utf8')
const models = fs.readFileSync('dist/modelos/index.html', 'utf8')
assert.match(home, /Planeje suas placas sem desperdiçar papel/, 'Falta guia no HTML inicial da home')
assert.match(home, /37 cartazes, quatro por folha A4/, 'Falta cálculo exemplificado no HTML')
assert.match(home, /10 folhas A4/, 'Resultado estático incorreto')
assert.match(home, /O que a ferramenta faz/, 'Limites do serviço não foram explicados')
assert.ok(home.indexOf('class="format-grid"') < home.indexOf('class="home-print-help"'),
  'A orientação nunca deve bloquear o gerador')
assert.match(models, /Exemplos de modelos com produto, preço e finalidade/,
  'A galeria precisa ser útil sem depender somente da execução de JS')
assert.match(models, /Cartazes com foto do produto/, 'Falta informação sobre os modelos com foto')
assert.match(models, /foto-esquerda|Foto \+ preço em destaque/, 'Falta exemplo de modelo com foto')
assert.match(models, /Exemplo fictício:/, 'Os preços demonstrativos precisam ser identificados como fictícios')
console.log('Conteúdo útil: cálculo, home imediata, modelos e HTML inicial validados.')
