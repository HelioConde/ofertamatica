# Pré-conferência de listas no guia Excel

A página `/cartazes-a-partir-de-excel/` agora usa o **mesmo parseProductList do editor** para exibir uma pré-conferência de preços, unidades de venda e possíveis produtos repetidos.

O visitante cola texto (inclusive linhas e colunas copiadas do Excel); a análise ocorre no próprio navegador, sem banco ou envio de preços. O guia oferece um exemplo estático genuíno no HTML inicial, que também mostra uma linha com preço ausente. A interface completa permite substituir o exemplo, copiar a lista e abrir o gerador.

A revisão automática **não substitui a confirmação do valor no sistema da loja** e não garante interpretação perfeita, conformidade comercial, estoque ou validade. Produto duplicado é apenas um alerta, pois pode ser intencional. A ausência de unidade é sinal de conferência, não prova de erro.

Limite operacional para a prévia: 80 linhas de produtos e 12.000 caracteres. Para volumes maiores, usar lotes ou importar o arquivo diretamente no gerador.

Testes: `npm run verify`, `node scripts/validate-retail-list-review.mjs` e `node scripts/qa-interactions.mjs`. Também validar uso com teclado, rolagem horizontal dentro da tabela em 390px e cópia local por permissão do navegador.

Esta melhoria fortalece a utilidade do guia, mas **não garante aprovação AdSense**.
