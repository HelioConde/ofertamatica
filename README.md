# Ofertamática V2

Ofertamática é uma plataforma SaaS para criar placas promocionais, cartazes, tabloides e comunicação visual profissional para supermercados, farmácias, padarias e varejo.

## Status

Este repositório contém a reconstrução da **Ofertamática V2**, iniciada do zero.

- A versão atual em produção (V1) permanece intacta na Locaweb.
- A V2 usa React + Vite.
- O deploy automático da V2 aponta somente para `public_html/beta`.
- O domínio principal não é sobrescrito durante o desenvolvimento.
- Credenciais, chaves de API, senhas e arquivos `.env` nunca devem ser versionados.

## Desenvolvimento

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

## Deploy beta

Todo push na branch `main` executa o workflow `.github/workflows/deploy-beta.yml`, gera `dist/` e envia o build para:

```text
public_html/beta
```

O ambiente beta poderá ser acessado inicialmente por `/beta/` e depois associado a um subdomínio de homologação.

## Estratégia

1. Preservar e exportar a V1 atual.
2. Desenvolver a V2 neste repositório.
3. Publicar a V2 no ambiente beta.
4. Validar cartazes, importação, IA, autenticação e responsividade.
5. Somente depois trocar o domínio principal para a V2.

## Produção

O site atual não deve ser sobrescrito durante o desenvolvimento da V2.
