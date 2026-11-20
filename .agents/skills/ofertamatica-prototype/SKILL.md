---
name: ofertamatica-prototype
description: Explorar wireframes e protótipos de mudanças de fluxo ou componentes do Ofertamática antes de alterar o código de produção.
---

# Prototipação segura — Ofertamática

Ler `PRODUCT.md`, `DESIGN.md` e `AGENTS.md`. Usar apenas quando o pedido envolver uma decisão estrutural de UX ou comparação de alternativas.

1. Formular a dúvida de produto (por exemplo, localização do botão Gerar ou organização de filtros).
2. Criar no máximo 2–3 alternativas realmente diferentes de hierarquia/fluxo; não chamar simples troca de cor de alternativa.
3. Prototipar isoladamente, sem inserir HTML de teste no build de produção nem conectar dados reais.
4. Usar rótulos em português e exemplos realistas, mas identificados como demonstração.
5. Verificar foco, navegação, mobile e ausência de overflow.
6. Registrar o que foi decidido; implementar no React/CSS existente apenas após escolha, mantendo o fluxo de dois cliques e a fidelidade da impressão.

Referências do documento:
- `html-wireframe` e `html-prototype`: https://github.com/plannotator/effective-html (MIT).
- `prototype`: https://github.com/spree/spree (apenas quando o ambiente suportar).
- `interactive-prototype` e `wireframe`: https://github.com/manalkaff/opendesign.

As skills externas não são instaladas automaticamente por este arquivo.
