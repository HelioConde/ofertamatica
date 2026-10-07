import { parseProductList } from '../src/poster-engine/parseProduct.js'

const failures = []
const expect = (condition, message) => {
  if (!condition) failures.push(message)
}

const normal = parseProductList('Café 500 g 18,90')
expect(normal.length === 1, 'Lista simples deve gerar 1 produto')
expect(normal[0]?.description === 'CAFÉ', 'Descrição simples incorreta')
expect(normal[0]?.unit === '500 G', 'Unidade simples incorreta')
expect(normal[0]?.price === '18,90', 'Preço simples incorreto')

const excelPaste = parseProductList([
  'Produto\tMarca\tUnidade\tPreço',
  'Café\tMelitta\t500 g\t18,90',
  'Leite\tIntegral\t1 L\t4,99',
].join('\n'))
expect(excelPaste.length === 2, 'Cabeçalho de Excel deve ser ignorado')
expect(excelPaste[0]?.description === 'CAFÉ', 'Produto colado do Excel incorreto')
expect(excelPaste[0]?.subdescription === 'MELITTA', 'Marca colada do Excel incorreta')
expect(excelPaste[0]?.unit === '500 G', 'Unidade colada do Excel incorreta')
expect(excelPaste[0]?.price === '18,90', 'Preço colado do Excel incorreto')

const semicolon = parseProductList('Arroz;Camil;5 kg;29,99')
expect(semicolon.length === 1, 'Linha com ponto e vírgula deve gerar 1 produto')
expect(semicolon[0]?.description === 'ARROZ', 'Descrição com ponto e vírgula incorreta')
expect(semicolon[0]?.subdescription === 'CAMIL', 'Marca com ponto e vírgula incorreta')
expect(semicolon[0]?.unit === '5 KG', 'Unidade com ponto e vírgula incorreta')
expect(semicolon[0]?.price === '29,99', 'Preço com ponto e vírgula incorreto')

const pipe = parseProductList('Feijão|Kicaldo|1 kg|7,49')
expect(pipe.length === 1, 'Linha com pipe deve gerar 1 produto')
expect(pipe[0]?.description === 'FEIJÃO', 'Descrição com pipe incorreta')
expect(pipe[0]?.subdescription === 'KICALDO', 'Marca com pipe incorreta')
expect(pipe[0]?.unit === '1 KG', 'Unidade com pipe incorreta')
expect(pipe[0]?.price === '7,49', 'Preço com pipe incorreto')

const bread = parseProductList('Pão Francês kg 10,90')
expect(bread.length === 1, 'Pão Francês deve gerar 1 produto')
expect(bread[0]?.description === 'PÃO', 'Pão Francês deve manter PÃO como nome do produto')
expect(bread[0]?.subdescription === 'FRANCÊS', 'Pão Francês deve usar FRANCÊS como marca / variante')
expect(bread[0]?.unit === 'KG', 'Pão Francês deve manter KG como unidade')
expect(bread[0]?.price === '10,90', 'Pão Francês deve manter o preço')

const headerOnly = parseProductList('Descrição;Marca;Peso;Valor')
expect(headerOnly.length === 0, 'Cabeçalho isolado não deve virar cartaz')

if (failures.length) {
  console.error('\nFalhas de validação do parser:')
  failures.forEach((failure) => console.error(' - ' + failure))
  process.exit(1)
}

console.log('Parser validado: lista simples, Excel, Pão Francês, cabeçalho, ponto e vírgula e pipe OK.')
