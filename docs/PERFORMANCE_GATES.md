# QA da produção — Ofertamática

## Falha identificada em 25/10/2026
O workflow `Ofertamatica Production Lighthouse` parou em `Check Chrome and production`: a chamada HTTP retornou conteúdo, mas um `grep` por um texto **exato de H1** encerrou o processo antes de gerar relatórios Lighthouse.

Esse texto é conteúdo editorial, não uma condição confiável para identificar site funcionando. Um ajuste de redação, renderização do conteúdo via JavaScript ou implantação em andamento pode gerar falso negativo.

## Verificação corrigida em 27/10/2026
A etapa:
1. Confirma Chrome instalado.
2. Faz GET HTTP HTTPS com tentativas extras para falhas de rede.
3. Confirma HTML válido e identidade Ofertamática (normalizando acentos).
4. Executa auditorias Lighthouse mobile e desktop, mantendo JSON e resumo.
5. Continua acusando falhas HTTP ou respostas de outro site. Não silencia erro de rede, nem declara notas sem relatório.

## Validação
Após integrar o PR, execute `Ofertamatica Production Lighthouse` em **Actions → Run workflow**. Confira categorias de desempenho, acessibilidade, boas práticas e SEO e os artefatos `ofertamatica-lighthouse-production`. Este teste refere-se ao **domínio de produção**, não ao GitHub Pages.

## Acompanhar regressões
Rever alterações de copy no H1 por Playwright/Lighthouse, e não por comparação de string exata em HTML bruto. Para suspeita de indisponibilidade, verificar status HTTP, erros de carregamento e conteúdo renderizado em diferentes resoluções.
