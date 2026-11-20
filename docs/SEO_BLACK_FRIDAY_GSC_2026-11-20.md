# Diagnóstico e melhorias de busca — Black Friday (20/11/2026)

## Dados recebidos pelo responsável do site

Captura do Search Console: tipo de pesquisa **Web**, intervalo selecionado **3 meses**, tabela de páginas, sem posição média nem consultas abertas no print.

| Página | Cliques | Impressões | CTR calculado |
| --- | ---: | ---: | ---: |
| `/` | 63 | 396 | 15,91% |
| `/cartaz-black-friday/` | 13 | 1.598 | **0,81%** |
| `/placas-para-hortifruti/` | 9 | 380 | 2,37% |
| `/cartaz-para-supermercado/` | 7 | 315 | 2,22% |
| `/cartazes-para-farmacia/` | 5 | 182 | 2,75% |

O CTR é calculado por cliques/impressões × 100; não é um score de qualidade. A diferença pode vir de **posição média baixa, consultas pouco alinhadas, dispositivo ou snippet**. Sem posição e consultas da URL, não atribuir causalidade ao título nem prometer aumento de tráfego.

O print de cobertura **do domínio inteiro** apresenta: 19 URLs com redirecionamento, 18 respostas 404, 39 rastreadas e ainda não indexadas, 6 soft 404, 1 canônica alternativa e 5 descobertas ainda não indexadas. Essas contagens **não são falhas da página Black Friday** e não oferecem os exemplos de URL; não criar 301s, conteúdo fictício nem alterar canonicals sem identificar cada origem e o destino equivalente.

## Mudanças implementadas nesta branch

1. **Snippet específico:** título passa a informar os **16 modelos para imprimir grátis**; descrição destaca fundo branco econômico, formatos A4/A5/A3 e ausência de cadastro. Sem ano fixo, para a URL continuar válida após 2026.
2. **UX da busca:** primeiro botão da landing aponta para a galeria real de 16 modelos; o segundo abre o criador. A galeria recebe id fixo e espaçamento de rolagem para navegação por teclado e celular.
3. **HTML inicial indexável:** modelos e link interno aparecem antes dos artigos longos no snapshot estático. Assim o conteúdo de busca expressa a mesma prioridade que a interface React.
4. **Testes:** `validate-seo-graph` valida snippet e hierarquia; `qa-black-friday-landing.mjs` testa HTML 200, H1, 16 cards, filtro dos seis modelos de fundo branco, Enter no atalho, layout 390/1440px e a seleção de modelo. `verify-live-seo` confirma metadados e âncora após publicação.

**Fora de escopo:** alterar os 16 designs, o tamanho físico A4/A5/A3, AdSense, consentimento, funcionalidade De/Por, redirecionamentos ou política de indexação sem dados. Todas as placas com preços de exemplo permanecem identificadas como fictícias.

## Monitoramento no Search Console

Após publicar, registrar o dia exato do deploy e **aguardar dados consolidados** (normalmente 2–3 dias de atraso). Acompanhar por 2 a 4 semanas:

- Filtro `Página exatamente /cartaz-black-friday/` e dimensões `Consulta`, `Dispositivo` e `Data`: comparar CTR em **posições semelhantes**, não só CTR agregado.
- Separar consultas como `cartaz black friday para imprimir`, `modelo black friday a4`, `black friday fundo branco` **somente se aparecerem nos dados reais**; são exemplos de segmentação, não consultas verificadas.
- Inspecionar no GSC a URL canônica `https://ofertamatica.com.br/cartaz-black-friday/`. Se estiver indexada, não solicitar reindexação repetidamente nem tratar impressões como erro.
- Exportar os exemplos das categorias **404**, **soft 404** e **Rastreada, mas não indexada** para identificar possíveis problemas reais, separados dos 301 intencionais e do `/login` desativado.
- Conferir Search Console e analytics de cliques em `Ver os 16 modelos` e `Usar este modelo` quando houver eventos de medição consentidos; não inventar taxa de conversão.

A conexão GSC Wizard do chat retornou `payment_required` em 20/11/2026. Esta intervenção se baseia apenas nas capturas do proprietário, no HTML público e nos testes do próprio repositório; **não** foi realizada uma consulta autenticada às posições ou palavras-chave.
