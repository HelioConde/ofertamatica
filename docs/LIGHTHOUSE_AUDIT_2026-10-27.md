# Lighthouse de produção — Ofertamática, 27/10/2026

Fonte: artefato `ofertamatica-lighthouse-production` da [execução #40483702261](https://github.com/HelioConde/ofertamatica/actions/runs/40483702261), após [deploy #40482797433](https://github.com/HelioConde/ofertamatica/actions/runs/40482797433).

| Indicador | Mobile | Desktop |
|---|---:|---:|
| Performance | **88** | **97** |
| Acessibilidade | 100 | 100 |
| Boas práticas | 100 | 100 |
| SEO | 100 | 100 |
| FCP | 2,4 s | 0,9 s |
| LCP | 3,4 s | 1,1 s |
| TBT | 120 ms | 0 ms |
| CLS | 0 | 0 |
| Speed Index | 2,5 s | 1,0 s |

## Diagnóstico técnico

O Lighthouse estima cerca de **212 KiB de JavaScript não usado** no mobile. **A maior parcela (~173 KiB) é de scripts de terceiros do Google AdSense**; cerca de **39 KiB corresponde ao bundle principal do domínio**. Esses números são estimativas de código não executado, **não economia automaticamente recuperável**.

Principais itens do relatório mobile:
- Google `show_ads_impl_fy2021.js`: ~144 KiB de JS não usado.
- Bundle da primeira parte `assets/index-COtI99C-.js`: ~38,5 KiB não usado.
- Google `adsbygoogle.js`: ~29,7 KiB não usado.
- Potencial de redução na métrica `unused-javascript`: até ~900 ms no cenário de laboratório; não constitui ganho garantido.

## Prioridades recomendadas

1. **Não remover, atrasar arbitrariamente ou condicionar a CMP certificada só para elevar a nota**: preservar consentimento, controles do usuário e monetização.
2. Continuar fazendo code splitting do editor, importações de XLSX e componentes de impressão; a Home já usa `React.lazy()`.
3. Trabalhar no LCP mobile (3,4s): investigar concorrência de downloads, prioridade do elemento LCP e cache, sempre com auditorias repetidas.
4. Separar no resumo o código próprio do código de terceiros, para evitar investir em otimizações no lugar errado.
5. Repetir a auditoria após qualquer ajuste de terceiro/UX. Lighthouse é teste de laboratório e não substitui Core Web Vitals de campo.

## Status

O workflow mais recente e o deploy de produção foram aprovados. A falha do dia 25/10 estava no teste de disponibilidade/copy **antes do Lighthouse** e não deve ser confundida com queda de performance.