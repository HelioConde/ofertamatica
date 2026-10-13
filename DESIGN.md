# Ofertamática — DESIGN.md

> Design system específico do produto, inspirado na estrutura do projeto [Awesome DESIGN.md](https://github.com/VoltAgent/awesome-design-md). Não é cópia do visual de outra marca. A fonte de verdade é o produto atual, o código e as capturas reais do repositório.

## 1. Objetivo e atmosfera

Ferramenta profissional, rápida e amigável de impressão de cartazes para varejo brasileiro. Visual de **aplicativo de trabalho**, não landing page publicitária. Prioridade absoluta: encontrar o formato, inserir produtos, conferir a prévia e imprimir com medidas corretas.

- Home em formato de aplicativo com seletor de formatos em primeiro plano; nunca adicionar hero entre a entrada e o seletor.
- Desktop: Home e editor operáveis dentro de uma viewport, com rolagem interna quando necessário.
- Primeiro cartaz em dois cliques: selecionar formato e gerar produtos. Personalização é opcional.
- Textos curtos e objetivos em pt-BR; clareza importa mais que efeito visual.
- Não mudar dimensões, proporções ou regras físicas do cartaz para melhorar a aparência da tela.

## 2. Cores e papel das cores

As variáveis principais já existem em `src/styles/home.css` e `src/styles.css`. Reutilizá-las, sem criar uma segunda paleta:

| Papel | Token / cor atual | Uso |
| --- | --- | --- |
| Ação principal | `--blue: #1d63e9` | Links, botão principal, seleção e foco |
| Ação em hover | `--blue-dark: #134fc3` | Realce e estados ativos |
| Área suave | `--blue-soft: #edf4ff` | Apoios leves e áreas selecionadas |
| Fundo da aplicação | `#f4f7fb` | Superfície geral |
| Cartões e formulários | `--surface: #ffffff` | Superfícies de trabalho |
| Linhas | `--line: #d8e2ef` | Divisores e bordas |
| Texto secundário | `--muted: #697a95` | Metadados e dicas |
| Sucesso | `--green: #19b66c` | Confirmações verdadeiras |

A identidade de cartazes inclui amarelo, vermelho, laranja e alto contraste **dentro da arte impressa**. Não usar essas cores para criar ruído competitivo em todos os controles da aplicação. Laranja pode destacar orientação e o foco de teclado, sem prejudicar o contraste.

## 3. Tipografia

- UI: Inter, system-ui e fontes sans-serif da pilha atual; conteúdo de controles legível em tamanhos normais.
- Títulos: hierarquia inequívoca `h1 > h2 > h3`; alto peso apenas quando a etapa precisa de destaque.
- Descrições e instruções: não usar letras minúsculas excessivamente pequenas em mobile.
- Campos editáveis em celular: ao menos 16px quando focados, evitando zoom involuntário no Safari iOS.
- Preço da placa: preservar tipografia própria e ajuste automático de texto. Nunca trocar a fonte do preço ao refinar a UI.
- Conteúdo não deve ser cortado: acentos, moedas, centavos, unidade e validade precisam caber inteiros.

### Tipografia oficial dos cartazes

- **Descrição, unidade e textos adicionais:** Burbank Big Cd Bk (`primor-cartazes.otf`), inclusive com acentos.
- **Preços:** Futura Price (`futura-extra-black-condensed-italic.otf`), também nos cartazes de App.
- Tokens: `src/config/posterTypography.js`. Arquivos `@font-face`: `src/styles/posters.css`.
- Preservar escolhas de fonte feitas manualmente pelo usuário; Burbank/Futura são os padrões para novas placas.
- A tipografia de navegação e formulários continua Inter/system-ui.
- Validar `MAÇÃ`, `PÃO`, `AÇAÍ`, `PROMOÇÃO` na prévia, sem troca automática de família.

## 4. Componentes e estados

- Seletor de formato: mostrar miniatura real, nome do formato, subdivisões e uso. Todos os cartões devem ser botões nativos e funcionar com Enter/Espaço.
- Ação principal clara e exclusiva por etapa; não competir com anúncios.
- Inputs com rótulo explícito, ajuda quando necessária, erro útil e estados `disabled`/loading identificáveis.
- Foco visível e não encoberto para `a`, `button`, `input`, `select`, `textarea` e controles customizados.
- Mínimo 24×24px de área clicável no desktop quando possível; 44×44px para alvos principais em toque.
- Diálogos de privacidade/edição com `aria-modal`, gestão de foco e fechamento acessível.
- Não esconder ações críticas em hover; em telas sensíveis ao toque tudo precisa ser descoberto sem mouse.

## 5. Layout e responsividade

- Layout com restrições claras: header compacto, grid com cartões reais e prévia de impressão sem distorção.
- Usar espaçamentos repetíveis (4, 8, 12, 16, 24, 32px), não margens arbitrárias por componente.
- Testar larguras de 360, 390, 412, 768, 1000 e 1440px; não aceitar overflow horizontal involuntário.
- A navegação pode abreviar rótulos, mas os nomes acessíveis devem continuar completos.
- Preservar o padrão de cartões entre `/`, `/formatos/` e `/modelos/`.
- Ads e consentimento jamais devem encobrir o editor, impedir foco ou bloquear gerar/imprimir.

## 6. Impressão e modelos

- Medidas em mm e regras de paginação são contratos funcionais, não decisões estéticas.
- Prévia e folha impressa precisam refletir o mesmo modelo.
- Papel pré-impresso deve continuar permitindo impressão apenas de textos e preços.
- Fundos sem produto/preço permanecem um fluxo separado de Modelos.
- Testar margens de impressão, ausência de corte e formato SRA3/A3 conforme o suporte real do produto.

## 7. Movimento e desempenho

- Interações discretas (150–200ms), preferencialmente por `opacity`/`transform`; evitar animação contínua no editor.
- Respeitar `prefers-reduced-motion: reduce`.
- Não adicionar bibliotecas de animação, hero pesado ou imagens decorativas na Home sem benefício demonstrado.
- Evitar flashes de layout ou fontes no carregamento: a seleção precisa ficar usável imediatamente.

## 8. Anti-padrões e definição de pronto

**Não fazer:** transformar a Home em landing; acrescentar popups obrigatórios; usar gradiente e glow por padrão; copiar identidade de outro serviço; adicionar texto com menos contraste só para parecer sofisticado; reduzir miniaturas a ícones abstratos; alterar o PDF sem QA de impressão.

**Pronto somente quando:** `npm run verify` passa, o Playwright verifica fluxo de criação e importação, `npm run qa:design` produz relatório, screenshots das rotas alteradas são revisadas em desktop e mobile, e nenhuma regressão é encontrada em navegação por teclado, impressões e consentimento.

Ver `AGENTS.md` para o uso combinado das cinco ferramentas.
