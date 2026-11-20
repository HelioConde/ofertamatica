// Curadoria editorial concreta: todos os IDs correspondem a modelos realmente disponíveis.
// Não apresenta ordem editorial como ranking de buscas; impressões não equivalem a popularidade.
export const CURATED_POSTER_COLLECTIONS = {
  'placas-sazonais': {
    heading: 'Modelos de placas sazonais para imprimir grátis',
    intro: 'Compare modelos Black Friday com opções econômicas de fundo branco e quatro estilos de Esquenta Black Friday, além de Halloween, Natal, verão e aniversário da loja. Veja os cabeçalhos ilustrados reais, personalize produto, unidade e preço e imprima em A4, A5 ou A3.',
    models: ['black-friday', 'black-friday-white', 'black-friday-etiqueta', 'black-friday-de-por', 'black-friday-relampago', 'black-friday-kit', 'black-friday-premium', 'black-friday-estouro', 'black-friday-economico', 'black-friday-branco-impacto', 'esquenta-black-friday-antecipada', 'esquenta-black-friday-de-por', 'esquenta-black-friday-semana', 'esquenta-black-friday-especial', 'halloween', 'natal', 'verao', 'aniversario', 'fim-de-semana'],
    note: 'Datas comemorativas não justificam valores antigos, descontos não comprovados nem condições escondidas. Todos os preços mostrados são fictícios.',
  },
  'cartaz-black-friday': {
    heading: '16 modelos de cartaz Black Friday para imprimir grátis',
    intro: 'Escolha a arte antes de montar a oferta. As seis primeiras opções têm fundo branco para economizar tinta, incluindo quatro modelos de Esquenta Black Friday. Há também estilos preto e amarelo, De/Por, kit e outros. As prévias usam preços fictícios: confira produto, preço anterior e condições antes de imprimir.',
    models: ['black-friday-economico', 'black-friday-branco-impacto', 'esquenta-black-friday-antecipada', 'esquenta-black-friday-de-por', 'esquenta-black-friday-semana', 'esquenta-black-friday-especial', 'black-friday', 'black-friday-white', 'black-friday-etiqueta', 'black-friday-de-por', 'black-friday-relampago', 'black-friday-kit', 'black-friday-premium', 'black-friday-estouro', 'de-por', 'relampago'],
    note: 'As versões econômicas usam fundo branco e detalhes pretos para poupar tinta. No De/Por, confirme o preço anterior que realmente foi praticado e informe condições e validade da oferta.',
  },
  'placas-para-hortifruti': {
    heading: 'Placas de hortifruti para imprimir: exemplos de modelos',
    intro: 'Compare um cartaz verde de frutas, uma opção com foto própria e um modelo de oferta do dia. Use KG, maço, bandeja ou unidade de forma coerente com a cobrança do caixa.',
    models: ['hortifruti', 'foto-direita', 'oferta-dia'],
    note: 'As frutas e os preços das miniaturas são exemplos, não valores atualizados do mercado.',
  },
  'placas-para-padaria': {
    heading: 'Modelos para a vitrine e o balcão da padaria',
    intro: 'Veja um padrão quente para pão francês, outro de fim de semana e um cartaz amarelo clássico. Confira se pão, fatia de bolo ou salgado é vendido por KG ou unidade.',
    models: ['padaria', 'fim-de-semana', 'classic'],
    note: 'Não confunda preço por peso com preço por unidade; faça uma prova impressa antes de expor.',
  },
  'cartaz-para-supermercado': {
    heading: 'Placas para os setores do supermercado',
    intro: 'Visualize modelos reais para mercearia, hortifruti, padaria e açougue antes de escolher a arte e imprimir. O preço fictício serve apenas para demonstrar o contraste.',
    models: ['classic', 'hortifruti', 'padaria', 'acougue'],
    note: 'Cada setor pode exigir unidade e identificação diferentes; confira o preço praticado na loja.',
  },
  'cartazes-para-farmacia': {
    heading: 'Modelos de preço para farmácia e perfumaria',
    intro: 'Compare a placa clara de higiene, uma opção com foto própria e a apresentação de preço para clube. Evite atribuir condições promocionais que não estejam em vigor.',
    models: ['farmacia', 'foto-central', 'clube'],
    note: 'Para itens sujeitos a regras de publicidade específicas, confirme as normas antes de anunciar.',
  },
  'cartaz-de-oferta-para-imprimir': {
    heading: 'Compare três estilos antes de imprimir seu cartaz',
    intro: 'Veja um modelo tradicional, outro minimalista e a opção só com preço e descrição para papel pré-impresso. Escolha o formato físico compatível com a impressora.',
    models: ['classic', 'minimal', 'preimpresso'],
    note: 'Confirme escala 100%, dimensão da folha e fundos habilitados na impressão do navegador.',
  },
}

export function curatedModelsForSlug(slug) {
  return CURATED_POSTER_COLLECTIONS[slug] || null
}
