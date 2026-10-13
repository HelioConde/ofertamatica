import { POSTER_DESCRIPTION_FONT } from '../config/posterTypography.js'
import { createTextMeasurer, estimateTextMeasure } from '../poster-engine/textMeasure.js'

const PX_PER_MM = 96 / 25.4
const ACCENT_PATTERN = /[À-ÖØ-öø-ÿ]/

function hasAccent(text) {
  return ACCENT_PATTERN.test(String(text || ''))
}

function accentPaddingMm(fontSizeMm, text) {
  if (!hasAccent(text)) return 0
  return Math.max(0.45, Number(fontSizeMm || 0) * 0.12)
}

export function createBrowserTextMeasure() {
  if (typeof document === 'undefined') return estimateTextMeasure
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return estimateTextMeasure

  return createTextMeasurer((text, style) => {
    const sizePx = Number(style.fontSizeMm || 1) * PX_PER_MM
    const fontFamily = style.fontFamily || POSTER_DESCRIPTION_FONT
    // A Futura Price distribuída no projeto é a variante itálica.
    // Medir a mesma variante usada no CSS evita diferenças na prévia/PDF.
    const slant = fontFamily.includes('Futura Price') ? 'italic ' : ''
    context.font = `${slant}${style.fontWeight || 900} ${sizePx}px ${fontFamily}`

    const metrics = context.measureText(text)
    const rawHeightPx = (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) || (sizePx * 0.84)
    const extraMm = accentPaddingMm(style.fontSizeMm, text)

    return {
      widthMm: (metrics.width / PX_PER_MM) + (text.length * Number(style.letterSpacingMm ?? style.letterSpacing ?? 0)),
      heightMm: (rawHeightPx / PX_PER_MM) + extraMm,
    }
  })
}
