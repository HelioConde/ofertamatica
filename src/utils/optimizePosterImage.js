// Optimizes user-selected artwork locally. Images never need to be uploaded to a server.
// Keep the stored data URL small enough for browser localStorage and draft recovery.
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_INPUT_BYTES = 8 * 1024 * 1024
const MAX_STORED_BYTES = 850 * 1024

function readDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Não foi possível ler esta imagem.'))
    reader.onerror = () => reject(new Error('Não foi possível ler esta imagem.'))
    reader.readAsDataURL(file)
  })
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('A imagem está inválida ou não pôde ser aberta.'))
    }
    img.src = url
  })
}

const dataUrlBytes = (url) => {
  const base64 = url.split(',')[1] || ''
  return Math.floor(base64.length * 0.75)
}

/**
 * @param {File} file
 * @param {{ kind?: 'header' | 'logo' }} options
 * @returns {Promise<{ dataUrl: string, optimized: boolean }>}
 */
export async function optimizePosterImage(file, { kind = 'header' } = {}) {
  if (!ALLOWED_IMAGE_TYPES.has(file?.type)) {
    throw new Error('Use PNG, JPG ou WebP.')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Escolha uma imagem de até 8 MB.')
  }
  if (!file.size) throw new Error('A imagem selecionada está vazia.')

  const img = await readImage(file)
  if (!img.naturalWidth || !img.naturalHeight) {
    throw new Error('Não foi possível identificar o tamanho da imagem.')
  }

  const maxWidth = kind === 'logo' ? 720 : 1960
  const maxHeight = kind === 'logo' ? 720 : 700
  const ratio = Math.min(1, maxWidth / img.naturalWidth, maxHeight / img.naturalHeight)

  // Preserve small original files and any transparent pixels without recompression.
  if (file.size <= MAX_STORED_BYTES && ratio === 1) {
    return { dataUrl: await readDataUrl(file), optimized: false }
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { alpha: true })
  if (!context) throw new Error('Não foi possível preparar a imagem neste navegador.')

  let width = Math.max(1, Math.round(img.naturalWidth * ratio))
  let height = Math.max(1, Math.round(img.naturalHeight * ratio))
  const qualities = [0.88, 0.78, 0.68, 0.58, 0.48]

  for (let step = 0; step < 5; step += 1) {
    canvas.width = width
    canvas.height = height
    context.clearRect(0, 0, width, height)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(img, 0, 0, width, height)

    for (const quality of qualities) {
      const dataUrl = canvas.toDataURL('image/webp', quality)
      if (dataUrl.startsWith('data:image/webp;') && dataUrlBytes(dataUrl) <= MAX_STORED_BYTES) {
        canvas.width = 0
        canvas.height = 0
        return { dataUrl, optimized: true }
      }
    }

    width = Math.max(1, Math.round(width * 0.82))
    height = Math.max(1, Math.round(height * 0.82))
  }

  canvas.width = 0
  canvas.height = 0
  throw new Error('Esta imagem ficou grande demais mesmo após a otimização. Tente outra.')
}
