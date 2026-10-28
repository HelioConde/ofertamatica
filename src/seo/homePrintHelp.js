// Conteúdo prático de referência para a home, usado no React e no HTML estático.
// A intenção é ajudar o comprador de cartazes, não criar texto para preencher páginas.
export const HOME_PRINT_OPTIONS = [
  { id: 'A4X8', label: '8 cartazes A7 por A4', paper: 'A4', perSheet: 8, use: 'Sinalização compacta perto dos produtos' },
  { id: 'A4X4', label: '4 cartazes A6 por A4', paper: 'A4', perSheet: 4, use: 'Gôndolas e campanhas com muitas ofertas' },
  { id: 'A4X2_CIMA_BAIXO', label: '2 cartazes por A4', paper: 'A4', perSheet: 2, use: 'Balcão e ponta de gôndola' },
  { id: 'A4', label: '1 cartaz por A4', paper: 'A4', perSheet: 1, use: 'Produto em destaque e preço visto de longe' },
  { id: 'A5', label: '1 cartaz por A5', paper: 'A5', perSheet: 1, use: 'Balcão de atendimento com espaço limitado' },
  { id: 'A3', label: '1 cartaz por A3', paper: 'A3', perSheet: 1, use: 'Vitrine ou comunicação de maior alcance' },
]

export const HOME_GUIDANCE = [
  {
    title: 'Confira a lista antes de criar',
    text: 'Separe uma linha por produto. Por exemplo: “PÃO FRANCÊS KG 10,90” e “CAFÉ TORRADO 500G 18,90”. Os preços são fictícios; substitua pelos valores vigentes na sua loja. A unidade anunciada precisa corresponder à unidade de venda no caixa.',
  },
  {
    title: 'Planeje a quantidade de folhas',
    text: 'Com 37 ofertas e quatro placas A6 por folha A4, serão necessárias 10 folhas: 9 completas e uma com somente um cartaz, deixando três posições sem uso. Faça uma prova de impressão antes de produzir o lote inteiro.',
  },
  {
    title: 'Revise o cartaz já montado',
    text: 'Confira nome, peso, variedade, unidade, preço, validade e eventuais condições de desconto. Para imprimir em tamanho real, confirme formato, orientação e escala de 100% na janela de impressão. Desative cabeçalhos e rodapés e teste os gráficos de fundo.',
  },
]
export const HOME_LIMITATIONS = 'O gerador ajuda a diagramar e imprimir. Ele não consulta o ERP, não confirma preços do caixa, não verifica a legislação da promoção e não substitui a revisão da loja. Fotos e logos adicionadas pelo visitante devem ter uso autorizado.'

export function calculatePrintPlan(rawQuantity, formatId) {
  const option = HOME_PRINT_OPTIONS.find((item) => item.id === formatId) || HOME_PRINT_OPTIONS[1]
  const n = Number(rawQuantity)
  const quantity = Number.isFinite(n) ? Math.min(9999, Math.max(1, Math.floor(n))) : 1
  const sheets = Math.ceil(quantity / option.perSheet)
  const freeSlots = sheets * option.perSheet - quantity
  return { quantity, sheets, freeSlots, option }
}
