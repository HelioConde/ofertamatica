import assert from 'node:assert/strict'
import {
  SAVED_LISTS_KEY, MAX_SAVED_LISTS, MAX_LIST_TEXT_LENGTH, loadSavedLists,
  normalizeListName, saveNamedList, deleteNamedList, validSavedLists,
  suggestedListFilename, exportNamedListText,
} from '../src/utils/savedProductLists.js'

const memory = new Map()
const storage = {
  getItem: (key) => memory.get(key) || null,
  setItem: (key, value) => { memory.set(key, value) },
}
assert.deepEqual(loadSavedLists(storage), [])
assert.equal(normalizeListName('  Ofertas   sexta   '), 'Ofertas sexta')
assert.equal(saveNamedList(storage, [], { name: 'S', sourceText: 'Café 5,99', formatId: 'A4' }).ok, false)
assert.equal(saveNamedList(storage, [], { name: 'Ofertas', sourceText: '', formatId: 'A4' }).ok, false)
assert.equal(saveNamedList(storage, [], { name: 'Ofertas', sourceText: 'X'.repeat(MAX_LIST_TEXT_LENGTH + 1), formatId: 'A4' }).ok, false)
let saved = saveNamedList(storage, loadSavedLists(storage), {
  name: ' Ofertas   de sexta ', sourceText: 'Café Melitta 500g 18,90\nLeite 1L 4,99', formatId: 'A4X4',
})
assert.equal(saved.ok, true)
assert.equal(saved.lists.length, 1)
assert.equal(saved.lists[0].name, 'Ofertas de sexta')
assert.equal(saved.lists[0].formatId, 'A4X4')
assert.equal(loadSavedLists(storage)[0].sourceText, 'Café Melitta 500g 18,90\nLeite 1L 4,99')
const originalId = saved.lists[0].id
saved = saveNamedList(storage, loadSavedLists(storage), {
  name: 'ofertas de sexta', sourceText: 'Banana Prata Kg 4,99', formatId: 'A3',
})
assert.equal(saved.ok, true)
assert.equal(saved.lists.length, 1, 'Mesmo nome com caixa diferente não deve duplicar')
assert.equal(saved.lists[0].id, originalId, 'Substituição preserva id')
assert.equal(saved.lists[0].sourceText, 'Banana Prata Kg 4,99')
assert.equal(exportNamedListText(saved.lists[0]), 'Banana Prata Kg 4,99')
assert.equal(suggestedListFilename('Café / Ofertas 2026'), 'cafe-ofertas-2026.txt')
assert.equal(suggestedListFilename('../../outro'), 'outro.txt')
assert.equal(validSavedLists([{ id: 'bad', name: 'ok', sourceText: 'texto' }]).length, 0)
assert.deepEqual(loadSavedLists({ getItem: () => '{falha' }), [])
assert.equal(saveNamedList({ setItem() { throw new Error('quota') } }, [], {
  name: 'Sexta', sourceText: 'Leite 1L 4,99', formatId: 'A4',
}).ok, false)
let all = loadSavedLists(storage)
for (let i = 0; i < MAX_SAVED_LISTS - 1; i += 1) {
  const result = saveNamedList(storage, all, { name: 'Lista ' + i, sourceText: 'Café 5,99', formatId: 'A4' })
  assert.equal(result.ok, true)
  all = result.lists
}
assert.equal(all.length, MAX_SAVED_LISTS)
assert.equal(saveNamedList(storage, all, { name: 'Extra', sourceText: 'Leite 4,99', formatId: 'A4' }).ok, false)
assert.equal(deleteNamedList(storage, all, 'desconhecido').ok, false)
const removed = deleteNamedList(storage, all, originalId)
assert.equal(removed.ok, true)
assert.equal(removed.lists.length, MAX_SAVED_LISTS - 1)
assert.equal(JSON.parse(memory.get(SAVED_LISTS_KEY)).length, MAX_SAVED_LISTS - 1)
console.log('Biblioteca local: salvar, substituir, limite, privacidade e exclusão testados.')
