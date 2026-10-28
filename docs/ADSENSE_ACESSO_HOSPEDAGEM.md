# AdSense — acesso da hospedagem por rastreadores e verificadores

## Evidência confirmada em 28/10/2026

A execução pública do GitHub Actions **Production Lighthouse** (run 40638007204, commit bcf3ba2) recebeu, em **quatro tentativas HTTP externas**, um documento com:
- `status=unexpected_content`, `title=Verificação de segurança`;
- `has_html=true`, mas `has_root=false` e `has_brand=false`;
- 4.051 bytes, mesma assinatura SHA256 nas quatro tentativas.

Isso significa que uma camada de proteção apresentou uma **página intermediária de segurança no lugar da aplicação**, inclusive com HTML que aparentava ser uma página válida. Não é uma pontuação baixa do Lighthouse: o próprio teste foi interrompido antes de medir.

**Não está provado que o Googlebot ou o AdSense tenham recebido essa resposta.** Porém, é um obstáculo real de acesso público e precisa de investigação antes de nova revisão. A verificação por outro usuário/dispositivo, pelo Search Console e pelo Google AdSense usa rotas e sistemas diferentes.

## Solicitação ao suporte da hospedagem / segurança

Informar domínio `ofertamatica.com.br`, horário aproximado **28/10/2026 às 02:26–02:27 (horário de Brasília; logs da execução em 05:26–05:27 UTC)** e URL `/`.

Pedir:
1. identificação da **regra WAF, CDN, anti-bot ou proteção HTTP** que exibiu o título `Verificação de segurança` ao verificador externo;
2. investigação do motivo do desafio para um visitante HTTP legítimo, mesmo com status 200, e confirmação de que **HTML, sitemap.xml, robots.txt, ads.txt e páginas internas** estão diretamente acessíveis ao público;
3. revisão de falsos positivos e compatibilidade com rastreadores legítimos do Google — **Googlebot, Mediapartners-Google e Google-Display-Ads-Bot** — usando verificações oficiais de autenticidade do Google, **nunca somente o texto User-Agent**;
4. preservação da proteção contra tráfego malicioso: não desabilitar o firewall inteiro, não liberar qualquer IP e não usar camuflagem de conteúdo diferente para bots;
5. confirmação do resultado e do procedimento de reteste por rede externa.

## Como retestar

- Veja a GitHub Action [Ofertamática — disponibilidade pública](https://github.com/HelioConde/ofertamatica/actions/workflows/public-crawl-health.yml), executada diariamente ou manualmente.
- Ela testa `/`, `/modelos/`, `/placas-para-hortifruti/`, `/robots.txt` e `/ads.txt`; requer respostas HTTP 200 com o conteúdo correto e detecta explicitamente `Verificação de segurança`.
- Baixe o artefato `ofertamatica-public-access` (JSON sem corpo HTML, IP ou cookies).
- Se houver novos desafios, envie o relatório e os horários ao suporte. Verifique também em **Search Console > Inspeção de URL > Testar URL publicada**, conferindo o HTML obtido.
- O status `ads.txt: Autorizado` no AdSense confirma que esse arquivo foi encontrado **na última verificação do Google**; não prova que todas as páginas e todos os rastreadores estejam acessíveis.

## Novamente no AdSense?

Só solicite nova revisão após **desaparecer a página intermediária de verificação**, confirmar as páginas internas e revisar a qualidade editorial. Nenhuma melhoria técnica garante aprovação: o AdSense continua avaliando conteúdo, originalidade, navegação e interesse legítimo. Não inventar visitantes, avaliações nem tráfego.

## Fontes do Google
- [O que fazer quando o site não estiver pronto](https://support.google.com/adsense/answer/12176698?hl=pt-BR)
- [Rastreadores do AdSense](https://support.google.com/adsense/answer/99376?hl=pt-BR)
- [Conteúdo e experiência do usuário](https://support.google.com/adsense/answer/10015918?hl=pt-BR)
