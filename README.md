# Ofertamática V2

Ofertamática é uma plataforma SaaS para criar placas promocionais, cartazes, tabloides e comunicação visual profissional para supermercados, farmácias, padarias e varejo.


## Regra obrigatória de entrada do produto

> **Ao acessar `https://ofertamatica.com.br/`, o usuário deve cair diretamente na criação de placas, começando pelo seletor de formatos.**

Esta é uma regra permanente de produto e deve ser preservada em futuras alterações de layout, SEO e navegação:

- a rota raiz `/` é a Home e também o ponto de entrada do criador;
- não criar uma landing page intermediária antes do criador;
- o usuário não deve precisar clicar em “Criar placas” para começar;
- o logo e o item **Criar placas** da navbar devem levar para `/`;
- `/criar-placas/` pode continuar existindo apenas como alias de compatibilidade;
- Modelos, Formatos, Como funciona e Guias para varejo devem permanecer em páginas separadas;
- as subpáginas não devem substituir o criador na rota raiz;
- ao clicar em **Criar placas** a partir de qualquer subpágina, o usuário deve voltar para `/`.

### Estrutura principal de rotas

- `/` — criação de placas / seletor de formatos;
- `/modelos/` — modelos e estilos;
- `/formatos/` — detalhes dos formatos;
- `/como-funciona/` — fluxo de uso;
- `/guias-para-varejo/` — guias e conteúdos.

**Se houver conflito entre uma mudança futura e esta regra, a entrada direta no criador pela rota `/` tem prioridade.**

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
