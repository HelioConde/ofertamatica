# Ofertamática

Ofertamática é uma ferramenta web para criação de placas e cartazes promocionais para supermercados, mercados, atacarejos e outros negócios do varejo.

## Regra obrigatória de entrada do produto

> **Ao acessar `https://ofertamatica.com.br/`, o usuário deve cair diretamente na criação de placas, começando pelo seletor de formatos.**

Esta é uma regra permanente:

- `/` é a Home e o ponto de entrada do criador;
- não criar landing intermediária antes do criador;
- o logo e **Criar placas** levam para `/`;
- `/criar-placas/` é apenas um alias legado e é normalizado para `/`;
- Modelos, Formatos, Como funciona e Guias permanecem em páginas separadas;
- se uma mudança futura conflitar com esta regra, a entrada direta no criador tem prioridade.

## Diferencial principal: 2 cliques

> **A primeira placa deve poder ficar pronta em 2 cliques: escolher o formato e gerar a partir da lista de produtos.**

Essa é uma regra de produto tão importante quanto a entrada direta no criador:

- não inserir uma etapa obrigatória de escolha de modelo, campanha, cadastro ou personalização antes da geração;
- tipos de oferta especiais, headers, cores, fontes e outros ajustes entram depois do resultado;
- novos recursos devem preservar o caminho rápido por padrão;
- quando uma funcionalidade avançada aumentar a burocracia, ela deve ficar como opção, não como etapa obrigatória;
- o objetivo é reduzir o tempo entre entrar no site e ver a primeira placa pronta;
- quando a área de transferência estiver disponível, o segundo clique pode ser literalmente **Colar e gerar**.

## Regra de viewport e retenção

No desktop, a Home e o workspace do criador devem se comportar como uma ferramenta instalada:

- a rota `/` deve caber em `100dvh` sem exigir rolagem vertical global;
- o editor também deve caber em `100dvh`;
- quando houver conteúdo maior que a área disponível, a rolagem deve acontecer dentro do componente (lista de produtos, biblioteca de headers, configurações etc.);
- a prévia deve permanecer visível durante a edição no desktop;
- não inserir hero, depoimentos, artigos ou landing antes do seletor de formatos;
- mensagens de valor devem ser compactas e ficar integradas ao próprio fluxo de criação;
- o primeiro acesso deve começar vazio; exemplos são opt-in e não podem aparecer como rascunho real do usuário;
- retenção deve vir da produtividade: menos passos, autosave, retomada do último trabalho e reutilização de escolhas recentes;
- histórico recente, atalhos e importação rápida devem ficar dentro do fluxo existente, sem criar nova tela obrigatória.

## Rotas principais

- `/` — criação de placas / seletor de formatos;
- `/modelos/` — modelos e estilos;
- `/formatos/` — A4, A5, A3, SRA3 e divisões por folha;
- `/como-funciona/` — fluxo de criação;
- `/guias-para-varejo/` — central de guias;
- `/privacidade/` — política de privacidade;
- `/termos/` — termos de uso;
- páginas SEO específicas ficam em URLs próprias.

As definições de páginas, titles, descriptions e sitemap são centralizadas em:

`src/seo/seoPages.js`

Não duplicar listas de páginas em outros arquivos.

## Criador

O fluxo atual permite:

1. escolher o formato;
2. colar produtos, usar “Colar e gerar”, arrastar arquivo ou importar planilha;
3. revisar descrição, complemento, unidade e preço;
4. personalizar modelo, cores, tipografia e cabeçalho;
5. visualizar o cartaz;
6. revisar papel/orientação;
7. salvar como PDF ou imprimir.

Depois da geração, o usuário também pode mudar o tipo de oferta sem recomeçar o fluxo:

- Padrão;
- De / Por — pode calcular automaticamente o percentual de desconto;
- Leve X por Y — pode mostrar também o preço unitário “cada”;
- Atacado / Varejo — pode informar a quantidade mínima do atacado;
- Clube / App;
- 2ª unidade;
- Oferta de App no formato dedicado.

Essas opções são deliberadamente **opcionais** e não criam uma nova etapa antes da primeira placa.

Atalhos de produtividade no editor:

- Ctrl+Enter (ou Cmd+Enter) gera as placas quando há conteúdo;
- TXT, CSV, XLS e XLSX podem ser arrastados para a entrada rápida;
- colagens vindas de Excel/ERP aceitam tabulação, ponto e vírgula e pipe;
- cabeçalhos comuns como Produto / Unidade / Preço são ignorados automaticamente;
- até cinco listas recentes ficam salvas localmente, com acesso compacto pelo menu “+”.

Retorno recorrente:

- o site possui manifest, service worker e ícones 192/512 para instalação como app quando o navegador oferecer suporte;
- o botão “Instalar app” só aparece quando o navegador disponibiliza o prompt;
- a instalação é opcional e não altera a regra dos 2 cliques.

Outros ajustes opcionais disponíveis depois da geração:

- validade da oferta;
- limite por cliente;
- logo da loja salva localmente no dispositivo;
- header personalizado da loja/campanha, enviado em PNG, JPG ou WebP e salvo localmente;
- salvar como PDF usando o destino PDF da janela de impressão.

Formatos principais disponíveis:

- A4 com 4 cartazes;
- A4 com 2 cartazes;
- A4 com 2 cartazes invertido;
- A4 com 2 ofertas de App;
- A4;
- A5;
- A3;
- SRA3.

A impressão usa as medidas físicas do formato em milímetros.

## Inteligência artificial

**“Crie seu cartaz com IA” é uma próxima implementação.**

Não anunciar IA como recurso disponível no produto atual. O editor atual continua gratuito e sem cadastro obrigatório para começar.

## Publicidade

Google AdSense publisher:

`ca-pub-9514218545388169`

Slots manuais:

- seletor de formatos: `7286894770`;
- páginas de conteúdo/SEO: `5483033524`.

O slot antigo `3215962830` não faz parte do fluxo atual porque a raiz é o criador, não uma landing de conteúdo.

Regras:

- não colocar anúncio manual dentro do editor;
- anúncio bloqueado ou não preenchido não deve reservar espaço vazio;
- Auto Ads permanece conservador/desligado enquanto usamos posições manuais;
- nunca clicar em anúncios próprios para teste.

O arquivo `/ads.txt` deve conter somente:

```text
google.com, pub-9514218545388169, DIRECT, f08c47fec0942fa0
```

A aprovação/recrawl do AdSense depende do Google e não do deploy.

## Analytics

- Google Tag Manager: `GTM-5RGPM6HD`;
- GA4 de referência: `G-K8YWSXBHS7`.

O HTML carrega **somente o GTM**. A instalação direta de `gtag.js` foi removida para evitar pageviews duplicados.

Eventos de produto enviados ao `dataLayer`:

- `ofertamatica_creator_view`;
- `ofertamatica_format_selected`;
- `ofertamatica_draft_resumed`;
- `ofertamatica_print_review`;
- `ofertamatica_print_started`;
- `ofertamatica_first_generation` — mede o tempo até a primeira geração de placas na sessão;
- `ofertamatica_offer_mode_selected` — registra quando o usuário escolhe um tipo de oferta opcional;
- `ofertamatica_store_logo_added` — registra o uso da logo da loja;
- `ofertamatica_custom_header_added` — registra o uso de um header personalizado;
- `ofertamatica_pdf_review`;
- `ofertamatica_pdf_started`;
- `ofertamatica_clipboard_generate` — mede o uso do fluxo literal “Colar e gerar”;
- `ofertamatica_keyboard_generate` — uso do atalho Ctrl/Cmd+Enter;
- `ofertamatica_keyboard_print_review` — uso de Ctrl/Cmd+P para abrir a revisão de impressão;
- `ofertamatica_file_import` — importação pelo seletor;
- `ofertamatica_drag_import` — importação por arrastar e soltar;
- `ofertamatica_recent_job_reused` — reutilização de um trabalho recente salvo localmente;
- `ofertamatica_install_prompt_result` — resultado do prompt de instalação do app;
- `ofertamatica_app_installed` — instalação concluída.

O container GTM pode usar esses eventos para tags/relatórios sem adicionar outro loader de GA4 ao código.

## SEO

O build gera páginas estáticas para as páginas públicas e SEO, além de:

- canonical individual;
- title e description individuais;
- Open Graph;
- JSON-LD;
- breadcrumbs;
- FAQ estruturada;
- `sitemap.xml`;
- `robots.txt`.

A raiz continua sendo o criador e não é substituída por uma landing SEO.

## Desenvolvimento

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Validação do build e parser de listas:

```bash
npm run check:build
```

A validação cobre também entradas simples e colagens de Excel/ERP com cabeçalho, tabulação, ponto e vírgula e pipe.

Build + validação:

```bash
npm run verify
```

## Deploy de produção

Pushes em `main` executam `.github/workflows/deploy-beta.yml`.

O nome do arquivo é histórico; o workflow atual publica **produção** na Locaweb em:

`public_html`

Antes do FTP, o workflow executa build e validações automáticas. O deploy envia assets primeiro e depois o restante do app.

## Segurança

- nunca versionar senhas, tokens ou arquivos `.env`;
- FTP usa GitHub Secrets;
- não colocar credenciais privadas no frontend;
- mudanças de monetização, Analytics ou rota raiz devem preservar as regras deste README.
