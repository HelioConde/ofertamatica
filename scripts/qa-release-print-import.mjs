import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import * as XLSX from '@e965/xlsx'
import { POSTER_FORMAT_OPTIONS } from '../src/config/posterFormats.js'

const origin = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183'
const browser = await chromium.launch({ headless: true })
const results = []
const failures = []
const printReports = []
const printOutDir = path.resolve('screenshots/print-qa')
await fs.mkdir(printOutDir, { recursive: true })

async function run(name, callback) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.addInitScript(() => {
    // Browser-native print dialogs do not exist in headless CI.
    // Keep print styles active and separately generate a genuine Chromium PDF.
    window.print = () => { window.__ofertaPrintRequested = true }
  })
  try {
    await callback(page)
    results.push(name)
    console.log('OK ' + name)
  } catch (error) {
    failures.push({ name, error: String(error?.message || error) })
    console.error('FALHOU ' + name + ': ' + String(error?.message || error))
  } finally {
    await page.close()
  }
}

async function openEditor(page, formatId = 'A4') {
  await page.goto(origin + '/', { waitUntil: 'domcontentloaded' })
  await page.locator('.format-choice[data-format-id="' + formatId + '"]').click()
  await page.locator('textarea[aria-label="Lista de produtos, uma linha por produto"]').waitFor({ state: 'visible' })
}

async function checkGenerated(page, price = '18,90') {
  try {
    await page.waitForFunction((expected) => {
      const context = document.querySelector('.editor-context')?.textContent || ''
      // The interpreted prices are editable <input> values, not text nodes.
      const prices = [...document.querySelectorAll('.interpreted .product-row:not(.product-head) input.price-field')]
        .map(input => input.value)
      return context.includes('2 produtos') && prices.some(value => value.includes(expected))
    }, price, { timeout: 12000 })
  } catch {
    const debug = await page.evaluate(() => ({
      context: document.querySelector('.editor-context')?.textContent,
      count: document.querySelector('.interpreted .round-count')?.textContent,
      prices: [...document.querySelectorAll('.interpreted .product-row:not(.product-head) input.price-field')].map(input => input.value),
      errors: [...document.querySelectorAll('.oferta-import-error')].map(node => node.textContent),
    }))
    throw new Error('Produtos não confirmados na interface: ' + JSON.stringify(debug))
  }
  if (await page.locator('.oferta-import-error').count()) {
    throw new Error('Erro de importação: ' + await page.locator('.oferta-import-error').innerText())
  }
}

const rows = [
  ['Produto', 'Marca', 'Unidade', 'Preço'],
  ['Café', 'Melitta', '500 g', '18,90'],
  ['Leite', 'Integral', '1 L', '4,99'],
]
const workbook = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Produtos')

const inputs = [
  { name: 'produtos.txt', mimeType: 'text/plain', buffer: Buffer.from('Café Melitta 500 g 18,90\nLeite Integral 1 L 4,99') },
  { name: 'produtos.csv', mimeType: 'text/csv', buffer: Buffer.from('Produto;Marca;Unidade;Preço\nCafé;Melitta;500 g;18,90\nLeite;Integral;1 L;4,99') },
  { name: 'produtos-virgula.csv', mimeType: 'text/csv', buffer: Buffer.from('Produto,Marca,Unidade,Preço\nCafé,Melitta,500 g,"18,90"\nLeite,Integral,1 L,"4,99"') },
  { name: 'produtos.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })) },
  { name: 'produtos.xls', mimeType: 'application/vnd.ms-excel', buffer: Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xls' })) },
]
for (const file of inputs) {
  await run('Importação real ' + file.name, async (page) => {
    await openEditor(page)
    await page.locator('.editor-actions input[type="file"]').setInputFiles(file)
    await checkGenerated(page)
  })
}

for (const source of [
  { name: 'colar Excel com TAB', content: rows.map(row => row.join('\t')).join('\n') },
  { name: 'colar com ponto e vírgula', content: 'Café;Melitta;500 g;18,90\nLeite;Integral;1 L;4,99' },
  { name: 'colar com pipe', content: 'Café|Melitta|500 g|18,90\nLeite|Integral|1 L|4,99' },
]) {
  await run(source.name, async (page) => {
    await openEditor(page)
    await page.locator('textarea[aria-label="Lista de produtos, uma linha por produto"]').fill(source.content)
    await page.locator('.editor-actions .generate-button').click()
    await checkGenerated(page)
  })
}

for (const format of POSTER_FORMAT_OPTIONS) {
  await run('PDF real ' + format.id + ' (' + format.widthMm + 'x' + format.heightMm + 'mm)', async (page) => {
    // SRA3 é opção profissional no seletor A3; não aparece na Home.
    // Testá-lo pelo fluxo real é mais fiel do que fingir haver um card SRA3.
    await openEditor(page, format.id === 'SRA3' ? 'A3' : format.id)
    if (format.id === 'SRA3') {
      await page.getByRole('combobox', { name: 'Tamanho da folha para impressão' }).selectOption('SRA3')
      await page.waitForFunction(() => document.querySelector('.editor-context')?.textContent?.includes('SRA3'))
    }
    await page.locator('textarea[aria-label="Lista de produtos, uma linha por produto"]')
      .fill('Café Melitta 500 g 18,90\nLeite Integral 1 L 4,99')
    await page.locator('.editor-actions .generate-button').click()
    await checkGenerated(page)
    await page.locator('.preview-output-actions .pdf-button').click()
    await page.getByRole('dialog', { name: /Confira antes de gerar o PDF/ }).waitFor()
    await page.getByRole('button', { name: 'Abrir para salvar PDF' }).click()
    await page.waitForFunction(() => Boolean(window.__ofertaPrintRequested) && document.body.classList.contains('poster-printing'))
    const hasRightPageSize = await page.evaluate(({ width, height }) => [...document.querySelectorAll('style')]
      .some(style => style.textContent.includes('@page { size: ' + width + 'mm ' + height + 'mm; margin: 0; }')),
    { width: format.widthMm, height: format.heightMm })
    if (!hasRightPageSize) throw new Error('CSS @page não corresponde ao tamanho físico solicitado')
    // Valida o conteúdo da folha efetivamente impressa, e não só a prévia na tela.
    await page.emulateMedia({ media: 'print' })
    const printSheet = page.locator('.poster-print-root-complete .poster-sheet').first()
    await printSheet.waitFor({ state: 'visible', timeout: 12000 })
    const rendered = await printSheet.evaluate((sheet) => {
      const get = (selector) => sheet.querySelector(selector)
      const sheetRect = sheet.getBoundingClientRect()
      const description = get('.poster-field-description, .poster-app-appTitle > span')
      const price = get('.poster-price-value')
      const ink = [...sheet.querySelectorAll('.poster-field-description, .poster-field-subdescription, .poster-field-complement, .poster-field-unit, .poster-app-appTitle > span, .poster-price-value')]
      // A Futura itálica usa line-height visualmente compacto (.78): seu
      // scrollHeight costuma superar clientHeight mesmo quando overflow:visible.
      // Apenas reportamos corte quando o bloco de texto extravasa um ANCESTRAL
      // com overflow hidden/clip, ou quando sai dos limites físicos do cartaz.
      const clipped = ink
        .filter(el => {
          if (!el.textContent?.trim()) return false
          const range = document.createRange()
          range.selectNodeContents(el)
          const inkRect = range.getBoundingClientRect()
          const rect = inkRect.width && inkRect.height ? inkRect : el.getBoundingClientRect()
          let parent = el.parentElement
          while (parent && parent !== sheet) {
            const overflow = getComputedStyle(parent)
            const clipX = ['hidden', 'clip'].includes(overflow.overflowX)
            const clipY = ['hidden', 'clip'].includes(overflow.overflowY)
            if (clipX || clipY) {
              const bounds = parent.getBoundingClientRect()
              if ((clipX && (rect.left < bounds.left - 3 || rect.right > bounds.right + 3)) ||
                  (clipY && (rect.top < bounds.top - 3 || rect.bottom > bounds.bottom + 3))) {
                return true
              }
            }
            parent = parent.parentElement
          }
          const card = el.closest('.poster-card')
          if (!card) return false
          const bounds = card.getBoundingClientRect()
          return rect.left < bounds.left - 3 || rect.right > bounds.right + 3 ||
            rect.top < bounds.top - 3 || rect.bottom > bounds.bottom + 3
        })
        .map(el => {
          const range = document.createRange()
          range.selectNodeContents(el)
          const rect = range.getBoundingClientRect()
          const card = el.closest('.poster-card')?.getBoundingClientRect()
          const clippingAncestors = []
          for (let parent = el.parentElement; parent && parent !== sheet; parent = parent.parentElement) {
            const style = getComputedStyle(parent)
            if (['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflowY)) {
              const bounds = parent.getBoundingClientRect()
              clippingAncestors.push({ className: parent.className,
                left: Math.round(bounds.left), right: Math.round(bounds.right),
                top: Math.round(bounds.top), bottom: Math.round(bounds.bottom) })
            }
          }
          return {
            className: el.className, text: el.textContent?.slice(0, 60),
            clientHeight: el.clientHeight, scrollHeight: el.scrollHeight,
            ink: { left: Math.round(rect.left), right: Math.round(rect.right),
              top: Math.round(rect.top), bottom: Math.round(rect.bottom) },
            card: card && { left: Math.round(card.left), right: Math.round(card.right),
              top: Math.round(card.top), bottom: Math.round(card.bottom) },
            clippingAncestors,
          }
        })
      return {
        sheetWidthPx: sheetRect.width,
        sheetHeightPx: sheetRect.height,
        descriptionFont: description ? getComputedStyle(description).fontFamily : '',
        priceFont: price ? getComputedStyle(price).fontFamily : '',
        burbankLoaded: document.fonts.check('900 16px "Burbank Big Cd Bk"'),
        futuraLoaded: document.fonts.check('italic 900 16px "Futura Price"'),
        clipped,
      }
    })
    const expectedWidth = format.widthMm * 96 / 25.4
    const expectedHeight = format.heightMm * 96 / 25.4
    if (Math.abs(rendered.sheetWidthPx - expectedWidth) > 2 ||
        Math.abs(rendered.sheetHeightPx - expectedHeight) > 2) {
      throw new Error('Folha impressa não ocupa o tamanho solicitado: ' + JSON.stringify(rendered))
    }
    if (!rendered.descriptionFont.includes('Burbank Big Cd Bk') ||
        !rendered.priceFont.includes('Futura Price') ||
        !rendered.burbankLoaded || !rendered.futuraLoaded) {
      throw new Error('Fonte incorreta ou arquivo ausente no PDF: ' + JSON.stringify(rendered))
    }
    if (rendered.clipped.length) {
      throw new Error('Texto ou preço extrapolando a área de impressão: ' + JSON.stringify(rendered.clipped))
    }
    if (['A4', 'A3', 'SRA3', 'A4X2_APP'].includes(format.id)) {
      await printSheet.screenshot({ path: path.join(printOutDir, format.id + '-impressao.png'), animations: 'disabled' })
    }
    printReports.push({ format: format.id, widthMm: format.widthMm, heightMm: format.heightMm, ...rendered })
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false })
    if (pdf.length < 2000 || !pdf.subarray(0, 5).toString().startsWith('%PDF-')) throw new Error('O navegador não gerou um PDF válido')
    const mediaBox = pdf.toString('latin1').match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/)
    if (!mediaBox) throw new Error('Não foi possível conferir as dimensões reais do PDF')
    const expected = [format.widthMm * 72 / 25.4, format.heightMm * 72 / 25.4]
    const actual = [Number(mediaBox[1]), Number(mediaBox[2])]
    if (actual.some((value, index) => Math.abs(value - expected[index]) > 2)) {
      throw new Error('PDF em tamanho errado: ' + actual.join(' x ') + ' pt; esperado ' + expected.join(' x ') + ' pt')
    }
  })
}
await browser.close()
await fs.writeFile(path.join(printOutDir, 'report.json'), JSON.stringify({ generatedAt: new Date().toISOString(), formats: printReports, failures }, null, 2) + '\n')
console.log('QA de lançamento: ' + results.length + ' aprovações, ' + failures.length + ' falhas.')
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2))
  process.exitCode = 1
}
