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

O relatório `artifacts/design-audit/report.json` é produzido no GitHub Actions pela auditoria e publicado como artefato. Problemas novos devem ser corrigidos; achados existentes são registrados como diagnóstico, não disfarçados por pontuações inventadas.

Se o objetivo for mudar a interface a partir de uma imagem, documentar as diferenças entre a referência e a implementação antes de aprovar o resultado. Nunca supor que o screenshot visual representa as regras reais de impressão.
