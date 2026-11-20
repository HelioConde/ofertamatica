# Skills de design e UX — Ofertamática

Este documento organiza a adoção de **Impeccable** e das referências do documento enviado. São **instruções para agentes de desenvolvimento**, não bibliotecas JavaScript para incluir no bundle de produção. Nenhuma skill externa foi executada ou instalada automaticamente neste PR.

## Contratos que prevalecem

Leia `AGENTS.md` e `DESIGN.md` antes de qualquer mudança. Preservar: Home direto no seletor, primeiro cartaz em dois cliques, uso gratuito sem cadastro, editor desktop em uma viewport, medidas e fidelidade de impressão, fontes oficiais dos cartazes, acessibilidade e consentimento. Não substituir a stack React/Vite por Next.js ou outro framework apenas para usar uma skill.

## Matriz de aplicação

| Skill / referência | Origem | Uso no Ofertamática | Quando ativar |
| --- | --- | --- | --- |
| **Impeccable** | Pesquisar e validar repositório oficial e instruções antes de instalar | Revisão criteriosa de hierarquia, ritmo, tipografia, consistência, densidade e acabamento visual | Refinar componentes ou telas existentes |
| **ui-ux-pro-max** | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | Checklist de padrões UX, tokens, responsividade e acessibilidade | Auditoria de fluxo ou criação de componentes |
| **design-system** | Referência `nextlevelbuilder/ui-ux-pro-max-skill` do documento | Mapear tokens primitivos → semânticos → componentes sem duplicar `DESIGN.md` | Revisar cores, espaços, fontes e estados |
| **build-design-system / design-system-boss** | https://github.com/arla6ka/design.how | Extrair padrões existentes e reduzir inconsistências, sem redesenho integral | Refatoração transversal de UI |
| **design-tokens** | https://github.com/julianoczkowski/designer-skills | Conferir variáveis CSS, contraste, escalas e modo responsivo | Ajustar tokens existentes |
| **html-wireframe / html-prototype** | https://github.com/plannotator/effective-html | Validar fluxo e hierarquia antes de implementar; protótipos descartáveis | Nova jornada complexa |
| **prototype / shadcn** | https://github.com/spree/spree | Comparar alternativas em protótipos; não adicionar shadcn sem necessidade e compatibilidade | Exploração de componente |
| **shadcn-ui** | https://github.com/google-labs-code/stitch-skills | Referência de acessibilidade e composição; adoção opcional | Só se houver justificativa técnica |
| **figma-create-design-system-rules** | https://github.com/openai/skills | Regras de design alinhadas ao código, quando houver arquivo Figma conectado | Sincronização Figma ↔ código |
| **figma-design-to-code / figma-code-connect** | https://github.com/figma/mcp-server-guide | Mapear componentes do Figma para React/CSS sem perder comportamentos | Somente com arquivo Figma real |
| **figma-codegen / figma-build** | https://github.com/awdr74100/figwright | Explorar geração bidirecional Figma/código após validação de compatibilidade | Fluxo com Figma |
| **vibefigma** | https://github.com/vibeflowing-inc/vibe_figma | Referência para converter Figma em React; evitar Tailwind só por dependência da skill | Se o projeto adotar esse fluxo |
| **interactive-prototype / create-design-system / wireframe** | https://github.com/manalkaff/opendesign | Prototipagem clicável e comparação de layouts | Funcionalidades novas |
| **ux-design-expert** | https://github.com/centminmod/my-claude-code-setup | Checklist de revisão UX; revisar conteúdo antes de executar agentes externos | Auditoria de interface |
| **design-systems** | https://github.com/cuellarfr/design-skills | Documentação de componentes, nomenclatura e governança | Manutenção de design system |

As demais entradas do documento são específicas de outros produtos, Flutter, dashboards, animação, jogos ou ferramentas de prototipagem e **não devem ser instaladas indiscriminadamente**. Os links acima identificam os repositórios citados no documento, não garantem que a skill nomeada exista no caminho indicado nem que sua licença permita redistribuição; validar README, licença, instruções e integridade antes de executar.

## Processo recomendado para Impeccable + skills complementares

1. **Diagnosticar:** conferir screenshots existentes, `DESIGN.md`, componentes e fluxos; registrar problema, impacto e tela afetada.
2. **Propor:** para cada problema, formular uma mudança mínima e uma hipótese verificável (ex.: reduzir passos, melhorar legibilidade, evitar overflow).
3. **Implementar:** reaproveitar `src/components`, `src/styles` e tokens; preservar editor, cartazes, PDF e impressão.
4. **Verificar:** executar `npm run verify` e `npm run qa:design`; revisar teclado, contraste, alvos de toque, responsividade e consentimento.
5. **Validar visualmente:** testar 360, 390, 412, 768, 1000 e 1440px, comparar antes/depois e revisar impressão real.
6. **Documentar:** registrar evidência, arquivos modificados, capturas e riscos no PR. Não afirmar que uma skill foi executada se só suas diretrizes foram consultadas.

## Ordem de adoção

- **P0:** Impeccable (após confirmar origem oficial), ui-ux-pro-max, design-system, build-design-system, Web Design Guidelines já documentada em `AGENTS.md`.
- **P1:** design-tokens, html-wireframe e html-prototype para melhorias específicas.
- **P2:** Figma e shadcn somente quando houver design Figma ou decisão arquitetural explícita.

## Instalação segura

O CLI de skills pode instalar ferramentas no ambiente de desenvolvimento, **não no site publicado**. Antes de executar qualquer `npx skills add`, confirmar a origem e ler os arquivos `SKILL.md` e scripts; instalar apenas a skill necessária. Não adicionar dependências externas à aplicação sem benefício mensurável e revisão de segurança.

## Critério de aceite de PR visual

- [ ] Problema original e screenshot antes/depois descritos
- [ ] Identidade e tokens de `DESIGN.md` preservados
- [ ] Navegação por teclado, foco, labels e mobile revisados
- [ ] `npm run verify` e `npm run qa:design` aprovados
- [ ] Geração de PDF, paginação, tipografia de cartazes e impressão sem regressões
- [ ] Nenhuma skill externa declarada como instalada/executada sem evidência
