export const LAYOUT_CONFIG_VERSION = 9

const baseTextStyles = {
  description: { fontMin: 3.4, fontMax: 36, fontWeight: 900, lineHeight: 0.92, letterSpacing: 0, scale: 1 },
  subdescription: { fontMin: 3.4, fontMax: 36, fontWeight: 900, lineHeight: 0.92, letterSpacing: 0, scale: 1 },
  complement: { fontMin: 3.2, fontMax: 32, fontWeight: 900, lineHeight: 0.92, letterSpacing: 0, scale: 1 },
  unit: { fontMin: 3, fontMax: 15, fontWeight: 900, lineHeight: 0.94, letterSpacing: 0, scale: 0.76 },
  price: { fontMin: 8, fontMax: 40, fontWeight: 900, lineHeight: 0.84, letterSpacing: 0, scale: 1, fontFamily: '"Futura Price"' },
}

function textStyles(textScale = 1, scales = {}) {
  return Object.fromEntries(Object.entries(baseTextStyles).map(([field, style]) => [field, {
    ...style,
    fontMin: Number((style.fontMin * textScale).toFixed(2)),
    fontMax: Number((style.fontMax * textScale).toFixed(2)),
    scale: scales[field] ?? style.scale,
  }]))
}

const centered = { alignX: 'center', alignY: 'center' }
const content = (x, y, width, height, gap = 2) => ({ x, y, width, height, gap, ...centered })
const price = (x, y, width, height) => ({ x, y, width, height, ...centered })

// Calibração visual inspirada nas placas físicas usadas como referência:
// descrição mais larga/alta e preço dominando o terço inferior, sem copiar a identidade visual da loja.
export const DEFAULT_POSTER_LAYOUTS = {
  A4X8: { contentBox: content(5, 22, 90, 34, 1), priceBox: price(7, 60, 86, 31), textScale: 0.48 },
  A4X4: { contentBox: content(6, 20, 88, 43), priceBox: price(9, 66, 82, 27), textScale: 0.78 },
  A5: { contentBox: content(7, 20, 86, 45), priceBox: price(8, 67, 84, 28), textScale: 1.05 },
  A4X2_CIMA_BAIXO: { contentBox: content(6, 19, 88, 45), priceBox: price(9, 66, 82, 28), textScale: 1.02 },
  A4X2_INVERTIDO: { contentBox: content(6, 19, 88, 45), priceBox: price(9, 66, 82, 28), textScale: 1.02 },
  A4X2_APP: { contentBox: content(8, 22, 84, 34, 1.5), priceBox: price(10, 58, 80, 17), textScale: 1 },
  A4: { contentBox: content(7, 20, 86, 45), priceBox: price(8, 67, 84, 28), textScale: 1.4 },
  A3: { contentBox: content(7, 20, 86, 45), priceBox: price(8, 67, 84, 28), textScale: 2.02 },
  SRA3: { contentBox: content(7, 20, 86, 45), priceBox: price(8, 67, 84, 28), textScale: 2.15 },
}

const appBox = (x, y, width, height) => ({ x, y, width, height, ...centered })
const APP_LAYOUT = {
  appTitleBox: appBox(8, 21, 84, 34),
  appPriceBox: appBox(10, 57, 80, 17),
  appValidityBox: appBox(12, 75, 76, 6),
  appRegularLabelBox: appBox(11, 83, 45, 9),
  appRegularPriceBox: appBox(57, 83, 32, 9),
}

function createTemplate({ id, name, format, specialLayout }) {
  const layout = DEFAULT_POSTER_LAYOUTS[format]
  const template = {
    id,
    name,
    format,
    brandTheme: 'ofertamatica',
    backgroundImage: null,
    backgroundFile: null,
    backgroundScope: 'none',
    backgroundVisible: false,
    backgroundOpacity: 1,
    backgroundRotation: 0,
    backgroundFit: 'fill',
    backgroundPositionX: 'center',
    backgroundPositionY: 'center',
    safeArea: 3,
    showCurrency: true,
    currencyFromBackground: false,
    contentBox: layout.contentBox,
    priceBox: layout.priceBox,
    textStyles: textStyles(layout.textScale, layout.textScales),
    configVersion: LAYOUT_CONFIG_VERSION,
  }

  if (specialLayout === 'app-offer') {
    template.specialLayout = specialLayout
    Object.assign(template, structuredClone(APP_LAYOUT))
    template.appValidityText = 'OFERTA VÁLIDA ATÉ 22/09/26'
    template.appRegularLabel = 'Preço fora do aplicativo'
    template.textStyles = {
      ...template.textStyles,
      appTitle: { ...baseTextStyles.description, fontMin: 3, fontMax: 12, scale: 1 },
      appPrice: { ...baseTextStyles.price, fontMin: 6, fontMax: 20, scale: 1 },
      appValidity: { ...baseTextStyles.unit, fontMin: 2.1, fontMax: 5, scale: 1 },
      appRegularLabel: { ...baseTextStyles.unit, fontMin: 2.3, fontMax: 5, scale: 1 },
      appRegularPrice: { ...baseTextStyles.price, fontMin: 4, fontMax: 10, scale: 1 },
    }
  }

  return template
}

export const POSTER_TEMPLATES = [
  createTemplate({ id: 'ofertamatica-a4x8', name: 'A4 8x1 · A7', format: 'A4X8' }),
  createTemplate({ id: 'ofertamatica-a4x4', name: 'A4 4x1', format: 'A4X4' }),
  createTemplate({ id: 'ofertamatica-a4x2', name: 'A4 2x1', format: 'A4X2_CIMA_BAIXO' }),
  createTemplate({ id: 'ofertamatica-a4x2-invertido', name: 'A4 2x1 Invertido', format: 'A4X2_INVERTIDO' }),
  createTemplate({ id: 'ofertamatica-app', name: 'A4 2x1 App', format: 'A4X2_APP', specialLayout: 'app-offer' }),
  createTemplate({ id: 'ofertamatica-a4', name: 'A4', format: 'A4' }),
  createTemplate({ id: 'ofertamatica-a5', name: 'A5', format: 'A5' }),
  createTemplate({ id: 'ofertamatica-a3', name: 'A3', format: 'A3' }),
  createTemplate({ id: 'ofertamatica-sra3', name: 'SRA3', format: 'SRA3' }),
]

export const DEFAULT_TEMPLATE_BY_FORMAT = Object.fromEntries(POSTER_TEMPLATES.map((template) => [template.format, template.id]))
export function getPosterTemplate(templateId) { return POSTER_TEMPLATES.find((template) => template.id === templateId) || POSTER_TEMPLATES[0] }
export function getPosterTemplatesForFormat(formatId) { return POSTER_TEMPLATES.filter((template) => template.format === formatId) }
export function getDefaultTemplateForFormat(formatId) { return getPosterTemplate(DEFAULT_TEMPLATE_BY_FORMAT[formatId]) }
