<div align="center">

<h1>🛒 Ofertamática</h1>

<strong>Cartazes promocionais para o varejo, sem perder tempo com diagramação</strong>

<p>Escolha um formato, cole produtos e gere placas prontas para revisar e imprimir.</p>

<a href="https://ofertamatica.com.br/"><img alt="Abrir Ofertamática" src="https://img.shields.io/badge/CRIAR%20PLACAS-Acessar%20site-1d63e9?style=for-the-badge"></a>
<a href="https://github.com/HelioConde/ofertamatica"><img alt="React e Vite" src="https://img.shields.io/badge/React%20%2B%20Vite-Frontend-149ECA?style=for-the-badge"></a>

<p><a href="https://ofertamatica.com.br/"><strong>Abrir o criador</strong></a> · <a href="https://ofertamatica.com.br/modelos/"><strong>Modelos</strong></a> · <a href="https://ofertamatica.com.br/formatos/"><strong>Formatos</strong></a></p>

</div>

---

## O que é Ofertamática?

A **Ofertamática** é uma ferramenta web de comunicação visual para supermercados, mercados e outros negócios do varejo. O objetivo é converter listas de produtos em **cartazes promocionais legíveis**, nos tamanhos corretos, sem depender de um programa complexo de design.

A experiência prioriza produtividade, impressão e poucos passos, com opções avançadas disponíveis **depois** de gerar a primeira placa.

## Como criar cartazes

1. **Escolha o formato** — A4, A5, A3 ou subdivisões de folhas, conforme disponível.
2. **Informe os produtos** — cole uma lista, arraste um arquivo ou importe planilhas.
3. **Gere e revise** — confira preço, unidade, descrição e personalizações opcionais.
4. **Imprima ou salve como PDF** — respeitando dimensões físicas do papel.

O produto suporta modelos de preço comuns no varejo, incluindo ofertas tradicionais e tipos promocionais específicos.

### Regras essenciais do produto

Estas decisões são **requisitos do projeto**, não apenas sugestões de layout:

| Princípio | Regra |
| --- | --- |
| **Entrada direta** | A rota `/` abre o criador, começando pela escolha do formato — nunca uma landing intermediária |
| **Primeira placa em dois cliques** | Formato e geração da lista são o fluxo principal; detalhes avançados são opcionais |
| **Desktop compacto** | Home e workspace devem caber em `100dvh` e usar rolagem **interna** quando preciso |
| **Prévia disponível** | A prévia deve continuar visível enquanto o usuário configura placas no desktop |
| **Sem dados fictícios involuntários** | Exemplos e modelos não devem aparecer como trabalho real do primeiro acesso |
| **Impressão fiel** | Ajustes visuais não devem modificar proporção nem tamanho físico das placas |

As decisões técnicas detalhadas foram preservadas em [documentação de referência](docs/README_REFERENCE_2026-10-25.md) e no [design system](DESIGN.md).

## Funcionalidades

- Entrada por lista de produtos, com reconhecimento de colagens tabuladas e formatos comuns de CSV/planilha.
- Edição de descrição, complemento, unidade e preço após a importação.
- Formatos para impressões individuais e múltiplos cartazes por folha.
- Modelos de oferta como padrão, de/por, atacado/varejo e outras variações disponíveis no editor.
- Personalização de fontes, cores, logos, cabeçalhos, validade e limites por cliente.
- Pré-visualização e impressão, com opção de salvar como PDF na janela de impressão.
- Recursos de produtividade local, como histórico recente e instalação como app quando suportada pelo navegador.

**Importante:** recursos de inteligência artificial, integrações externas e algumas experiências complementares dependem do escopo/configuração documentados no código e **não devem ser presumidos como obrigatórios para gerar cartazes**.

## Para desenvolvedores

### Tecnologias

**Frontend:** React 19, Vite 8, JavaScript e CSS.  
**Planilhas:** `@e965/xlsx`.  
**Publicação e SEO:** geração de páginas, validações automatizadas e scripts de build.  
**Qualidade:** rotinas próprias de QA de design, parser, impressão, SEO e integrações.

### Executar localmente

```bash
git clone https://github.com/HelioConde/ofertamatica.git
cd ofertamatica
npm install
npm run dev
```

### Construção e validação

```bash
npm run build
npm run verify
npm run qa:design
npm run audit:content
```

O comando `verify` executa o build e uma sequência de verificações automatizadas. Elas ajudam a detectar regressões, mas não substituem conferir manualmente a impressão física.

### Organização

```text
src/          Aplicação e componentes
public/       Recursos públicos
img/          Imagens do projeto
Fundo/        Fundos e materiais de cartazes
scripts/      Build, SEO e ferramentas de validação
apps/         Experiências e integrações
docs/         Documentação técnica, SEO e regras
DESIGN.md     Padrão visual da aplicação
AGENTS.md     Orientações para manutenção
```

## Rotas e recursos relacionados

| Endereço | Finalidade |
| --- | --- |
| [`/`](https://ofertamatica.com.br/) | Criador de cartazes |
| [`/modelos/`](https://ofertamatica.com.br/modelos/) | Biblioteca de modelos e fundos |
| [`/formatos/`](https://ofertamatica.com.br/formatos/) | Opções de tamanho e subdivisões |
| [`/como-funciona/`](https://ofertamatica.com.br/como-funciona/) | Tutorial de uso |
| [`/guias-para-varejo/`](https://ofertamatica.com.br/guias-para-varejo/) | Conteúdo de apoio |
| [Validade Zero](https://ofertamatica.com.br/validade-zero/) | Experiência relacionada de controle de vencimentos |

O produto evolui com outras experiências para o varejo, mas o **criador de cartazes continua sendo a entrada principal do site**.

## Documentação para manutenção

- [Identidade visual e diretrizes de UI](DESIGN.md)
- [Requisitos detalhados e histórico técnico](docs/README_REFERENCE_2026-10-25.md)
- [Consentimento e privacidade](docs/CONSENTIMENTO.md)
- [Auditoria de conteúdo para anúncios](docs/ADSENSE_CONTENT_REVIEW.md)
- [Integração Validade Zero](docs/VALIDADE_ZERO_INTEGRACAO.md)
- [Monitoramento](docs/MONITORAMENTO.md)

## Estado do projeto

**Aplicação web publicada e em evolução.** O foco do produto é preservar seu fluxo rápido, legibilidade dos preços, clareza das ações e confiabilidade da impressão. Alterações de design e novas funções não devem comprometer esses critérios.

---

<div align="center"><strong>Criado por <a href="https://github.com/HelioConde">Hélio Conde</a></strong></div>
