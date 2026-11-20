# Curadoria de UI/UX para o Ofertamática — adoção documental

Última revisão: 2026-11-20. Escopo: React/Vite, criação e impressão de cartazes promocionais. Fonte de descoberta: https://plado.pages.dev/for/design/ui-design/ .

**Decisão:** integrar apenas princípios, checklists e procedimentos documentados. **Não instalar, copiar ou executar automaticamente skills externas neste PR.** As skills locais `ofertamatica-*` são instruções originais do projeto para agentes, não pacotes de terceiros. O fluxo de produção e `package.json` ficam intactos.

## Skills priorizadas

| Prioridade | Skill | Referência | Aplicação segura agora | Uso futuro (somente após revisão) |
| --- | --- | --- | --- | --- |
| 1 | Anthropic `frontend-design` | https://github.com/anthropics/skills/tree/main/skills/frontend-design | Baseline visual, intenção, composição e evitar UI genérica; manter identidade atual | Avaliar instalação no agente, sem redesign automático |
| 2 | Impeccable (Paul Bakaus) | https://github.com/pbakaus/impeccable | Hierarquia, tipografia, espaçamento, estados, contraste e auditoria | Instalar no checkout de desenvolvimento, após revisar permissões; scan somente manual |
| 3 | UI Skill | https://github.com/lcanady/ui-skill | Inventário dos tokens e componentes descritos em `DESIGN.md`; sem gerar tema novo | Avaliar `npx skills add lcanady/ui-skill` em branch separada |
| 4 | UI Design | https://github.com/mblode/agent-skills/tree/main/skills/ui-design | Build → audit → stress-test para React/Vite, sem assumir Next/Tailwind | Conferir compatibilidade antes de rodar |
| 5 | Prototype (Emil Kowalski) | https://github.com/emilkowalski/skills | Prototipar 2–3 variantes isoladas de fluxo/componente e aprovar antes de integrar | Somente execução por solicitação, fora da produção |
| 6 | Web Quality (Addy Osmani) | https://github.com/addyosmani/web-quality-skills | Checklist WCAG 2.2 AA, contraste, teclado, leitura por tecnologia assistiva e Lighthouse | Avaliar execução de auditorias em CI testado |
| 7 | UI Verify (AlekseiSDev) | https://github.com/AlekseiSDev/ui-verify | Modelo de teste Playwright: navegar, capturar, interagir, confirmar resultado | Avaliar pacote após estabilizar fluxos existentes |

Links acima são referências de pesquisa. Nome do pacote, licença, versão e comandos devem ser confirmados no repositório original antes de instalar. A inspiração em uma skill **não comprova execução ou aprovação** da auditoria.

## Mapeamento para o projeto

- `DESIGN.md`: fonte de verdade para paleta azul, tipografia Inter/system-ui, tokens CSS, responsividade, acessibilidade e preservação das fontes de cartazes.
- `PRODUCT.md`: personas, tarefas reais, objetivo da primeira placa em dois cliques e restrições de impressão.
- `AGENTS.md`: precedência das regras, escolha de skills, workflow de prototipação e testes.
- `.agents/skills/ofertamatica-design-review/SKILL.md`: checklist e evidências de revisão, inspirado em frontend-design + Impeccable.
- `.agents/skills/ofertamatica-design-system/SKILL.md`: uso e inventário de tokens, inspirado em UI Skill.
- `.agents/skills/ofertamatica-prototype/SKILL.md`: fluxo para alternativas isoladas e seleção.
- `.agents/skills/ofertamatica-impeccable/SKILL.md`: preparação para auditoria manual, não invocação automática.
- `.agents/skills/ofertamatica-ui-verification/SKILL.md`: verificação de interações com Playwright existente.
- `scripts/qa-design-guidelines.mjs`, `scripts/qa-interactions.mjs` e `scripts/qa-release-print-import.mjs`: infraestrutura de testes já presente; nenhum instalador adicional é requisito deste PR.

## Sequência recomendada

1. **Diagnosticar:** identificar problema reproduzível por screenshots/snapshot do fluxo. Não refazer a Home com base em gosto.
2. **Inventariar:** confirmar tokens atuais em CSS e `DESIGN.md`; proteger dimensões e fontes do cartaz.
3. **Prototipar:** quando houver mais de uma solução plausível, construir alternativas isoladas, escolher uma e só então propor alteração.
4. **Implementar em PR separado:** componentes existentes e CSS incremental; sem pacotes de UI novos.
5. **Auditar:** Playwright, teclado, foco, texto acessível, contraste, responsividade, Lighthouse e zoom; comparar com baseline.
6. **Verificar impressão:** A4/A3/SRA3 conforme recurso existente, prévia/PDF, quebra de texto, preço e margens. Validar consentimento e uso sem cadastro.
7. **Registrar:** links de screenshots, resultados de CI e defeitos conhecidos, distinguindo alertas anteriores de regressões.

## Skills a evitar ou usar com cautela

- **Taste Skill (Leonxlnx):** não executar por padrão; pode favorecer mudanças estéticas que conflitam com a identidade. Menções anteriores em `AGENTS.md` são históricas e subordinadas à política atual.
- **Shadcn/Next/Tailwind:** não introduzir stack novo em um site React/Vite com CSS e componentes existentes.
- **GSAP:** não adicionar animação complexa num editor com saída estática para impressão.
- **UI Mockups completos:** privilegiar wireframe leve e testes reais; mockups detalhados não são exigência.
- **Demais coleções do Plado:** não adicionar automaticamente por popularidade, e sim após evidência de necessidade e compatibilidade.

## Instalação e CI (etapa futura)

Nenhum `npx skills add`, `npx impeccable install`, download de skill de terceiros ou alteração em `package.json` é executado por esta integração. O workflow Impeccable está limitado a `workflow_dispatch` com confirmação explícita; o scanner externo só roda se um responsável pedir posteriormente.

**Aceite de qualquer implementação visual futura:** `npm run verify`, `npm run qa:design`, Playwright dos fluxos tocados e comparação de screenshots. Uma Action em verde não equivale à aprovação do produto e não dispensa QA de impressão.
