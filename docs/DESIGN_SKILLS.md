# Skills de design/UX — seleção para o Ofertamática

Registro da solicitação de aplicar **Impeccable** e as skills do documento fornecido. O documento é um catálogo heterogêneo de skills, agentes, plugins e prompts; não significa que todas sejam compatíveis com React/Vite ou necessárias ao produto.

## O que foi integrado ao repositório

- `.agents/skills/ofertamatica-design-review/SKILL.md`: fluxo local de revisão, acessibilidade e qualidade, preparado para Impeccable.
- `.agents/skills/ofertamatica-design-system/SKILL.md`: tokens, componentes e estados sem quebrar `DESIGN.md`.
- `.agents/skills/ofertamatica-prototype/SKILL.md`: wireframes e protótipos isolados.
- `PRODUCT.md`: contexto persistente do produto para agentes.
- `.github/workflows/impeccable-design-scan.yml`: detector oficial por acionamento manual, sem bloqueio automático de deploy.
- `AGENTS.md`: roteamento para as skills locais e preservação dos contratos.

**Estado real:** as três skills locais ficam versionadas e disponíveis para agentes que reconhecem `.agents/skills`. Os pacotes externos Impeccable, UI UX Pro Max, design.how, Figma e outros **não foram baixados ou executados** neste commit. A instalação oficial do Impeccable requer um ambiente local/CI, não é uma dependência do site.

## Impeccable — principal

Fonte: https://github.com/pbakaus/impeccable — licença Apache-2.0.

Em um checkout confiável do projeto, após revisar a ferramenta e suas permissões:

```bash
npx impeccable install
# Reiniciar o agente de código para ele descobrir a skill instalada.
# Exemplos, conforme a interface do agente:
# /impeccable critique src/components/FormatOptionCard.jsx
# /impeccable audit src/
# /impeccable polish src/CreatorApp.jsx
npx impeccable detect src/
```

O modo live pode lançar um agente externo com aprovações e sandbox desativados em determinados cenários. **Não ativá-lo automaticamente**. Preferir inspeção local, diffs revisáveis e a auditoria CLI. O detector no GitHub Actions é **manual**, pode apontar problemas preexistentes e não prova correção automática.

## Skills do documento: seleção por utilidade

| Prioridade | Skill / fonte | Uso no Ofertamática | Situação |
| --- | --- | --- | --- |
| Alta | `design-system` — [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Inventário de tokens e componentes | Incorporada como diretriz local, pacote externo não instalado |
| Alta | `design-system-boss`, `build-design-system`, `token-mapping`, `ui-review` — [arla6ka/design.how](https://github.com/arla6ka/design.how) | Revisão e consolidação incremental | Incorporadas como diretrizes locais |
| Alta | `design-tokens` — [julianoczkowski/designer-skills](https://github.com/julianoczkowski/designer-skills) | Consistência de variáveis CSS | Referência para mudanças futuras |
| Alta | `design-systems` — [cuellarfr/design-skills](https://github.com/cuellarfr/design-skills) | Documentação de componentes | Referência para mudanças futuras |
| Alta | `html-wireframe`, `html-prototype` — [plannotator/effective-html](https://github.com/plannotator/effective-html) | Testar fluxos sem mexer em produção | Incorporadas como diretrizes locais |
| Média | `ux-design-expert` — [centminmod/my-claude-code-setup](https://github.com/centminmod/my-claude-code-setup) | Revisões UX específicas | Consultar sob demanda |
| Média | `prototype` — [spree/spree](https://github.com/spree/spree) | Comparar variantes de componentes | Somente quando suportado |
| Média | `interactive-prototype`, `wireframe`, `create-design-system` — [manalkaff/opendesign](https://github.com/manalkaff/opendesign) | Prototipação e documentação | Consultar sob demanda |
| Condicional | `figma-create-design-system-rules`, `figma-code-connect-components` — [openai/skills](https://github.com/openai/skills) | Figma → componentes | Apenas com arquivo Figma conectado |
| Condicional | `figma-design-to-code`, `figma-create-new-file`, `figma-code-connect` — [figma/mcp-server-guide](https://github.com/figma/mcp-server-guide) | Handoff Figma | Apenas com design Figma real |
| Condicional | `understand-figma` — [Egonex-AI/Understand-Anything](https://github.com/Egonex-AI/Understand-Anything) | Mapeamento de arquivo Figma | Não aplicável sem Figma |
| Condicional | `vibefigma` — [vibeflowing-inc/vibe_figma](https://github.com/vibeflowing-inc/vibe_figma) | Figma → React | Avaliar somente com design fornecido |
| Condicional | `figma-build`, `figma-codegen` — [awdr74100/figwright](https://github.com/awdr74100/figwright) | Sincronizar design e código | Não instalar sem fluxo Figma |
| Condicional | `shadcn-ui`, `stitch::manage-design-system` — [google-labs-code/stitch-skills](https://github.com/google-labs-code/stitch-skills) | Design no Stitch e shadcn | Não introduzir shadcn no React/CSS atual sem decisão |
| Condicional | `shadcn` — [spree/spree](https://github.com/spree/spree), [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter), [openstatusHQ/data-table-filters](https://github.com/openstatusHQ/data-table-filters), [panel-ui/PanelUI](https://github.com/panel-ui/PanelUI), [open-slide/open-slide](https://github.com/open-slide/open-slide) | Componentes em projetos que já usam shadcn | Não aplicável à stack atual |
| Condicional | `migrate-design-system` — [arla6ka/design.how](https://github.com/arla6ka/design.how) | Migração deliberada | Não iniciar migração por padrão |

## Itens do documento não adotados automaticamente

- **Outro stack ou domínio:** `shadcn-ui-flutter`, `mobile-shadcn-conventions`, `app-ui-design` nativo, `kiranism-shadcn-dashboard`, `scalar-design-system`, `dstack-prototyping`, `prototyper` para jogos e `frontend-mockup-loop-dashboard` específico de outro app.
- **Figma e produção de mídia sem insumos:** `figma` de HyperFrames/reelmimic, `figma-to-code`, `figma-typings-audit`, `claude2figma`, `figma-create-new-file` e `figma-code-connect`. Requerem contexto/integração próprios.
- **Exploração e estética opcional:** `brainstorm-prototypes`, `learn-prototype`, `ai-assisted-prototyping`, `html-prototype-build`, `design-system-architect`, `design_system_engineer`, `shadcn-ui-adapter`, `ascii-ui-mockup-generator`, `rapid-prototyper`, `applying-ui-design-system`, `design-system` de snapcn, `ci-mockup-figure` e `prototype` de wayfinder-maps.
- **Não adequados à tarefa:** `attack-prototype-pollution` (pesquisa ofensiva de segurança), criação de slides/figuras, plugins de animação e prompts de `prompts.chat` sem implementação verificável.

Isso não invalida as ferramentas: apenas evita dezenas de dependências redundantes e mudanças de design incompatíveis com um editor de cartazes que precisa imprimir corretamente.

## Comandos e critérios de aceite

```bash
npm install
npm run verify
npm run qa:design
# Com Impeccable instalado no checkout:
npx impeccable detect src/
```

- Fazer alterações visuais em branch e PR próprios; nunca redesenhar a Home por padrão.
- Validar seletor, geração, prévia, importação, PDF e impressão nas larguras de `DESIGN.md`.
- Acessibilidade e performance precisam de testes reais, não de uma nota presumida.
- Skills de agentes não são bibliotecas do bundle e não substituem os testes já existentes.
