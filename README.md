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

## Rotas principais

- `/` — criação de placas / seletor de formatos;
- `/modelos/` — modelos e estilos;
- `/formatos/` — A4, A5, A3, SRA3 e divisões por folha;
- `/como-funciona/` — fluxo de criação;
- `/guias-para-varejo/` — central de guias;
- páginas SEO específicas ficam em URLs próprias.

As definições de páginas, titles, descriptions e sitemap são centralizadas em:

`src/seo/seoPages.js`

Não duplicar listas de páginas em outros arquivos.

## Criador

O fluxo atual permite:

1. escolher o formato;
2. colar produtos ou importar planilha;
3. revisar descrição, complemento, unidade e preço;
4. personalizar modelo, cores, tipografia e cabeçalho;
5. visualizar o cartaz;
6. revisar papel/orientação;
7. imprimir.

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
- `ofertamatica_print_started`.

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

Validação do build:

```bash
npm run check:build
```

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
