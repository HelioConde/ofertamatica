# Curadoria de placas por consultas e feedback — 30/10/2026

## Evidência utilizada: relatório que o proprietário compartilhou
O Search Console exibiu consultas como "placas de preços para hortifruti para imprimir" (4 impressões), "placas de setores de supermercado" (3), "placa de black friday" (3) e "cartaz black friday" (2). As páginas de maior exposição listadas pelo usuário foram supermercado (47 impressões/1 clique), Black Friday (42/0), hortifruti (33/0), padaria (26/0), farmácia (23/1) e home (24/3), com janelas não especificadas. Esses volumes **não justificam conclusões estatísticas ou afirmações de ranking**, apenas priorizam melhorias de utilidade.

## Hipótese testável
O visitante procura a placa para imprimir, mas o guia textual não mostrava cedo uma miniatura editável com preço. Em vez de publicar dezenas de URLs semelhantes, exibir os modelos de verdade nas páginas que já recebem impressões.

## Implementação
- **Nova página única** `/placas-sazonais/` com Black Friday, Halloween, Natal, verão, aniversário e fim de semana. Miniaturas vindas da **mesma fonte de modelos do editor**; os preços dos exemplos são fictícios.
- Adicionados modelos originais de **Halloween** e **Natal** ao catálogo real e à personalização do gerador.
- Galerias de modelos utilizáveis inseridas nas páginas Black Friday, hortifruti, supermercado, padaria, farmácia e cartazes para imprimir. O botão "Usar este modelo" aplica cores/cabeçalho ao criador.
- Ajustes descritivos nos títulos e snippets das páginas conforme termos reais procurados. **Google decide o título e o snippet efetivamente exibidos**; CTR não é garantida e recrawl pode levar dias.
- Alias estático para `/placas-para-acougue/` → `/cartazes-para-acougue/`, rota apontada no relatório e diferente da URL canônica atual.
- Links diretos para a nova página sazonal a partir da home, modelos e Black Friday. HTML inicial contém exemplos e explicações, sem depender de JS.
- **Pequeno pop-up de feedback** após 16 segundos, não aparece em impressão, pode ser dispensado por 14 dias. Mensagem (até 400 caracteres) e avaliação opcional: abre e-mail ao clicar ou permite copiar o texto. Não existe backend de feedback, não há envio automático nem coleta em analytics. Usuários devem evitar dados pessoais e listas de produtos.

## QA
- `npm run verify` inclui `scripts/validate-curated-models-feedback.mjs`, valida fontes e HTML de todas as coleções.
- `node scripts/qa-interactions.mjs` inclui galeria sazonal em 390 px, transferência de modelo ao criador, curadorias setoriais no desktop, alias antigo e feedback com relógio controlado.
- `npm run audit:content`, impressões e capturas da pipeline devem continuar aprovadas.

## Medição
Comparar 7 e 28 dias **após** recrawl, no Search Console: impressões, cliques, CTR, posição e dispositivo por página/consulta, além do clique no botão "Usar modelo" via eventos existentes (só com consentimento). Não exagerar em extrapolações de 24 h. Não manipular cliques nem comprar tráfego artificial.

## Privacidade e AdSense
A página oferece **funcionalidade própria**, não somente textos gerados para buscas. Preços são exemplos fictícios, e campanhas exigem informações verdadeiras sobre desconto e condição. É uma hipótese de melhoria; não existe garantia de aprovação AdSense, indexação ou aumento da CTR. Evitar abrir anúncios antes da aprovação.
