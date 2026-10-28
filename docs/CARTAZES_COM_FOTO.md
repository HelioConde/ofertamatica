# Cartazes com fotos de produtos — MVP

## O que mudou
- Três modelos novos em **Modelos > Com foto**: Foto + preço em destaque, Foto para hortifruti e Produto central premium.
- No editor: **Estilo > Fotos**. Escolha um produto na tabela, envie uma imagem e selecione a posição (esquerda, direita ou central).
- PNG, JPEG ou WebP, limite de 8 MB na entrada. A foto é reduzida/otimizada **dentro do navegador** para até 180 KB antes de integrar a placa.
- A prévia, o PDF gerado pela impressão e a folha impressa compartilham o mesmo `PosterSheet` e `layoutPlan`. O preço continua no terço inferior e a descrição tem espaço próprio.
- Fotos são vinculadas ao produto; ao colar a lista novamente o editor preserva a imagem dos produtos que continuam com o mesmo nome, marca, complemento e unidade.
- Modelos com foto contêm **ilustrações de exemplo**, não fotos reais de marcas. O usuário deve enviar suas próprias imagens de produto antes de imprimir. Nunca inserir automaticamente uma foto de demonstração na placa final.
- Sem conexão com serviço externo, IA de reconhecimento, raspagem de sites ou banco de dados. Escolha imagens que você tem direito de usar.

## Formatos e fallback
- Funciona em A4, A5, A3, SRA3, A4 2x1 e A4 4x1.
- Para A4 8x1 (A7) e A4 App, o modo foto fica indisponível por limitação de espaço.
- Se o modelo não tem imagem no produto, usa o mesmo layout tradicional sem espaços vazios.
- `photoLayout: off` mantém o design anterior, mesmo que exista foto salva.
- A imagem é guardada no rascunho local do dispositivo enquanto houver espaço disponível. Se o navegador bloquear esse armazenamento, a edição permanece utilizável na sessão, mas a imagem poderá desaparecer ao atualizar.

## Testes obrigatórios
```bash
npm run verify
node scripts/validate-photo-posters.mjs
npm run qa:design
node scripts/qa-interactions.mjs
```
Verificar as três posições em 390px e 1366px; prévia, impressão, PDF e reabertura do rascunho. Verificar que foto e texto não se sobrepõem. Não usar exemplos de fotos de terceiros sem autorização.

## Próximas etapas possíveis
- Biblioteca local de fotos por produto, importação em lote por nome e recorte/manual de fundo.
- Controles de enquadramento e escala individual por produto.
- Testes de legibilidade com nomes grandes em A4 4x1 e A5.
