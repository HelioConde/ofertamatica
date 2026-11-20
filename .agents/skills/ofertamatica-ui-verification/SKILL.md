---
name: ofertamatica-ui-verification
description: Verificar alterações de UI do Ofertamática no navegador real com Playwright, snapshots, screenshots, testes de teclado e proteção do fluxo de impressão.
---

# UI Verify — Ofertamática

Ler `PRODUCT.md`, `DESIGN.md` e `AGENTS.md`. Baseado no padrão de navegação → snapshot → interação → asserção do projeto UI Verify, mas adaptado aos testes que **já existem** aqui.

## Quando usar

Após alterar navegação, componentes compartilhados, formulários, seletor de formatos, editor, prévia, modelos, importação, exportação ou qualquer fluxo visível. Para mudanças só de lógica, usar os testes de lógica adequados.

## Procedimento reproduzível

1. Preparar ambiente: `npm install`, `npm run verify` e instalar Playwright Chromium conforme `.github/workflows/design-quality.yml`.
2. Iniciar `npm run preview -- --host 127.0.0.1 --port 5183`. Usar apenas a instância local, nunca dados de clientes.
3. Executar `npm run qa:design` com `CAPTURE_BASE_URL=http://127.0.0.1:5183`. O script `scripts/qa-design-guidelines.mjs` percorre rotas, testa teclado e gera capturas/relatório.
4. Executar `node scripts/qa-interactions.mjs` e `node scripts/qa-release-print-import.mjs` quando a alteração afetar os fluxos cobertos. Usar a mesma variável `CAPTURE_BASE_URL`.
5. Conferir screenshots de `artifacts/design-audit/`, acessibilidade, estados loading/erro, foco e console. Testar 360, 390, 412, 768, 1000 e 1440px quando relevantes; os scripts atuais cobrem somente parte dessas larguras.
6. Confirmar os bloqueadores: Home abre no seletor; escolha A4 abre editor; cartaz pode ser gerado sem cadastro; não há overflow; consentimento não bloqueia a tarefa; PDF mantém medidas e fontes Burbank/Futura; importação e impressão não regrediram.
7. Reportar os comandos executados, resultados e capturas. Uma árvore de acessibilidade correta não prova que o desenho impresso ficou correto. Se não houver navegador/ambiente, marcar **não verificado**.

## Resultado esperado

Relatório curto: rota, viewport, ação, resultado esperado, resultado observado, screenshot, status e falhas. Corrigir antes de mesclar se qualquer bloqueador falhar.

Referência metodológica: https://github.com/AlekseiSDev/agent-engineering-manifesto/tree/main/.claude/skills/ui-verify (não foi copiada a skill de terceiros).
