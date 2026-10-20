# Revisão de qualidade editorial — Ofertamática

Esta revisão visa agregar valor real para usuários, **sem prometer aprovação** no Google AdSense.

## Implementado
- Guia central de varejo ampliado com exemplos de preço/unidade, planejamento de papel, conferência comercial, impressão e manutenção de campanhas.
- Links contextuais para formatos, modelos, impressão e criador, mantendo o fluxo de entrada direta na ferramenta.
- Auditoria não bloqueante de páginas indexáveis: `npm run audit:content`; sinaliza páginas com poucos textos e possíveis sobreposições lexicais para revisão humana.

## Antes de solicitar nova revisão
1. Executar `npm ci && npm run verify && npm run audit:content`.
2. Conferir as URLs publicadas, responsividade, links e prévia dos cartazes.
3. Revisar manualmente alertas de conteúdo, sem desindexar páginas só por contagem de palavras.
4. Conferir no Search Console cobertura, sitemaps e páginas realmente indexadas.
5. Analisar uso genuíno (primeira geração, impressão, retorno) via GA4, sem estabelecer tráfego artificial.
6. Confirmar AdSense, consentimento e ads.txt em produção; solicitar revisão após deploy e conferência.

## Restrições preservadas
- A rota `/` abre diretamente o seletor.
- O objetivo de primeira placa em dois cliques continua.
- A publicidade não entra na edição.
- Não adicionar conteúdo artificial ou repetitivo para inflar páginas.
