# Cobertura GSC — 20/11/2026 (URLs históricas e testes de regressão)

Fonte: quatro exports CSV/ZIP de Search Console fornecidos pelo proprietário (cobertura geral e detalhes de **Página com redirecionamento**, **Não encontrado (404)** e **Rastreada, mas não indexada no momento**). O último dia do gráfico geral é **15/11/2026**. Esses números são **fotografia do Google**, não medição de respostas HTTP atuais.

## Resumo do relatório

- 44 URLs indexadas e 88 não indexadas no último ponto do gráfico.
- 19 URLs em “Página com redirecionamento”; 18 em “Não encontrado (404)”; 39 em “Rastreada, mas não indexada no momento”.
- Sem listagem individual nos anexos para 6 soft 404, 5 detectadas sem indexação e 1 canônica alternativa.
- As categorias são distintas: uma URL redirecionada corretamente não precisa ser indexada como endereço antigo; nem um 404/410 legítimo é defeito a esconder.

## Nove URLs do relatório 404 com substitutas equivalentes (301)

| URL anterior | Destino canônico |
| --- | --- |
| `/criar-cartaz-gratis` | `/criador-de-cartaz-de-oferta/` |
| `/cartaz-supermercado-gratis` | `/cartaz-para-supermercado/` |
| `/placa-a3` | `/formatos/` |
| `/para-quem-e` | `/sobre/` |
| `/recursos` | `/como-funciona/` |
| `/placas-de-promocao` | `/gerador-de-cartaz-de-promocao/` |
| `/cartaz-varejo` | `/criador-de-cartaz-de-oferta/` |
| `/placa-a4` | `/cartaz-a4/` |
| `/cartazes-promocionais` | `/gerador-de-cartaz-de-promocao/` |

As outras nove URLs da tabela 404 permanecem com status compatível com o produto: **410** para `/login`, `/registro?plan=gratis`, `/registro?plan=plus` e `/registro?plan=premium`; **404** para `/ia-para-cartazes`, `/ia-para-varejo`, `/ia-para-supermercado`, `/placa-sra3`; **301 já existente** para `/placa-2x1`. IA para cartazes ainda não é recurso publicado, por isso não prometer funcionalidade inexistente nem redirecionar indiscriminadamente para a home.

## Dez aliases históricos adicionais da tabela “Rastreada, mas não indexada” (301)

| URL anterior | Destino canônico |
| --- | --- |
| `/placa-4x1` | `/formatos/` |
| `/cartaz-acougue` | `/cartazes-para-acougue/` |
| `/cartazes-para-atacado` | `/cartaz-atacado-varejo/` |
| `/cartaz-hortifruti` | `/placas-para-hortifruti/` |
| `/criador-de-cartazes-gratis` | `/criador-de-cartaz-de-oferta/` |
| `/cartazes-editaveis-gratis` | `/criador-de-cartaz-de-oferta/` |
| `/placas-prontas` | `/modelos/` |
| `/cartaz-de-preco` | `/cartaz-de-preco-online/` |
| `/cartazes/a4-4x1` | `/formatos/` |
| `/cartaz-a3` | `/formatos/` |

Outras URLs da mesma tabela já têm regras 301, possuem página canônica indexável (como `/placas-para-hortifruti/`, `/cartaz-black-friday/`, `/cartazes-para-farmacia/` e `/cartaz-a4/`) ou o **410 legítimo** de campanha `/cartaz-copa-do-mundo`. O Google pode não indexar páginas válidas por seleção/qualidade, e um 301 **não garante** indexação do destino.

## Tabela “Página com redirecionamento” (19)

São majoritariamente aliases já tratados por 301 no Apache, normalização de barra final ou `/modelos/<slug>` → `/modelos/`. As URLs antigas não devem entrar no sitemap. Não substituir 301 adequados por conteúdo 200 duplicado.

## Implementação

- `public/.htaccess`: 19 novas regras 301 estritas, mantendo as regras de erro reais e sem fallback genérico para home.
- `scripts/generate-seo-pages.mjs`: fallback legível com `noindex`, canônica e encaminhamento para ambientes sem rewrite; em produção **o Apache precisa servir 301** (não 200).
- `scripts/validate-coverage-redirects.mjs`: compara todos os aliases novos com destinos reais, ausência no sitemap e proteção contra redirecionamento falso de IA/SRA3.
- `scripts/verify-live-seo.mjs`: smoke test HTTP após deploy para os principais 301 e um 404 legítimo.

## Conclusão e pós-publicação

1. Exigir `npm run verify` e o job Design Quality sem erro. Deploy só é prova de publicação após o smoke test HTTP passar; não ignorar falha de assets no FTP/CDN.
2. Conferir no domínio HTTP status 301 e `Location` para os aliases, 200+canonical para os destinos e 404/410 reais para páginas descontinuadas.
3. No Search Console, reenviar `https://ofertamatica.com.br/sitemap.xml` e iniciar “Validar correção” apenas para problemas corrigidos de fato; acompanhar URLs finais em 7/28 dias. As contagens históricas não mudam imediatamente.
4. Para os 6 soft 404 e 5 URLs detectadas sem indexação, obter as tabelas detalhadas antes de fazer alterações adicionais; os arquivos anexados não trazem essas URLs.
