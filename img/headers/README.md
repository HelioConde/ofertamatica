# Headers panorâmicos recriados

73 PNGs de **1960 × 400 px**, recriados com IA a partir da identidade visual das
campanhas originais em `img/`. Os originais permanecem preservados.

Abra `preview.html` para conferir todas as artes; clique em uma imagem para
abrir o PNG em tamanho completo. `validation.json` registra dimensões, hashes
dos originais e dos resultados, escala proporcional e enquadramento vertical.

## Composição

- Títulos grandes e completos, com grafia e acentos conferidos visualmente.
- Composições horizontais reorganizadas; laterais com produtos e cenários
  próprios de cada campanha, sem espelhamento ou preenchimento borrado.
- Os títulos longos foram redistribuídos horizontalmente para caber na faixa.
- A exportação aplica uma única escala nos dois eixos e remove somente as
  faixas superior/inferior excedentes do cenário gerado, após revisão visual.
- Nenhum esticamento, blur, repetição ou preenchimento é aplicado na exportação.
- São recriações: os pixels da nova arte não são idênticos aos originais.

## Exportar novamente

O processo generativo foi realizado com ImageGen. A exportação pode ser repetida
quando as imagens geradas estiverem disponíveis localmente:

```sh
python -m pip install -r scripts/headers-requirements.txt
python scripts/prepare_recreated_headers.py --manifest caminho/manifest.json
python -m unittest discover -s scripts -p 'test_prepare_recreated_headers.py'
```

O manifest é uma lista com `name` (nome original sem extensão), `generated`
(caminho local da arte gerada), `visually_reviewed: true` e, opcionalmente,
`crop_top` (posição vertical após a escala proporcional). Deve incluir cada
original exatamente uma vez. O exportador confere as imagens antes da gravação
e compara os hashes dos originais com o relatório anterior.

A revisão visual é obrigatória; os testes automáticos não reconhecem palavras.
O script antigo `standardize_headers.py` produz rascunhos com texturas e impede
a sobrescrita destas artes recriadas. Para experimentar aquele método legado,
use outra pasta com `--output`.

Esta atualização troca somente os assets dos headers e sua documentação de
exportação. Não altera parser, preços, fontes, editor ou lógica de impressão.
