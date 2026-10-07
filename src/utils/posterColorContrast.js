const DEFAULT_PRICE_COLOR = '#d91b2b'
const DEFAULT_TEXT_COLOR = '#101010'
const DEFAULT_HEADER_TEXT_COLOR = '#ffffff'

function hexToRgb(color) {
  const value = String(color || '').trim()
  const match = value.match(/^#([0-9a-f]{6})$/i)
  if (!match) return null

  const hex = match[1]
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  }
}

function channelLuminance(value) {
  const channel = value / 255
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
}

function contrastRatio(backgroundColor, foregroundColor) {
  const background = hexToRgb(backgroundColor)
  const foreground = hexToRgb(foregroundColor)
  if (!background || !foreground) return 99

  const backgroundLuminance = (0.2126 * channelLuminance(background.r))
    + (0.7152 * channelLuminance(background.g))
    + (0.0722 * channelLuminance(background.b))
  const foregroundLuminance = (0.2126 * channelLuminance(foreground.r))
    + (0.7152 * channelLuminance(foreground.g))
    + (0.0722 * channelLuminance(foreground.b))

  const lighter = Math.max(backgroundLuminance, foregroundLuminance)
  const darker = Math.min(backgroundLuminance, foregroundLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

function bestContrastColor(backgroundColor, desiredColor, candidates, minimumRatio = 3) {
  const desired = desiredColor || candidates[0]
  if (contrastRatio(backgroundColor, desired) >= minimumRatio) return desired

  return [desired, ...candidates]
    .filter(Boolean)
    .reduce((best, candidate) => (
      contrastRatio(backgroundColor, candidate) > contrastRatio(backgroundColor, best)
        ? candidate
        : best
    ), candidates[0] || desired)
}

export function resolveReadablePriceColor(backgroundColor, priceColor) {
  return bestContrastColor(
    backgroundColor,
    priceColor || DEFAULT_PRICE_COLOR,
    ['#fff200', '#ffffff', '#111111', '#d91820'],
    3,
  )
}

export function resolveReadableTextColor(backgroundColor, textColor) {
  return bestContrastColor(
    backgroundColor,
    textColor || DEFAULT_TEXT_COLOR,
    ['#111111', '#ffffff', '#fff200'],
    3.8,
  )
}

export function resolveReadableHeaderTextColor(headerColor, headerTextColor) {
  return bestContrastColor(
    headerColor,
    headerTextColor || DEFAULT_HEADER_TEXT_COLOR,
    ['#ffffff', '#fff200', '#111111'],
    3,
  )
}
