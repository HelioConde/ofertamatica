# Otimização SEO e UX — cartazes Black Friday (20/11/2026)

## Evidência e privacidade

O diagnóstico partiu de capturas **privadas** do Google Search Console fornecidas pelo proprietário. As métricas individuais de cliques, impressões e cobertura **não são publicadas neste repositório**. A página `/cartaz-black-friday/` foi priorizada por ter maior exposição de busca do que outras páginas editoriais no material analisado.

**Limite de inferência:** CTR baixo pode depender de posição média, consultas, dispositivo ou aparência do snippet. As capturas não exibiam posição e consultas por URL; não concluir que o título, isoladamente, causava o desempenho e não prometer resultados quantitativos sem medições.

O painel também registrou URLs do domínio nas categorias redirecionamento, 404, soft 404 e rastreada/não indexada. Essas categorias são **do site inteiro**, não prova de erros da página Black Friday. As listas exatas de URLs afetadas não foram fornecidas; não criar redirecionamentos nem páginas artificiais sem confirmar cada URL e destino equivalente.

## Correções implementadas

1. **Título e descrição:** destacar que existem **16 modelos editáveis**, impressão grátis em A4/A5/A3 e opções de fundo branco econômico, Esquenta e De/Por. Não incluir ano fixo para evitar desatualização.
2. **Intenção de quem chega da busca:** botão `Ver os 16 modelos` leva diretamente à galeria real; `Criar meu cartaz grátis` mantém o atalho ao editor.
3. **Hierarquia indexável e visível:** página React e HTML estático posicionam a galeria de modelos antes dos exemplos genéricos e artigos explicativos; destino `#modelos-black-friday` funciona em ambos.
4. **Testes:** `validate-seo-graph.mjs` verifica metadata, galeria e ordem; `qa-black-friday-landing.mjs` verifica 16 cartões, 6 opções econômicas, Enter, navegação à galeria, seleção de arte e viewport de 390 e 1440px; `verify-live-seo.mjs` valida o HTML publicado.

A arte dos modelos, seus preços demonstrativos, fontes, formatos, PDF, consentimento e AdSense não foram alterados.

## Plano de monitoramento

Registrar a data de publicação e acompanhar por **2 a 4 semanas** no Search Console (respeitando a defasagem de alguns dias nos dados):

- Página exatamente `https://ofertamatica.com.br/cartaz-black-friday/`, dimensões **Consulta**, **Dispositivo** e **Data**; comparar CTR em posições similares.
- Verificar consultas reais que geraram impressões, distinguindo impressão de interesse informativo e interesse em baixar/imprimir.
- Inspecionar a URL canônica e seu status de indexação antes de solicitar reindexação.
- Exportar os exemplos de 404 e soft 404 do Search Console, comparando com os redirecionamentos legados e as rotas intencionalmente desativadas; não confundir 301 esperado com falha.
- Reavaliar se os visitantes conseguem escolher um modelo e avançar ao criador, quando houver dados de eventos coletados com consentimento.

A conexão de análise detalhada GSC Wizard não estava disponível nesta sessão. Nenhuma posição média ou consulta foi inventada ou registrada como verificada.
