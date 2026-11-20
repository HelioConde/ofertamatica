---
name: ofertamatica-impeccable
description: Executar a auditoria de design Impeccable no Ofertamática e converter achados em correções revisáveis, sem redesenhar cartazes ou instalar dependências de UI.
---

# Impeccable no Ofertamática

Ler `README.md`, `PRODUCT.md`, `DESIGN.md`, `AGENTS.md` e `.agents/skills/ofertamatica-design-review/SKILL.md` antes de atuar.

## Quando usar

Quando houver mudança em `src/` que afete visual, responsividade, tipografia de interface, hierarquia, formulários ou estados de interação. Também para uma auditoria de qualidade solicitada explicitamente.

## Aplicação real

1. No GitHub, o workflow `Impeccable Design Scan` roda o detector oficial fixado em `impeccable@4.10.0` sobre `src/` e registra anotações.
2. No checkout local, usar `npx --yes impeccable@4.10.0 detect --github src/` ou `npx --yes impeccable@4.10.0 detect src/`. **Nunca** tratar o código de saída 2 (achados) como prova de sucesso; código 1 indica falha na varredura.
3. Para comandos completos de agente (`critique`, `audit`, `polish`, `adapt`, `harden`), revisar o instalador oficial em https://github.com/pbakaus/impeccable e instalar no ambiente de desenvolvimento com `npx impeccable install`. A skill oficial não foi vendorizada neste repositório.
4. Comparar achados com renderizações reais e com as regras do `DESIGN.md`. A interface do editor é modo **Operate**; guias são modo **Read**. Uma regra genérica não pode impor uma fonte, cor ou layout que quebre a marca ou a impressão.
5. Corrigir um componente por vez. Não rodar `impeccable live` com bypass de permissões e não modificar CSP de produção para habilitá-lo.
6. Validar `npm run verify`, `npm run qa:design` e Playwright dos fluxos alterados. Registrar arquivos, evidências e limitações.

## Não confundir

O detector executado em CI não equivale à instalação dos comandos do agente. Uma skill local é orientação para agentes; não é alteração de CSS/React em produção. Não declarar problema corrigido sem um diff e testes.
