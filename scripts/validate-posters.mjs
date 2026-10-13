import { POSTER_FORMATS } from '../src/config/posterFormats.js'
import { getDefaultTemplateForFormat } from '../src/config/posterTemplates.js'
import { POSTER_DESCRIPTION_FONT, POSTER_PRICE_FONT } from '../src/config/posterTypography.js'
import { MAX_BACKGROUND_SHEETS, normalizeBackgroundSheetCount, createBackgroundSlots } from '../src/poster-engine/backgroundPrinting.js'
import { POSTER_MODEL_PRESETS } from '../src/config/posterModelPresets.js'
import { createPosterLayouts } from '../src/poster-engine/layoutPlan.js'
import { estimateTextMeasure } from '../src/poster-engine/textMeasure.js'

const failures = []
const expect = (condition, message) => {
  if (!condition) failures.push(message)
}

const samples = [
  { id: 'mamao', description: 'MAMÃO', subdescription: 'FORMOSA', complement: '', unit: 'KG', price: '4,99' },
  { id: 'abacaxi', description: 'ABACAXI', subdescription: 'PEÇA', complement: '', unit: '', price: '6,99' },
  { id: 'uva', description: 'UVA', subdescription: 'VERMELHA', complement: 'SEM SEMENTE', unit: '500G', price: '5,99' },
  { id: 'longo', description: 'BISCOITO RECHEADO', subdescription: 'CHOCOLATE TRADICIONAL', complement: 'PACOTE ECONÔMICO', unit: '350G', price: '12,99' },
]

// Garante que os dois modelos destinados à impressão tradicional permaneçam destacados.
const firstModels = POSTER_MODEL_PRESETS.slice(0, 2).map((item) => item.id)
expect(firstModels[0] === 'preimpresso', 'Papel pré-impresso deve permanecer como primeiro modelo')
expect(firstModels[1] === 'oferta-transparente', 'Oferta sem faixa deve permanecer como segundo modelo')
const transparentHeaderModel = POSTER_MODEL_PRESETS.find((item) => item.id === 'oferta-transparente')
expect(transparentHeaderModel?.headerFooterStyle === 'header-transparente', 'Falta configuração do cabeçalho sem faixa')
expect(transparentHeaderModel?.offerMode === 'standard', 'Modelo sem faixa não deve gerar rodapé de oferta')
expect(transparentHeaderModel?.headerText === '#d71920', 'OFERTA deve ser escrita em vermelho')

const publicFormats = ['A4X4', 'A4X2_CIMA_BAIXO', 'A4X2_INVERTIDO', 'A4X2_APP', 'A4', 'A5', 'A3', 'SRA3']

for (const formatId of publicFormats) {
  const format = POSTER_FORMATS[formatId]
  const template = getDefaultTemplateForFormat(formatId)
  expect(Boolean(format), `Formato ausente: ${formatId}`)
  expect(Boolean(template), `Template padrão ausente: ${formatId}`)
  if (!format || !template) continue
  for (const field of ['description', 'subdescription', 'complement', 'unit']) {
    expect(template.textStyles[field].fontFamily === POSTER_DESCRIPTION_FONT, `${formatId}/${field}: fonte padrão deve ser Burbank Big Cd Bk`)
  }
  expect(template.textStyles.price.fontFamily === POSTER_PRICE_FONT, `${formatId}: preço deve usar Futura Price`)
  if (format.specialLayout === 'app-offer') {
    for (const field of ['appTitle', 'appValidity', 'appRegularLabel']) {
      expect(template.textStyles[field].fontFamily === POSTER_DESCRIPTION_FONT, `${formatId}/${field}: deve usar Burbank`)
    }
    for (const field of ['appPrice', 'appRegularPrice']) {
      expect(template.textStyles[field].fontFamily === POSTER_PRICE_FONT, `${formatId}/${field}: deve usar Futura Price`)
    }
  }

  const blanks = createBackgroundSlots(format)
  expect(blanks.length === format.postersPerSheet, `${formatId}: fundos não preenchem todas as posições`)
  expect(blanks.every((blank) => blank.price === '' && blank.description === ''), `${formatId}: fundo contém descrição/preço`)
  const layouts = createPosterLayouts(samples, template, format, estimateTextMeasure)

  for (const sample of samples) {
    const layout = layouts[sample.id]
    expect(Boolean(layout), `${formatId}/${sample.id}: layout ausente`)
    if (!layout) continue

    for (const line of layout.content.lines) {
      expect(line.x >= -0.5, `${formatId}/${sample.id}/${line.field}: x negativo`)
      expect(line.y >= -0.5, `${formatId}/${sample.id}/${line.field}: y negativo`)
      expect(line.x + line.width <= 100.5, `${formatId}/${sample.id}/${line.field}: estoura largura`)
      expect(line.y + line.height <= 100.5, `${formatId}/${sample.id}/${line.field}: estoura altura`)
      expect(line.fontSizeMm > 0, `${formatId}/${sample.id}/${line.field}: fonte inválida`)
      expect(line.style.fontFamily === POSTER_DESCRIPTION_FONT, `${formatId}/${sample.id}/${line.field}: texto deve usar Burbank, inclusive com acentos`)
    }

    const price = layout.price
    expect(price.x >= -0.5, `${formatId}/${sample.id}/preço: x negativo`)
    expect(price.y >= -0.5, `${formatId}/${sample.id}/preço: y negativo`)
    expect(price.x + price.width <= 100.5, `${formatId}/${sample.id}/preço: estoura largura`)
    expect(price.y + price.height <= 100.5, `${formatId}/${sample.id}/preço: estoura altura`)
    expect(price.fontSizeMm >= template.textStyles.price.fontMin, `${formatId}/${sample.id}/preço: fonte abaixo do mínimo`)
    expect(
      String(price.style.fontFamily || '').includes('Futura Price'),
      `${formatId}/${sample.id}/preço: fonte padrão não é Futura Price`,
    )
  }
}

// SRA3 mantém a composição do A3, mas ocupa a folha física maior.
expect(POSTER_FORMATS.SRA3.widthMm === 320 && POSTER_FORMATS.SRA3.heightMm === 450, 'Dimensão SRA3 incorreta')
expect(POSTER_FORMATS.A3.widthMm === 297 && POSTER_FORMATS.A3.heightMm === 420, 'Dimensão A3 alterada')
expect(POSTER_FORMATS.SRA3.postersPerSheet === 1, 'SRA3 precisa imprimir um cartaz por folha')
const a3Layout = getDefaultTemplateForFormat('A3')
const sra3Layout = getDefaultTemplateForFormat('SRA3')
expect(JSON.stringify(a3Layout.contentBox) === JSON.stringify(sra3Layout.contentBox), 'SRA3 deve usar a mesma posição da descrição do A3')
expect(JSON.stringify(a3Layout.priceBox) === JSON.stringify(sra3Layout.priceBox), 'SRA3 deve usar a mesma posição do preço do A3')
expect(POSTER_FORMATS.A3.backgroundScope === POSTER_FORMATS.SRA3.backgroundScope, 'SRA3 deve usar o mesmo modo de fundo do A3')

expect(normalizeBackgroundSheetCount(0) === 1, 'A impressão de fundos requer ao menos uma folha')
expect(normalizeBackgroundSheetCount(1000) === MAX_BACKGROUND_SHEETS, 'Limite máximo de folhas não respeitado')
expect(normalizeBackgroundSheetCount('3') === 3, 'Quantidade válida de folhas alterada')

if (failures.length) {
  console.error('\nFalhas de validação dos cartazes:')
  failures.forEach((failure) => console.error(' - ' + failure))
  process.exit(1)
}

console.log(`Cartazes validados: ${publicFormats.length} formatos × ${samples.length} amostras, sem overflow lógico.`)
