// Geometria visual dos cartazes com foto. Somente aplicada quando a placa
// realmente possui imagem; o editor tradicional mantém suas medidas.
export const PHOTO_LAYOUTS = {
  left: {
    label: 'Foto à esquerda',
    photo: { x: 6, y: 26, width: 40, height: 34 },
    content: { x: 49, y: 22, width: 44, height: 40 },
  },
  right: {
    label: 'Foto à direita',
    photo: { x: 54, y: 26, width: 40, height: 34 },
    content: { x: 7, y: 22, width: 44, height: 40 },
  },
  center: {
    label: 'Foto central',
    photo: { x: 23, y: 29, width: 54, height: 32 },
    content: { x: 7, y: 16, width: 86, height: 13 },
  },
}

const PHOTO_SAMPLE = /^\/samples\/photo-(banana|cafe|arroz)\.svg$/
const IMAGE_DATA = /^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/
export function safeProductImageSrc(src) {
  return typeof src === 'string' && src.length <= 300000 &&
    (PHOTO_SAMPLE.test(src) || IMAGE_DATA.test(src)) ? src : ''
}

export function photoLayoutFor(product, template, format) {
  const id = template?.photoLayout
  if (!PHOTO_LAYOUTS[id] || !safeProductImageSrc(product?.imageDataUrl)) return null
  // No App e no A7, os elementos têm espaços muito pequenos para foto e preço.
  if (format?.specialLayout === 'app-offer' || format?.id === 'A4X8') return null
  return PHOTO_LAYOUTS[id]
}

export function withPhotoLayout(product, template, format) {
  const layout = photoLayoutFor(product, template, format)
  return layout ? {
    ...template,
    contentBox: { ...template.contentBox, ...layout.content },
    photoBox: layout.photo,
  } : template
}
