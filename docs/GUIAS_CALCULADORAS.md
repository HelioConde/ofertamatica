# Ferramentas dos guias — preço por peso e De/Por

## Objetivo
As páginas públicas precisam entregar utilidade própria, além de links repetidos para o gerador de cartazes. Estas calculadoras simples não exigem cadastro, não transferem preços para um servidor e preservam o gerador/impresso atual.

## Páginas
- `/placas-para-hortifruti/`, `/placas-para-padaria/`, `/cartazes-para-acougue/`: preço por quilo + peso em gramas → valor proporcional.
- `/cartaz-de-por/` e `/cartaz-black-friday/`: valor anterior e atual → economia em reais e porcentagem.
- Exemplos estão presentes no HTML inicial, mesmo sem JavaScript. Com JavaScript, a calculadora é interativa e atualiza ao digitar.

## Matemática e responsabilidade
- Conversão de preços PT-BR em **centavos inteiros**, com precisão de duas casas: `14,90/kg × 350 g → R$ 5,22` após arredondamento comercial de centavos.
- `De R$ 24,90 por R$ 19,90 → R$ 5,00 de economia, 20,1%`. Desconto percentual arredondado a uma casa.
- O valor anterior precisa ter sido efetivamente praticado; a calculadora **não comprova** histórico nem validade promocional.
- Peso e preço são digitados localmente e não representam preços em tempo real. Pode haver diferença de arredondamento na balança/PDV; conferir dados da loja.
- Não há banco, APIs de terceiros nem novos eventos de telemetria.

## Testes
```bash
npm run verify
node scripts/validate-retail-calculators.mjs
node scripts/qa-interactions.mjs
```
Verificar manualmente as cinco páginas no celular/desktop, sem JS e com JS. Conferir se os dois modos funcionam com teclado e se as condições da promoção não desaparecem na leitura.
