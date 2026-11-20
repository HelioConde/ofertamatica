---
name: ofertamatica-a11y
description: Auditar e corrigir acessibilidade WCAG 2.2 em telas React do Ofertamática, incluindo editor de cartazes, modelos, menus, formulários e Validade Zero, sem comprometer a impressão. Use ao alterar componentes visuais, foco, teclado, contraste ou experiência mobile.
---

# Ofertamática — acessibilidade orientada por evidências

Esta é uma skill **local e original do projeto**, baseada na seleção das referências públicas
[accessibility](https://github.com/addyosmani/web-quality-skills/blob/main/skills/accessibility/SKILL.md),
[fixing-accessibility](https://github.com/ibelick/ui-skills/blob/main/skills/fixing-accessibility/SKILL.md)
e [a11y-debugging](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/skills/a11y-debugging/SKILL.md).
Não pressupõe que essas três skills externas ou o Chrome DevTools MCP estejam instalados.

## Antes de modificar código

1. Ler `AGENTS.md`, `DESIGN.md` e `docs/SKILLS_ACESSIBILIDADE_2026-11-20.md`.
2. Definir rota, tela, componente, viewport e interação que motivaram a revisão.
3. Investigar o componente real e, se disponível, screenshot, árvore de acessibilidade, falha Lighthouse ou relatório `artifacts/design-audit/report.json`.
4. Distinguir problemas demonstrados de hipóteses. Não inventar notas de Lighthouse ou declarar certificação WCAG com base em um teste automático.

## Ordem de inspeção

1. **Nome acessível e semântica:** botões, links, imagens funcionais, rótulos e títulos. Preferir HTML nativo a ARIA redundante.
2. **Teclado:** Tab, Shift+Tab, Enter, Espaço, Escape, tab-order, menus, modais, diálogos, tabs e editor livre. Garantir alternativa a ações realizadas somente por arrastar, quando aplicável.
3. **Foco:** foco visível, retorno ao gatilho após fechar diálogo, foco não escondido por cabeçalhos, ausência de armadilha de teclado.
4. **Formulários:** rótulos, erros vinculados via `aria-describedby`, `aria-invalid`, status de carregamento, instruções e feedback compreensíveis.
5. **Contraste e mídia:** 4.5:1 para texto normal e 3:1 para texto grande/indicadores visuais relevantes; `alt` descritivo ou vazio para decoração; `prefers-reduced-motion`.
6. **Alvos de toque e responsividade:** WCAG 2.2 AA prevê geralmente 24×24 CSS px com exceções; manter 44×44 px nos alvos principais conforme `DESIGN.md`. Conferir 360, 390, 412, 768 e 1440 px sem cortes ou overflow.

## Execução no Ofertamática

- Componentes principais: `src/App.jsx`, `src/CreatorApp.jsx`, `src/components/` e `src/styles/`.
- Aplicativo associado: `apps/validade-zero/src/`; não bloquear câmera, scanner nem login.
- Testes existentes: `scripts/qa-design-guidelines.mjs`, `scripts/qa-interactions.mjs`, `scripts/qa-release-print-import.mjs` e workflow `.github/workflows/design-quality.yml`.
- Se Chrome DevTools MCP estiver disponível, usar `lighthouse_audit`, `take_snapshot`, `press_key` e capturas para localizar a falha **no conteúdo renderizado**. Se não estiver, usar Playwright/Lighthouse já previstos no projeto.
- Corrigir o menor trecho possível. Não migrar framework, não trocar paleta, não adicionar dependências de produção para corrigir uma etiqueta e não alterar tamanhos, proporção, fontes de preço ou layout de impressão sem testes físicos.
- Respeitar o fluxo de primeira placa em dois cliques, Home diretamente no seletor, gratuidade, ausência de cadastro, privacidade e consentimento.

## Validação

```bash
npm run verify
npm run preview -- --host 127.0.0.1 --port 5183
# Com Playwright disponível, em outro terminal:
CAPTURE_BASE_URL=http://127.0.0.1:5183 npm run qa:design
node scripts/qa-interactions.mjs
node scripts/qa-release-print-import.mjs
```

Os dois últimos scripts precisam do navegador e do servidor em execução. Se essa infraestrutura não estiver disponível, **não afirmar que foram executados**: reportar somente as verificações realmente realizadas e deixar a validação faltante para GitHub Actions.

A entrega deve identificar: rota e viewport, problema comprovado, critério WCAG relacionado quando pertinente, arquivo/trecho alterado, resultado antes/depois, evidência visual ou teste e riscos remanescentes.

## Referências opcionais

- Auditoria abrangente: `accessibility` — addyosmani/web-quality-skills.
- Correção pontual: `fixing-accessibility` — ibelick/ui-skills.
- Depuração em Chrome: `a11y-debugging` — ChromeDevTools/chrome-devtools-mcp (depende de MCP).
- Segunda revisão independente, somente em auditorias profundas: `wcag-audit-patterns` — wshobson/agents.

Leia e avalie o código das skills externas antes de instalar ou executá-las. Esta skill local **não instala dependências automaticamente**.
