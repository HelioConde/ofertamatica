import assert from 'node:assert/strict'
import { PHOTO_LAYOUTS, photoLayoutFor, safeProductImageSrc, withPhotoLayout } from '../src/poster-engine/productPhotoLayout.js'
const template = {
  contentBox: { x: 7, y: 20, width: 86, height: 43 },
  priceBox: { x: 7, y: 65, width: 86, height: 30 },
  photoLayout: 'left',
}
const product = { imageDataUrl: '/samples/photo-arroz.svg' }
const format = { id: 'A4' }
assert.equal(safeProductImageSrc('https://example.org/product.jpg'), '')
assert.equal(safeProductImageSrc('javascript:alert(1)'), '')
assert.equal(safeProductImageSrc('data:image/svg+xml,<svg/>'), '')
assert.equal(safeProductImageSrc('/samples/photo-arroz.svg'), '/samples/photo-arroz.svg')
assert.equal(photoLayoutFor({ imageDataUrl: '' }, template, format), null)
assert.equal(withPhotoLayout({ imageDataUrl: '' }, template, format), template)
assert.equal(photoLayoutFor(product, template, { id: 'A4X8' }), null)
assert.equal(photoLayoutFor(product, template, { id: 'A4X2_APP', specialLayout: 'app-offer' }), null)
for (const [name, layout] of Object.entries(PHOTO_LAYOUTS)) {
  const effective = withPhotoLayout(product, { ...template, photoLayout: name }, format)
  assert.deepEqual(effective.photoBox, layout.photo)
  assert.deepEqual(effective.priceBox, template.priceBox, 'Preço físico não pode mudar')
  assert.deepEqual(effective.contentBox, { ...template.contentBox, ...layout.content })
  const disjoint = (a, b) => a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  assert.ok(disjoint(layout.content, layout.photo), 'Foto sobrepõe texto: ' + name)
  assert.ok(disjoint(layout.photo, template.priceBox), 'Foto sobrepõe preço: ' + name)
  assert.ok(disjoint(layout.content, template.priceBox), 'Texto sobrepõe preço: ' + name)
}
console.log('Placas com fotos: layouts, fallback, formatos e fontes de imagem seguros OK')
