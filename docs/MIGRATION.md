# Plano de migração — Ofertamática V1 → V2

## Regra principal

A V1 em produção deve continuar funcionando enquanto a V2 é construída.

## V1 — backup obrigatório

Antes da troca de produção:

- exportar todos os arquivos atuais da hospedagem;
- exportar o banco de dados em formato SQL;
- guardar uma cópia local e uma cópia externa;
- não versionar senhas, chaves, arquivos .env ou dumps SQL em repositório público.

## V2 — este repositório

Este repositório é a fonte oficial do novo código.

Fluxo planejado:

GitHub → build/testes → ambiente beta na Locaweb

Somente após validação:

GitHub → build/testes → produção

## Deploy

Nenhum workflow de deploy para o domínio principal deve ser ativado antes de:

1. existir backup verificável da V1;
2. existir ambiente beta separado;
3. a V2 estar pronta para homologação;
4. as variáveis sensíveis estarem configuradas fora do repositório.

## Dados

A reconstrução do frontend não implica apagar o banco atual. Dados úteis da V1 poderão ser migrados para a V2 de forma controlada.
