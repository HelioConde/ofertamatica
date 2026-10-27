# Diagnóstico de disponibilidade antes do Lighthouse — 27/10/2026

Uma execução em `main` [#40486085244](https://github.com/HelioConde/ofertamatica/actions/runs/40486085244) falhou **antes da medição Lighthouse**: a origem respondeu ao `curl`, porém o HTML não continha a estrutura esperada de Ofertamática. Uma nova execução [#40486995862](https://github.com/HelioConde/ofertamatica/actions/runs/40486995862) passou no mesmo commit.

## Como a verificação funciona agora

1. Chrome é verificado e o site é requisitado com HTTPS e cabeçalho `Accept: text/html`.
2. O sistema inspeciona três requisitos mínimos: tag `html`, identificador `root` da aplicação React e a identidade "Ofertamática" no documento, tolerando acentos.
3. Se retornar erro de rede **ou conteúdo inesperado**, repete até quatro tentativas com intervalo progressivo de 4, 8 e 12 segundos. `curl` pode repetir erros de transporte transientes dentro de cada tentativa.
4. Salva `performance/production-readiness-N.json` contendo apenas flags estruturais, título truncado, comprimento do HTML e SHA-256 para identificar respostas distintas. Não grava o corpo HTML bruto em artefatos.
5. Se todas as tentativas falharem, o job permanece vermelho como **falha de disponibilidade** e o Lighthouse não roda; não infere performance por essa falha.

## Testes

`python3 -m unittest discover -s scripts -p 'test_check_production_html.py'`

Os testes incluem HTML legítimo com acento, erro de proxy retornado como página 200 e página de manutenção que menciona a marca mas não inclui a aplicação.

## Limitações

Sem tempos garantidos: respostas do provedor, cache/CDN, bloqueios ou mecanismos anti-bot podem variar. A auditoria avalia a aplicação de produção, não a edição local nem o GitHub Pages.