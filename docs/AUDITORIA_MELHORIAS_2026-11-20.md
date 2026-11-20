# Auditoria aplicada — 20/11/2026

## Base verificada no código

Este registro compara as hipóteses do relatório recebido com o repositório atual. Não se deve tratar uma inspeção textual do site como prova da ausência de recursos.

| Área | Situação encontrada em `main` antes desta branch | Encaminhamento |
| --- | --- | --- |
| Indexação | `public/robots.txt`, sitemap gerado no build, canonicals, metadescription, viewport, Open Graph básico e schemas WebSite/WebApplication | Preservar e testar; não duplicar |
| SEO editorial | Landing pages e guias com conteúdo, sitemap e verificador de links internos | Preservar e acompanhar dados reais no Search Console |
| Analytics | GA4 condicionado a consentimento; eventos e telemetria própria sem dados dos produtos | Não duplicar medição nem contornar consentimento |
| Performance | Home com editor carregado sob demanda; cache, gzip/deflate e Lighthouse de produção | Manter métricas reais, evitar prometer score sem medição |
| Segurança | HTTPS no domínio; HSTS, nosniff, frame protection e policy de permissões no `.htaccess` | Não ativar CSP bloqueante sem inventariar Google Ads e scripts inline |
| Mobile | Navegação responsiva existente, mas compactava sete links e reduzia o tamanho da fonte | Menu expansível com alvos de 44px e nomes acessíveis |
| Compartilhamento | Twitter e Open Graph tinham título e descrição, mas não imagem definida | Usar logotipo PNG público em OG/Twitter no HTML estático e nas rotas React |

## Alterações nesta branch

1. Centralização da navegação de `App.jsx` e `CreatorApp.jsx` em `SiteNavigation.jsx`, com menu mobile acessível, fechamento por Escape e indicação da página atual.
2. Imagem PNG do próprio projeto como `og:image` e `twitter:image`, com tamanho e texto alternativo do Open Graph. Aplica-se à Home e a todas as páginas estáticas geradas, além de atualizar o head durante a navegação React.
3. Testes de build que detectam imagem social ausente, metatags duplicadas e URL incorreta; auditoria de interface testa o menu mobile.
4. Nenhuma alteração no motor de cartazes, dimensões de impressão, CMP, API de métricas ou publicação de anúncios.

## Verificação e próximos passos

- Executar `npm run verify` e `npm run qa:design` no workflow de qualidade, conferir screenshots mobile (360px e 390px) e desktop.
- Após o deploy, consultar HTML bruto em `/` e `/modelos/`, verificar o carregamento da imagem pública `/icons/icon-512.png` e testar compartilhamento em redes sociais.
- Acompanhar no Search Console 7 e 28 dias para verificar CTR, indexação e consultas sem atribuir ganhos automaticamente ao código.
- Antes de implantar uma CSP bloqueante, mapear domínios de AdSense, CMP, Google tag e o bootstrap inline de consentimento. Começar por relatório, não por bloqueio.
- Para uma nova etapa de performance, coletar LCP, INP e CLS em campo e no Lighthouse; otimizar especificamente os arquivos identificados como gargalo, em vez de converter todas as imagens indiscriminadamente.
- Para criar uma miniatura social horizontal de 1200×630 posteriormente, versionar um PNG específico e atualizar a URL social depois de testar a entrega pública.
