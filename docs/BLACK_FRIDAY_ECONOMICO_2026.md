# Black Friday econômico — modelos de fundo branco

A coleção `/cartaz-black-friday/` preserva os modelos antigos escuros e adiciona **seis** modelos sobre branco, sendo quatro versões de **Esquenta Black Friday**.

## Por que CSS em vez de imagem pronta
As ilustrações de referência indicam tipografia preta e fundo branco, mas fixar produto ou valor na imagem impediria editar os dados e imprimir vários cartazes. Portanto as seis variantes são temas `bf-eco-*` e reutilizam os componentes reais de preço, descrição, unidade e cabeçalho.

## Catálogo
- `black-friday-economico` — clássico branco
- `black-friday-branco-impacto` — moldura angular
- `esquenta-black-friday-antecipada` — antecipada
- `esquenta-black-friday-de-por` — comparação De/Por real, só se válida
- `esquenta-black-friday-semana` — faixa de campanha
- `esquenta-black-friday-especial` — selo em contorno

As prévias usam **preços fictícios**. Não fixar datas, descontos ou promessas de estoque no desenho. O cliente deve confirmar preços, condições e validade. A opção de fundo branco reduz grandes áreas de cobertura, mas o consumo real depende da impressora.

Os modelos são registrados em `src/config/posterModelPresets.js`, expostos em `src/config/modelEditorialCollections.js`, filtrados em `src/components/SiteMarketing.jsx` e definidos em `src/styles/black-friday-models.css`. Use `npm run verify` e conferência visual/impresso para validar.
