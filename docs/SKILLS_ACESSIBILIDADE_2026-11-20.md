# Seleção de skills de acessibilidade — 20/11/2026

## Escopo da lista recebida

A lista analisada é composta predominantemente por skills e subagentes de **acessibilidade (a11y)**.
Não é um catálogo de SEO, segurança ou performance. A curadoria abaixo prioriza adequação ao
Ofertamática (React/Vite, impressão física, navegação mobile e Validade Zero), complementaridade
e fontes originais; quantidade de instalações e nota de scanners não substituem revisão técnica.

## Skills selecionadas

| Prioridade | Skill da lista | Repositório de origem | Papel específico no projeto | Modo de uso |
| --- | --- | --- | --- | --- |
| 1 — principal | `accessibility` | [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills/blob/main/skills/accessibility/SKILL.md) | Auditoria WCAG 2.2, Lighthouse, árvore acessível, teclado e contraste | Checklist principal; usar em revisões de UX |
| 2 — implementação | `fixing-accessibility` | [ibelick/ui-skills](https://github.com/ibelick/ui-skills/blob/main/skills/fixing-accessibility/SKILL.md) | Corrigir labels, botões, menus, foco, modais e erros de formulário com alterações mínimas | Usar ao mudar JSX/CSS |
| 3 — diagnóstico real | `a11y-debugging` | [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/skills/a11y-debugging/SKILL.md) | Depurar DOM renderizado, foco, árvore de acessibilidade e Lighthouse no Chrome | Opcional, quando Chrome DevTools MCP estiver conectado |
| Reserva | `wcag-audit-patterns` | [wshobson/agents](https://github.com/wshobson/agents/blob/main/plugins/accessibility-compliance/skills/wcag-audit-patterns/SKILL.md) | Segunda opinião de auditoria WCAG 2.2, com verificação manual | Usar apenas em auditoria aprofundada |

**Por que não instalar todas as skills da lista?** Muitas repetem WCAG, ARIA e contraste;
subagentes exclusivos de Claude, Flutter, React Native, Canvas LMS e gaming não acrescentam
valor direto ao front-end React deste site. A entrada muito popular de `affaan-m/ECC`
também se sobrepõe à opção principal, apesar da popularidade indicada no catálogo.

## Integração adotada no repositório

- **Disponível para Codex:** [`.agents/skills/ofertamatica-a11y/SKILL.md`](../.agents/skills/ofertamatica-a11y/SKILL.md).
  É uma **skill local original**, baseada na curadoria e adaptada aos contratos do projeto,
  não cópia integral nem instalação implícita das skills de terceiros.
- **Instruções de agentes:** `AGENTS.md` orienta quando utilizar essa skill.
- **Validação existente:** `npm run verify`, `npm run qa:design`, Playwright no GitHub
  Actions e `scripts/qa-interactions.mjs`. Não adicionar dependências ao bundle do site.

## Instalação opcional das skills originais no ambiente do agente

**Executar só depois de revisar `SKILL.md` e dependências no repositório de origem.**
O comando `npx skills add` roda no ambiente de desenvolvimento, não no navegador do cliente.

```bash
npx skills add https://github.com/addyosmani/web-quality-skills --skill accessibility
npx skills add https://github.com/ibelick/ui-skills --skill fixing-accessibility
# Depende de configuração adicional do Chrome DevTools MCP no agente:
npx skills add https://github.com/ChromeDevTools/chrome-devtools-mcp --skill a11y-debugging
# Somente para revisão aprofundada opcional:
npx skills add https://github.com/wshobson/agents --skill wcag-audit-patterns
```

Esses comandos são **instruções**, não um registro de execução. Não habilitar um MCP
automaticamente, nem compartilhar credenciais com ferramentas externas sem conferir permissões.

## Critérios de aceitação para uma próxima tarefa visual

1. Auditoria do menu e da Home nas larguras 360, 390 e 768px; alvos principais de 44px.
2. Teclado e foco no editor, no seletor de formatos, em modais e na impressão.
3. Rótulos e erros acessíveis nos campos de importação de produtos.
4. Contraste dos controles do aplicativo (sem confundir com a arte impressa).
5. Validade Zero: leitura por câmera, campos e menus operáveis por teclado quando aplicável.
6. `npm run verify`, testes de browser e imagens comparativas antes de integrar à `main`.
7. Reportar achados reais com critérios WCAG 2.2 associados; não declarar conformidade total
   apenas por uma pontuação Lighthouse.
