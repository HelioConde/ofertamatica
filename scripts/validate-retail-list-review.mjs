import assert from 'node:assert/strict'
import fs from 'node:fs'
import { inspectRetailList, REVIEW_MAX_LINES, REVIEW_SAMPLE } from '../src/seo/retailListReview.js'

const example = inspectRetailList(REVIEW_SAMPLE)
assert.equal(example.error, '')
assert.equal(example.total, 3, 'Cabeçalho do Excel não pode virar cartaz')
assert.equal(example.ready, 2)
assert.equal(example.attention, 1)
assert.equal(example.rows[0].price, '18,90')
assert.equal(example.rows[0].unit, '500 G')
assert.equal(example.rows[1].name, 'PÃO DE QUEIJO')
assert.equal(example.rows[2].price, '—')
assert.ok(example.rows[2].issues.includes('Preço ausente'))

const duplicado = inspectRetailList('Café Melitta 500g 18,90\nCafé Melitta 500g 18,90')
assert.equal(duplicado.total, 2)
assert.ok(duplicado.rows[1].issues.includes('Possível produto repetido'))

const noUnit = inspectRetailList('Macarrão 5,99')
assert.ok(noUnit.rows[0].issues.includes('Conferir unidade de venda'))
assert.equal(inspectRetailList('Produto\tPreço\tUnidade').total, 0)
assert.ok(inspectRetailList('Leite 1L 4,99\n'.repeat(REVIEW_MAX_LINES + 2)).error)
assert.ok(inspectRetailList('x'.repeat(12010)).error)

const html = fs.readFileSync('dist/cartazes-a-partir-de-excel/index.html','utf8')
assert.match(html, /Teste uma lista do Excel antes de gerar os cartazes/)
assert.match(html, /PÃO DE QUEIJO/)
assert.match(html, /Preço ausente/)
assert.match(html, /2 sem alertas/)
assert.doesNotMatch(fs.readFileSync('dist/cartaz-de-por/index.html','utf8'), /review-list-title/)
console.log('Conferência de lista: parser compartilhado, preços ausentes, duplicados, limites e HTML inicial OK')
