import assert from 'node:assert/strict'
import {
  FEATURED_MODEL_IDS, addPersonalModelSelection, modelPopularityBadge,
  sanitizeModelCounts, sortPosterModels
} from '../src/utils/modelPopularity.js'

const models = [
  { id: 'preimpresso' }, { id: 'classic' }, { id: 'oferta-dia' },
  { id: 'hortifruti' }, { id: 'relampago' }, { id: 'super-oferta' }
]
const ids = (list) => list.map((item) => item.id)
assert.deepEqual(ids(sortPosterModels(models)).slice(0, 4),
  ['oferta-dia', 'super-oferta', 'relampago', 'hortifruti'])
assert.equal(ids(sortPosterModels(models, { globalCounts: { preimpresso: 4 } }))[0], 'oferta-dia')
assert.equal(ids(sortPosterModels(models, { globalCounts: { preimpresso: 7 } }))[0], 'preimpresso')
assert.equal(ids(sortPosterModels(models, {
  personalCounts: { classic: 4 }, mode: 'personal'
}))[0], 'classic')
assert.deepEqual(ids(sortPosterModels(models, { mode: 'original' })), ids(models))
assert.equal(modelPopularityBadge('preimpresso', { preimpresso: 4 }), '')
assert.equal(modelPopularityBadge('preimpresso', { preimpresso: 5 }), 'Em alta')
assert.equal(modelPopularityBadge('oferta-dia', {}), 'Destaque')
assert.deepEqual(sanitizeModelCounts({ valid: 4, invalid: -8, x: 2.1, 'a<script>': 5 }), { valid: 4 })
assert.deepEqual(addPersonalModelSelection({ 'oferta-dia': 2 }, 'oferta-dia'), { 'oferta-dia': 3 })
assert.equal(addPersonalModelSelection({ classic: 10000 }, 'classic').classic, 10000)
console.log('Modelos: ranking, amostra, persistência e fallback OK')
