import { chromium } from 'playwright'
import * as XLSX from '@e965/xlsx'
import { POSTER_FORMAT_OPTIONS } from '../src/config/posterFormats.js'

const origin = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5183'
const browser = await chromium.launch({ headless: true })
const results = []
const failures = []

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

for (const format of POSTER_FORMAT_OPTIONS.filter(item => item.id !== 'SRA3')) {
  await run('PDF real ' + format.id + ' (' + format.widthMm + 'x' + format.heightMm + 'mm)', async (page) => {
    await openEditor(page, format.id)
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
console.log('QA de lançamento: ' + results.length + ' aprovações, ' + failures.length + ' falhas.')
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2))
  process.exitCode = 1
}
