# Black Friday — revisão SEO e UX (20/11/2026)

## Intenção da página
O visitante quer **ver um modelo de cartaz Black Friday, escolher uma arte de campanha, ajustar os preços e imprimir**. O site já possui 16 modelos reais (inclusive seis de fundo branco e quatro Esquenta Black Friday); a ação correta não é criar modelos fictícios nem ampliar texto indiscriminadamente.

Esta rodada foi motivada pela leitura de screenshots do Google Search Console. Os detalhes de tráfego do proprietário não são copiados para o repositório público.

## Alterações verificáveis
- A galeria real aparece imediatamente depois do cabeçalho da página; a prévia genérica não antecede mais o catálogo **somente nessa rota**.
- Link com âncora `#modelos-black-friday` permite ir diretamente aos modelos; mantém alternativa para criar cartaz sem escolher modelo.
- Os seis modelos econômicos (fundo branco) aparecem primeiro; filtros existentes oferecem Todos, Econômicos, Esquenta, Clássicos, De/Por e demais grupos.
- Título e description descrevem recursos comprovadamente disponíveis; a mesma fonte `src/seo/seoPages.js` alimenta React, metadados e HTML estático.
- HTML indexável mantém 16 modelos e antecipa os modelos à orientação longa, com âncora e canonical consistentes.
- Link direto de `/modelos/` para esta rota, sem criar páginas duplicadas.
- Regras CSS limitadas à tela: **nunca modificar dimensões, cores, fontes ou desenhos dos cartazes impressos**.

## Validação
- `npm run verify` e `scripts/validate-curated-models-feedback.mjs`: metadados, canonical, 16 modelos, ordem e HTML estático.
- `scripts/qa-black-friday-landing.mjs`: 360/390/1440px, 16 modelos, CTA, busca por âncora, filtros econômicos e Esquenta, link contextual e ausência de overflow.
- `.github/workflows/design-quality.yml`: WCAG, editor, imagens de referência, testes de impressão A4/A3/SRA3/PDF.
- Não afirmar aprovação antes de analisar o status real da execução.

## Próximos diagnósticos no Search Console
1. Filtrar **Página = /cartaz-black-friday/**, pesquisa Web, e revisar **consultas**, posição média e CTR por dispositivo para distinguir snippet de posição. A data dos resultados GSC costuma ter atraso.
2. Comparar períodos equivalentes e observar a sazonalidade da Black Friday; desempenho pós-evento não é comparável diretamente à preparação da campanha.
3. Para 404, soft 404, páginas com redirecionamento e rastreadas não indexadas, exportar **URLs de exemplo** e verificar status HTTP, destino, canonical, links internos e sitemap **antes** de propor correções.
4. Não redirecionar todas as 404 para a home, não criar páginas artificiais para reduzir contagens e não solicitar indexação de aliases intencionais.

O Google pode reescrever título e descrição; nenhuma alteração garante clique ou indexação. O objetivo é melhorar a utilidade e deixar a implementação mensurável.
