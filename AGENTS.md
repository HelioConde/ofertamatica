# AGENTS.md — Ofertamática

Leia primeiro `README.md` e `DESIGN.md`. O projeto tem contratos não negociáveis: Home abre diretamente no seletor, primeira placa pronta em dois cliques, fluxo grátis sem cadastro, editor desktop em uma viewport e impressão física fiel. Não editar configurações de FTP, chaves, consentimento ou SEO sem motivo relacionado à tarefa.

## As cinco ferramentas de design

1. **Taste Skill** — https://github.com/Leonxlnx/taste-skill. Aplicar `design-taste-frontend` para refino de layout, tipografia e densidade de interfaces existentes. Não redesenhar por modismo e não trocar a identidade do produto.
2. **Web Design Guidelines** — https://github.com/vercel-labs/web-interface-guidelines. Auditar navegação via teclado, foco, rótulos, estados de erro, tamanhos de toque, performance e responsividade. Para revisão via agente, usar a skill de Vercel `web-design-guidelines`.
3. **Awesome Design** — https://github.com/VoltAgent/awesome-design-md. Consultar DESIGN.md de referência **como repertório**. O arquivo `DESIGN.md` local é a autoridade visual do produto; não copiar estilos de terceiros.
4. **Image to Code** — skill `image-to-code` em https://github.com/Leonxlnx/taste-skill. Quando houver screenshot de referência, analisar a imagem, identificar componentes/tokens/estados e traduzir para React/CSS existente. Conferir uma nova captura e comparar. Não substituir componentes de cartaz por imagem estática.
5. **Playwright CLI** — https://github.com/microsoft/playwright-cli. Inspecionar a experiência real e tirar screenshots; complementar os testes E2E de `scripts/qa-interactions.mjs`, `scripts/qa-release-print-import.mjs` e `scripts/qa-design-guidelines.mjs`.

### Instalação opcional no computador/agente de desenvolvimento

Estas skills são ferramentas de **desenvolvimento**, não dependências carregadas pelo site em produção. No diretório do projeto (Node.js 20+):

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend
npx skills add https://github.com/Leonxlnx/taste-skill --skill image-to-code
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines
# Awesome Design: consultar catálogo e adaptar, não clonar uma identidade inteira.
# https://github.com/VoltAgent/awesome-design-md
npm install -g @playwright/cli@latest
playwright-cli install --skills
```

Não executar scripts externos sem revisar seu conteúdo. Essas instalações exigem acesso à internet e não são necessárias no build de produção. O Playwright de testes é instalado no workflow do GitHub Actions.

## Fluxo para qualquer mudança visual

1. **Observar:** capturas já existentes em `screenshots/site`, `screenshots/mobile-editor` e `screenshots/desktop-editor`. Anotar problemas reproduzíveis, inclusive impressão.
2. **Planejar:** aplicar Taste Skill sem quebrar `DESIGN.md`; usar Awesome Design apenas para encontrar decisões transferíveis (espaçamento, contraste, hierarquia).
3. **Implementar:** Image to Code quando existir mockup/screenshot; reutilizar `src/components`, `src/styles` e tokens CSS.
4. **Auditar:** Web Design Guidelines e `npm run qa:design`; testar foco e nomes acessíveis.
5. **Verificar no navegador:** Playwright CLI em 360/390/768/1440px e comparação de screenshots. Confirmar fluxos de formato, gerar, modelos, personalização, consentimento, PDF e impressão.

## Comandos

```bash
npm install
npm run verify
# Em um terminal: npm run preview -- --host 127.0.0.1 --port 5183
# Em outro (com Playwright instalado): npm run qa:design
# Exemplo de inspeção manual:
playwright-cli open http://127.0.0.1:5183/
playwright-cli snapshot
playwright-cli screenshot
```

O relatório `artifacts/design-audit/report.json`, o snapshot semântico `cli-modelos-mobile.yaml` e a captura `cli-modelos-mobile.png` são produzidos no GitHub Actions. A CLI é executada de verdade no job Design Quality (apenas para desenvolvimento), sem ser incluída no site publicado. Problemas novos devem ser corrigidos; achados existentes são registrados como diagnóstico, não disfarçados por pontuações inventadas.

Se o objetivo for mudar a interface a partir de uma imagem, documentar as diferenças entre a referência e a implementação antes de aprovar o resultado. Nunca supor que o screenshot visual representa as regras reais de impressão.

## Histórico verificável de aplicação

- Taste Skill v2: regras de auditoria antes de redesenho, preservação da identidade do produto e redução de adornos que não ajudam a tarefa (ex.: seta que cobria filtros no celular). É uma revisão guiada pelas instruções públicas da skill, não uma execução automatizada do pacote.
- Web Design Guidelines: auditoria real por teclado, nomes acessíveis, contornos, overflow, alvos de toque e estados responsivos via `scripts/qa-design-guidelines.mjs`.
- Awesome Design: `DESIGN.md` documenta paleta, tipografia, componentes, densidade, interação e restrições físicas.
- Image to Code: screenshot real do modelo mobile foi inspecionado antes da correção da faixa de categorias; implementação direta em CSS/React existente (sem gerar mockup novo).
- Playwright CLI: execução real no GitHub Actions, com captura e snapshot nomeados. A API Playwright também continua cobrindo os fluxos funcionais.

Não considerar uma ferramenta externa "executada" quando apenas suas orientações forem aplicadas. A instalação local de skills é opcional e exige um agente que leia seus arquivos.

## Skills locais para design e UX (2026-11)

As skills em `.agents/skills/` são orientações de agentes de desenvolvimento, não código enviado ao navegador. Para qualquer tarefa de UX/UI, ler `PRODUCT.md`, `DESIGN.md` e a skill local adequada:

- `ofertamatica-design-review`: auditar e refinar uma tela ou fluxo com evidências; usar Impeccable oficial quando instalado.
- `ofertamatica-design-system`: mapear tokens, componentes e estados sem substituir a identidade existente.
- `ofertamatica-prototype`: explorar wireframes/protótipos isolados antes de alterar a aplicação.
- `ofertamatica-impeccable`: aplicar o detector oficial Impeccable no código e revisar achados sem alterar a identidade.
- `ofertamatica-ui-verification`: verificar o fluxo real no navegador, capturas e impressão com os testes Playwright existentes.
- `ui-review` (design.how): revisão visual baseada em evidência; requer renderização, não apenas leitura de JSX.
- `accessibility` (web-quality-skills): checklist WCAG 2.2 e padrões de navegação por teclado.
- `html-wireframe` (effective-html): protótipos estruturais isolados e acionados somente sob demanda.

O catálogo do documento recebido, a seleção justificada, as fontes, os comandos de instalação **opcionais** e os limites de aplicação estão em `docs/DESIGN_SKILLS.md`. A ferramenta oficial Impeccable não está vendorizada aqui: sua instalação deve ser feita no checkout local, após revisão do instalador, com `npx impeccable install`. O detector CLI oficial roda em PRs de interface e pode ser acionado manualmente no GitHub Actions por `Impeccable Design Scan`; não é a instalação da skill completa.

Prioridade de autoridade: pedido do usuário > contratos do produto (`README.md` e `PRODUCT.md`) > `DESIGN.md` > skills locais > sugestões de ferramentas externas. Não instalar bibliotecas de UI, modificar fontes dos cartazes, alterar dimensões de impressão, ativar live mode com permissões irrestritas ou executar scripts remotos automaticamente. Skills não são prova de melhoria: toda alteração de interface exige verificação real e `npm run verify`.

## Política atual das skills de UI/UX (2026-11-20)

> Esta seção prevalece sobre as sugestões históricas de Taste Skill acima: **não instalar ou executar Taste Skill por padrão**. O objetivo é evoluir a interface atual, não redesenhar a marca.

**Skills de referência, nesta ordem:** (1) Anthropic `frontend-design` para princípios visuais; (2) Impeccable para hierarquia, tipografia, cores e ergonomia; (3) UI Skill de `lcanady/ui-skill` para inventário de tokens; (4) `agent-skills/ui-design` para build/audit/stress-test; (5) `emilkowalski/skills` / prototype para alternativas isoladas; (6) `addyosmani/web-quality-skills` para WCAG 2.2; (7) `AlekseiSDev/ui-verify` como padrão de testes com Playwright.

**Modo de adoção neste PR: documentação e skills locais originais apenas.** Os projetos externos são referências e NÃO foram instalados ou copiados para `.agents/skills/`. Não executar `npx skills add`, `npx impeccable install` ou scripts de terceiros como consequência automática destas instruções. Qualquer execução exige revisão prévia do código, origem e permissões em outra etapa. O scan Impeccable permanece **manual** via `workflow_dispatch`, e só deve ser disparado após aprovação explícita.

**Workflow dos agentes:** observar as telas e problemas reais → consultar tokens existentes em `DESIGN.md` → registrar hipóteses e variantes fora da produção → selecionar uma única solução → implementar em PR separado → testar teclado/contraste/responsividade/fluxos em Playwright → validar PDF/medidas de impressão → revisar screenshots antes de mesclar.

**Checklist de QA:** fluxo de dois cliques, editor desktop em uma viewport, uso grátis sem cadastro, navegação por teclado e foco visível, contraste WCAG, sem overflow horizontal, 360/390/768/1440px, prévia/PDF/impressão coerentes, sem novas dependências pesadas e sem mudança silenciosa de fontes ou identidade.

Fonte e limites de cada skill: `docs/DESIGN_SKILLS.md`. Priorizar esta política em relação aos comandos históricos de instalação nesta documentação.
