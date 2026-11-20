# Ofertamática — contexto de produto para agentes de design

Este arquivo complementa `README.md` e `DESIGN.md`. Em conflitos, os requisitos explícitos do usuário e os contratos de produto existentes prevalecem.

## O que é

Ferramenta web para criar cartazes promocionais legíveis para supermercados, mercados e varejo brasileiro, com foco em produtividade e impressão fiel.

## Pessoas e tarefas

- Operador de loja/cartazista: escolher formato, colar ou importar produtos, revisar descrições e preços, imprimir.
- Responsável por comunicação visual: usar modelos e fundos, personalizar quando necessário, sem perder fidelidade de impressão.
- Leitor de guias: entender formatos, fluxos e boas práticas sem precisar entrar em um editor complexo.

## Resultado esperado

1. A rota inicial apresenta diretamente o seletor de formatos, sem landing intermediária.
2. O fluxo principal permite chegar à primeira placa em dois cliques: escolher formato e gerar.
3. Uso gratuito não exige cadastro para criar a primeira placa.
4. No desktop, editor e prévia são operáveis dentro de uma viewport, com rolagem interna quando necessário.
5. Prévia, PDF e impressão mantêm medidas, fontes e layout de cartazes.
6. Textos e controles são claros, acessíveis e funcionais em celular e desktop.

## Superfícies e modos de design

- `/` e editor: **Operate** — reduzir atrito, priorizar controle e prévia.
- `/modelos/` e `/formatos/`: **Operate/Read** — descoberta e escolha sem interromper a tarefa.
- `/como-funciona/` e `/guias-para-varejo/`: **Read** — conteúdo escaneável e SEO sem promessas não verificadas.
- Páginas editoriais de divulgação, quando existentes: **Persuade**, sem transformar a Home em landing.
- `/validade-zero/`: produto relacionado; não aplicar mudanças do criador automaticamente nele.

## Limites obrigatórios

- Preservar tokens, paleta e tipografia oficial documentados em `DESIGN.md`.
- Não mudar dimensões físicas, paginação, fontes de preço ou comportamento de impressão por estética.
- Não alterar SEO, anúncios, consentimento, integrações e deploy como efeito colateral de um ajuste visual.
- Preferir componentes React e CSS existentes; nenhuma nova dependência de UI sem justificativa.
- Não assumir que um screenshot substitui teste de impressão física.

## Evidência e validação

Ler `AGENTS.md` para os comandos. Usar `npm run verify`, `npm run qa:design` e QA visual/teclado nas larguras especificadas em `DESIGN.md`. Uma ferramenta ou skill só pode ser descrita como executada se realmente foi executada.
