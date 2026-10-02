# Headers horizontais

73 arquivos PNG de 1960 × 400 px, derivados dos originais em `img/`.
Abra `preview.html` no navegador para conferir todos os arquivos e ativar as
linhas da área segura horizontal (196–1764 px).

## Reproduzir

Na raiz do repositório, com Python 3.10 ou superior:

```sh
python -m pip install -r scripts/headers-requirements.txt
python scripts/standardize_headers.py
python -m unittest discover -s scripts -p 'test_standardize_headers.py'
```

O script lê somente os PNGs diretamente em `img/`, preserva os originais,
normaliza os nomes e grava os resultados em `img/headers/`. É possível usar
`--source` e `--output` para outras pastas; a pasta de saída deve ser diferente
da pasta de origem.

## Composição e validação

- A imagem original inteira é a região protegida. Não há recorte nem OCR.
- A escala é única para os dois eixos, com arredondamento de pixels.
- A arte ocupa até 400 px de altura, centralizada e inteiramente na área segura.
- As laterais são continuadas com faixas estreitas das próprias bordas,
  espelhadas sem esticar. A suavização cresce para fora da arte original.
- O texto e os elementos centrais não recebem blur, retoque ou alteração.
- Não há regras específicas por arquivo. Os 73 originais atuais são RGB;
  entradas transparentes futuras são compostas sobre uma cor derivada da arte.
- `validation.json` registra dimensões, escala, posição, hashes e validações.
  A região protegida do PNG exportado é comparada pixel a pixel com a composição
  esperada. Os hashes dos originais são conferidos antes e depois do lote.

A validação automática não reconhece o conteúdo escrito nem avalia qualidade
estética: a preservação integral protege as letras e o HTML permite a revisão
visual das texturas espelhadas. As dez artes solicitadas foram revistas.

Estes arquivos ainda não estão integrados ao editor. Nenhum código do site,
CSS, componente, sidebar ou fluxo de impressão foi alterado nesta tarefa.
