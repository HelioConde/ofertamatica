# Ofertamática — skills UX/UI: formulário mobile e carregamento não crítico

## Evidência anterior

A auditoria real **Production Lighthouse #44711428488** da Home em 20/11/2026 registrou:

| Métrica | Mobile | Desktop |
| --- | ---: | ---: |
| Performance Lighthouse | 74/100 | 97/100 |
| Acessibilidade / Boas práticas / SEO | 100/100 cada | 100/100 cada |
| LCP | 4,4 s | 1,1 s |
| FCP | 3,3 s | 1,0 s |
| TBT | 220 ms | 0 ms |

A requisição de estilos da Home foi identificada como bloqueadora de renderização (~510 ms no teste mobile). O HTML inicial também carrega a tag oficial do AdSense; a auditoria atribuiu cerca de 270 ms de bloqueio de thread principal a scripts de anúncios de terceiros. O elemento LCP foi o texto do aviso de privacidade. Esses fatores são **diagnóstico**, não justificativa para mudar consentimento, AdSense ou a ordem de publicação sem aprovação e validação específicas.

## Aplicação das skills

Princípios de `ofertamatica-design-review`, `ofertamatica-ui-verification` e Web Design Guidelines:

1. **Performance sem sacrificar funcionalidades:** `DeferredFeedbackNudge` move a importação do convite opcional de feedback e do seu CSS para perto dos 16 segundos em que ele é exibido; a janela e o prazo de dispensa de 14 dias permanecem iguais.
2. **Foco perceptível e previsível:** ao escolher `Dar minha opinião`, o foco segue para o campo de mensagem, pois o botão de abertura deixa de existir.
3. **Operação no iPhone:** textarea do feedback, input e select do planejador de folhas usam pelo menos 16px no celular, com alvos de 44px nas ações de feedback.
4. **Regressões automatizadas:** Playwright valida foco e dimensões, inclusive após avançar o relógio para o prazo real do convite, além de confirmar consentimento e impressão.

## Limites

- A funcionalidade de consentimento, as tags do AdSense, anúncios, SEO, medidas de A4/A3/SRA3, PDF e fontes da arte **não foram alteradas**.
- A melhoria de bundle não significa garantia de subir a nota Lighthouse: a nota oscila entre execuções com rede e anúncios reais. Comparar relatórios novos com dados brutos, sem inventar ganho.
- Os alertas de overflow de miniaturas de cartazes exigem inspeção visual e comparação com área de conteúdo antes de alterar fontes ou posições impressas.

## Validação exigida

`npm run verify`, `Design Quality` completo (WCAG, QA responsiva, feedback, mobile editor, PDF físico), `Poster Visual Snapshot` e `Deploy` com validação HTTP. Essa documentação não equivale à aprovação automática dessas etapas.
