# Validade Zero integrado ao Ofertamática

## Arquitetura definitiva

- **Criador de cartazes:** `https://ofertamatica.com.br/` (React/Vite, arquivo raiz).
- **Controle de vencimentos:** `https://ofertamatica.com.br/validade-zero/` (React/CRA, aplicativo completo).
- **Sobre a ferramenta:** `https://ofertamatica.com.br/conheca-validade-zero/` (página editorial SEO).
- O link Validade Zero na **navbar principal** e na área «Mais informações» abre **outra aba** quando acessado pelo criador. Digitar a URL do sistema abre o dashboard imediatamente, sem tela promocional, redirect ou iframe.
- Todos os fontes, testes, assets e configuração de compilação do Validade Zero estão no repositório `HelioConde/ofertamatica`, no diretório `apps/validade-zero/`.
- O aplicativo utiliza o **Supabase existente** do Validade Zero (banco, RLS, Auth, Storage, Edge Function Push). Mover os arquivos Git não duplica nem migra o banco.

## Build e publicação (Locaweb)

`npm run build` executa:
1. Vite para o criador Ofertamática, no `dist/`.
2. Geração das páginas SEO em HTML estático, inclusive `/conheca-validade-zero/`.
3. Instalação isolada de dependências CRA via `npm ci` **quando necessário**, compilação usando `PUBLIC_URL=/validade-zero`, e cópia para `dist/validade-zero/`.

`npm run verify` confere o build, links e assets do novo aplicativo. O workflow
`.github/workflows/deploy-beta.yml` entrega primeiro os assets imutáveis em
`public_html/validade-zero/static/` e só depois publica `index.html`, o manifesto e o Service Worker.

A rotina `scripts/verify-live-validade-zero.mjs` confere assets e, após deploy, o
HTTP 200 direto em `/validade-zero/`, o JS atualizado e o cabeçalho de câmera.

## Segurança, câmera e Push

O Ofertamática bloqueia câmera e microfone na maior parte do site. A regra
`public/.htaccess` **autoriza somente a câmera na rota `/validade-zero/`**,
mantendo o bloqueio em todas as rotas de cartazes e outras ferramentas.

O Push Worker do Validade Zero vive em `/validade-zero/push-sw.js`,
com escopo `/validade-zero/`. Não substituir o `/sw.js` do Ofertamática.
O manifesto PWA possui `start_url`, `scope` e ícones próprios dessa rota.

As credenciais publicáveis do Supabase já existentes em
`apps/validade-zero/.env.production` são usadas no bundle. **Nunca**
incluir `sb_secret_`, `service_role`, VAPID privada ou `VZ_CRON_TOKEN`
no Git, nos bundles ou nos scripts de build. Os segredos do Push e o Cron
continuam exclusivamente no Supabase.

## Passo obrigatório no Supabase Auth

No painel do projeto `bnlvvsjgpywpbfhwdcan`:
**Authentication → URL Configuration → Redirect URLs** → permitir exatamente
`https://ofertamatica.com.br/validade-zero/`.

Preservar o endereço anterior durante o período de transição, caso haja
usuários ainda acessando o GitHub Pages. O frontend já calcula o
`redirect_to` com a origem e o caminho atuais. Se o template de confirmação
usar `{{ .SiteURL }}` em vez de `{{ .RedirectTo }}`, ajustar o template para
que o link de confirmação respeite o endereço do cadastro. Não alterar
URLs de outros aplicativos hospedados no mesmo Supabase inadvertidamente.

## Dados e transição de domínio

**LocalStorage, IndexedDB e Push são separados por origem.** Os dados locais
salvos em `helioconde.github.io` NÃO aparecem automaticamente em
`ofertamatica.com.br`. Usuários do modo local devem:
1. Abrir o site antigo e exportar backup JSON do inventário.
2. Abrir `ofertamatica.com.br/validade-zero/` e restaurar o backup
   explicitamente. Também transferir manualmente fotografias locais se necessário.
3. Reautorizar notificações Push na nova origem; a assinatura anterior não migra.

Contas Supabase continuam com os mesmos dados protegidos por RLS, desde que o
usuário entre com a mesma conta. O novo domínio não recebe a sessão do domínio
anterior: é necessário entrar novamente.


## Barra de navegação e identidade oficial

O Validade Zero usa `apps/validade-zero/src/components/OfertamaticaHeader.js`
e `OfertamaticaHeader.css` para replicar os links principais da navbar
do Ofertamática na mesma ordem, com **Validade Zero** ao final, incluindo a logo original em
`/icons/icon-192.png?v=20261008b`. A navbar fica acima do dashboard e
continua presente no login Supabase, no modo local e durante a restauração da
sessão. O link Validade Zero tem `aria-current="page"` e destaque azul na rota
`/validade-zero/`; a marca oficial continua única, com «Validade Zero» sob
«Ofertamática». O menu lateral permanece exclusivo para filtros, lotes e scanner.

O manifesto PWA e as notificações usam a logo oficial do site, sem alterar
os ícones de categoria/estado dos lotes. CSS com prefixo `vz-site-` evita
colisões entre o menu institucional e a navegação do sistema.

## Base de SEO compartilhada

A página executável `/validade-zero/` tem título e descrição exclusivos,
canonical absoluto, tags Open Graph, Twitter Card, robots e idioma pt-BR;
inclui `Organization`, `WebSite`, `WebApplication` e `BreadcrumbList`
em JSON-LD. O HTML inicial renderiza um título, explicação da ferramenta e
links internos úteis antes de carregar o JavaScript; o React substitui esse
conteúdo pelo dashboard quando inicializa.

O gerador `scripts/generate-seo-pages.mjs` inclui a rota do aplicativo no
sitemap do Ofertamática, mantendo `/conheca-validade-zero/` como conteúdo
editorial separado. Os testes do grafo SEO, build, site ao vivo, Jest e
Playwright protegem canonical, ícones, navbar, indexação e acessibilidade
responsiva. Isso não altera o banco de dados.

## Testes

- `npm run verify`: arquivos locais e rotas do build.
- `npm run qa:design`: capturas desktop/mobile de `/validade-zero/`
  e `/conheca-validade-zero/`.
- `node scripts/qa-interactions.mjs`: dashboard, scanner/cadastro e links em outra aba.
- Smoke test Locaweb pós-FTP: `scripts/verify-live-validade-zero.mjs`
  e `scripts/verify-live-seo.mjs`.
- Validar fisicamente no celular as permissões de câmera, OCR, login Supabase,
  Push e a passagem de dados por backup. Testes automatizados não substituem
  a aprovação dessas permissões no aparelho do usuário.
