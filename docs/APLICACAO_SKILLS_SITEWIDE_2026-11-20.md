# Aplicação transversal de skills UI/UX e acessibilidade — 20/11/2026

## Objetivo e limite do escopo

Aplicar aos fluxos reais do Ofertamática as recomendações de `AGENTS.md`, `DESIGN.md` e
`.agents/skills/ofertamatica-a11y/SKILL.md`, sem transformar a Home em landing page e sem
modificar medidas, layout de impressão, fontes dos cartazes, consentimento, backend ou FTP.

**Áreas cobertas:** Home, seletor de formatos, editor rápido, Editor Livre, galeria de modelos,
campanhas sazonais, guias e páginas públicas indexáveis, menu compartilhado, Validade Zero e
fluxos de impressão/importação que já possuem QA.

## Aplicação concreta da curadoria

| Referência | Aplicação nesta entrega | Evidência no repositório |
| --- | --- | --- |
| `accessibility` (WCAG 2.2) | Auditoria axe A/AA nas páginas indexáveis + Home + Validade Zero, com evidências por rota e viewport | `scripts/qa-a11y-sitewide.mjs` e artefato `sitewide-accessibility.json` |
| `fixing-accessibility` | Anunciar seleção de caixas (`aria-pressed`), associar erro e ajuda ao preço anterior (`aria-invalid`/`aria-describedby`) | `src/components/FreePosterEditor.jsx`, `scripts/qa-interactions.mjs` |
| `a11y-debugging` / Playwright | Comportamento de Escape e recuperação de foco no menu, auditoria responsiva estendida com erros JS/nomes acessíveis | `src/components/SiteNavigation.jsx` e `scripts/qa-design-guidelines.mjs` |
| Taste / Impeccable — princípios de hierarquia, densidade e legibilidade | Campos mobile de 16px, botões/alvos principais de 44px e instruções de teclado visíveis, mantendo design system atual | `src/styles/free-editor.css`, `src/components/FreePosterEditor.jsx` |
| Web Design Guidelines / UI Verification | Cobertura automatizada de todas as rotas públicas, sem substituir testes de formatos, PDF, anúncios ou consentimento | `.github/workflows/design-quality.yml` |

Essa tabela distingue **orientações efetivamente incorporadas ao código e QA** de ferramentas
externas instaladas. A execução oficial do Chrome DevTools MCP ou do detector Impeccable não
é declarada aqui: qualquer execução dessas ferramentas terá workflow/log próprio.

## Cobertura de QA

- `scripts/qa-design-guidelines.mjs`: quatro viewports para sete rotas principais;
  desktop e mobile para **todas as demais páginas** exportadas por `INDEXABLE_PAGES`.
  Detecta título `h1` ausente/duplicado, fallback não hidratado, overflow horizontal,
  navegação cortada, controles sem nome, exceções JavaScript, menu e teclado.
- `scripts/qa-a11y-sitewide.mjs`: axe WCAG 2.0/2.1/2.2 A/AA em toda a lista
  `INDEXABLE_PAGES` + Home + Validade Zero (390px), e cenários prioritários
  em 1440px. Salva regras, alvos e problemas que precisam de verificação manual.
- `scripts/qa-interactions.mjs`: verifica preço anterior válido/inválido anunciado
  corretamente e a escolha das caixas por leitor de tela.
- `scripts/qa-release-print-import.mjs`: regressões de A4, A3, SRA3,
  PDF/importação. **Nenhuma regra física foi alterada.**

O `Design Quality` instala `@axe-core/playwright` **apenas no runner**; não integra
a dependência ao bundle de produção. O script axe bloqueia falhas de carregamento
e violações de impacto `critical`, enquanto registra `serious` como dívida a triar.
Pontuação automatizada não equivale a certificação WCAG.

## Critérios de validação

1. `npm run verify` e testes do Validade Zero aprovados.
2. Auditoria de todas as rotas e auditoria axe produzindo JSON por rota.
3. Interações (teclado, foco, campos, menu, consentimento), QA de impressão e
   capturas mobile/desktop aprovados.
4. Comparar visualmente artefatos antes de integrar à `main`.
5. Registrar achados graves/cortes e corrigir as causas, sem ignorar a impressão.

**Status:** esta documentação descreve o escopo implementado na branch. A aprovação final
de CI e a publicação devem ser conferidas na PR; não são presumidas.
