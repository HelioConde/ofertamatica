---
name: ofertamatica-design-review
description: Auditar, criticar, polir ou endurecer UX/UI do Ofertamática usando evidências visuais e funcionais, compatível com Impeccable e regras locais.
---

# Revisão de UX/UI — Ofertamática

## Contexto obrigatório

Ler `README.md`, `PRODUCT.md`, `DESIGN.md` e `AGENTS.md` antes de sugerir mudanças. Esta é uma ferramenta de trabalho para varejo: no criador, usar o modo **Operate** do Impeccable, não um redesign de landing page.

## Quando usar

- Revisão de seletor, editor, modelos, formulários, menus, estados vazios, mensagens e mobile.
- Solicitações de `critique`, `audit`, `polish`, `harden`, `adapt`, `distill` ou `optimize`.
- Não usar para mudanças exclusivamente de backend ou infraestrutura.

## Fluxo

1. Delimitar rota/componente, usuário, tarefa e critério de sucesso; registrar estado anterior.
2. Consultar capturas existentes em `screenshots/` e código React/CSS. Não concluir a partir de imagens desatualizadas.
3. Se o Impeccable oficial estiver instalado, usar seu playbook apropriado e seu detector; caso contrário, fazer auditoria manual e registrar que o Impeccable não foi executado.
4. Revisar hierarquia, densidade, legibilidade, fluxo de dois cliques, ações principais, estados de erro/loading, rótulos, contraste, foco e alvos de toque.
5. Verificar 360, 390, 412, 768, 1000 e 1440px; testar teclado, toque, overflow e `prefers-reduced-motion`.
6. Para alterações visuais autorizadas, reutilizar componentes/tokens existentes e comparar capturas antes/depois. Não alterar medidas de cartaz, paginação nem fontes de preço.
7. Executar `npm run verify` e `npm run qa:design` quando houver ambiente disponível. Conferir também importação, PDF, consentimento e impressão quando afetados.
8. Entregar achados com localização, evidência, severidade, correção e status de verificação. Não inventar pontuação Lighthouse nem alegar execução sem logs.

## Integrações externas

- Impeccable oficial: https://github.com/pbakaus/impeccable (Apache-2.0). Instalação opcional: `npx impeccable install`, após revisão. O modo live não deve usar bypass de permissões.
- UI review e design-system-boss: https://github.com/arla6ka/design.how (MIT).
- Web Design Guidelines: https://github.com/vercel-labs/web-interface-guidelines.
- Ferramentas e limites adicionais: `docs/DESIGN_SKILLS.md`.

## Pronto quando

Nenhum contrato de `PRODUCT.md` ou `DESIGN.md` foi quebrado, problemas novos foram testados e toda afirmação de qualidade tem evidência reproduzível.
