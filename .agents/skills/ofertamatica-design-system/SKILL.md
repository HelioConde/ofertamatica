---
name: ofertamatica-design-system
description: Evoluir tokens CSS, tipografia, componentes e estados do Ofertamática sem perder a identidade visual ou a fidelidade dos cartazes impressos.
---

# Design system incremental — Ofertamática

## Autoridade

`DESIGN.md` e o CSS já publicado são a fonte de verdade. Ler também `PRODUCT.md` e `AGENTS.md`. Skills externas são repertório, não autorização para trocar paleta, fontes, layout ou framework.

## Processo

1. Inventariar tokens reais em `src/styles.css` e `src/styles/`, componentes em `src/components/` e tipografia em `src/config/posterTypography.js`.
2. Identificar repetição e divergências comprovadas antes de criar tokens. Preferir alias semântico para variáveis existentes.
3. Quando útil, estruturar tokens em primitivo → semântico → componente, sem duplicar valores nem fazer migração ampla não solicitada.
4. Documentar estados default/hover/focus/disabled/loading/error, responsividade, nomes acessíveis e exemplos de uso.
5. Migrar apenas componentes dentro do escopo; manter compatibilidade com os estilos e testes existentes.
6. Conferir contraste, foco, campos em mobile, miniaturas reais, prévia de cartaz e comportamento de impressão.
7. Validar `npm run verify` e `npm run qa:design`, mais screenshots e testes de impressão quando afetados.

## Não fazer

- Não introduzir Tailwind, shadcn/ui, bibliotecas de animação ou novo sistema de tokens apenas porque uma skill os recomenda.
- Não substituir Inter na UI nem Burbank/Futura nos cartazes sem pedido explícito.
- Não usar glassmorphism, gradientes, glow, sombras e animações como padrão.
- Não alterar formatos em mm, fontes de preços ou prévia impressa para acomodar um componente.

## Referências selecionadas do documento

- `design-system`: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT).
- `build-design-system`, `design-system-boss`, `token-mapping`: https://github.com/arla6ka/design.how (MIT).
- `design-tokens`: https://github.com/julianoczkowski/designer-skills.
- `design-systems`: https://github.com/cuellarfr/design-skills.

Estas são referências externas; esta skill local é uma adaptação original ao produto, não uma cópia nem uma instalação desses pacotes.
