# Modelos em destaque e mais utilizados

## Objetivo
Exibir primeiro modelos de alto contraste na galeria `/modelos/` e no editor, sem esconder as 26 opções originais nem alterar cores, dimensões ou exportação dos cartazes.

## Ordem e evidências
- **Destaques**: curadoria inicial definida em `FEATURED_MODEL_IDS` de `src/utils/modelPopularity.js`. Ordem inicial: Oferta do dia, Super oferta, Oferta relâmpago, Hortifruti.
- **Em alta**: ordenação automática por número de **sessões distintas** que selecionaram cada modelo nos últimos 30 dias, apenas quando pelo menos cinco sessões com consentimento analítico escolheram aquele modelo. A seleção tem como evento `model_selected` com `model_id`; exibir uma placa na tela não conta como uso.
- **Meus usados**: contagem local de cliques do mesmo navegador (armazenamento funcional/pessoal). Não representa ranking de todo o site. Sem histórico, mantém a curadoria.
- **Todas / Ordem original**: ordem base do catálogo, sem reordenação; busca e filtros continuam varrendo todos os modelos.

## Privacidade e infraestrutura
- `src/utils/telemetry.js` só envia um evento ao endpoint PHP quando `analyticsEnabled === true`. Não envia nome de produto, preço, IP, URL completa ou identificador permanente de visitante.
- `public/api/telemetria.php` aceita apenas modelo de ID simples, valida origem e consentimento, e guarda o identificador da sessão temporária.
- `public/api/modelos-populares.php` lê os arquivos NDJSON mantidos **fora de public_html**, deduplica cada combinação sessão+modelo, descarta agregados abaixo de cinco sessões e retorna apenas contagens (não retorna eventos nem identificadores). Cache privado em arquivo por 15 minutos; sem banco.
- Se o PHP estiver indisponível (ex.: prévia do Vite, GH Pages, falta de permissão de escrita), a vitrine funciona com a curadoria e escolhas locais, sem mensagens intrusivas.
- As contagens são de **seleções**, não de impressões, PDFs concluídos ou de todos os usuários (quem não consente não entra no agregado). Não anunciar os números como 'cartazes impressos'.
- Uso local é uma preferência do dispositivo. O histórico pode ser apagado limpando os dados do site.

## Testes
```bash
node scripts/validate-model-popularity.mjs
php -l public/api/telemetria.php
php -l public/api/modelos-populares.php
npm run verify
npm run qa:design
```
Em produção, confira a resposta JSON de `/api/modelos-populares.php`, escolha um modelo com consentimento e verifique a atualização após o período de cache. Faça testes em 390 px e 1366 px e confirme que a prévia e a folha impressa não foram alteradas.

## Limitações
O agregado pode sofrer pequenas distorções por limpeza de sessões, bloqueadores, comportamento malicioso ou consentimento rejeitado. Uma seleção com cinco sessões não equivale necessariamente a cinco pessoas. Nenhum texto no site deve afirmar ser um ranking completo de usuários.
