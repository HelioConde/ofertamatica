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


## Recorrência verificada em 20/11/2026 — Home e Black Friday

A execução pública [Production Lighthouse #44734492817](https://github.com/HelioConde/ofertamatica/actions/runs/44734492817), entre **09h17 e 09h18 (horário de Brasília)**, recebeu novamente nas quatro tentativas de `/` o documento `Verificação de segurança` com **4.051 bytes**, sem a raiz do aplicativo e sem a marca. O artefato `ofertamatica-lighthouse-production` guarda quatro relatórios `production-readiness-N.json`, todos `unexpected_content`; o Lighthouse **não chegou a medir** o desempenho nessa execução.

Isso reforça que o desafio para algumas redes externas é **recorrente**, não demonstra que Googlebot recebeu essa resposta nem explica sozinho os números de indexação do Search Console. A aplicação já inclui proteção que rejeita HTML inesperado; não eliminar o alerta, não falsificar User-Agent do Google e não oferecer conteúdo diferente aos rastreadores.

A Action diária de disponibilidade pública agora inclui também **`/cartaz-black-friday/`** além de Home, Modelos, Hortifruti, robots.txt e ads.txt. É a página de campanha que precisa permanecer diretamente acessível para quem chega da busca. A resposta HTTP 200 só é considerada válida quando há o HTML real da aplicação; uma página de desafio com HTTP 200 é classificada como `security_challenge`.

**Para o suporte da hospedagem:** anexar os horários e o link da execução, solicitar identificação da regra WAF/anti-bot que substituiu o HTML e revisar falsos positivos para redes externas e rastreadores legítimos. Preservar a segurança normal da hospedagem. A validação definitiva é testar acesso externo sem desafio e inspecionar a URL publicada no Search Console.


## Falha de publicação de assets em 20/11/2026

A [Action de deploy #44738060143](https://github.com/HelioConde/ofertamatica/actions/runs/44738060143) confirmou que o **FTP encontrou os dois arquivos de entrada JS/CSS** em `public_html/assets`, mas na primeira tentativa de publicação a checagem externa respondeu **HTTP 200 com Content-Type text/html**, tanto para `/assets/index-CG_iWKh0.js` quanto para `/assets/index-50Ymrs8u.css`, durante todas as 18 tentativas. A publicação interrompeu-se **antes** de trocar o HTML principal, corretamente.

O código de checagem usava `?build-check=<timestamp>` em cada URL de asset; como o nome do arquivo já traz um hash único, esse parâmetro é desnecessário e pode acionar filtros anti-bot que um navegador comum não acionaria. A alteração proposta testa as URLs **exatamente como os navegadores solicitam** (sem parâmetros aleatórios), com `Cache-Control: no-cache`. Continua exigindo MIME JavaScript e CSS e preserva o bloqueio de deploy quando há HTML ou resposta incorreta.

Um HTTP 200 com `text/html` no caminho de um arquivo JS/CSS não basta para afirmar que o WAF foi a causa. Também pode ser uma regra de rewrite, uma página fallback ou erro de roteamento. A nova checagem classifica o corpo recebido **sem registrar HTML, cookies ou IP** para ajudar a diferenciar essas causas.

**Solicitação ao suporte, se persistir:** investigar `/assets/*.js` e `/assets/*.css`, verificar se a CDN/hospedagem entrega arquivos existentes no `public_html/assets` com MIME correto em redes externas e sem desafio de segurança; conferir regras de rewrite antes de aplicar qualquer exceção pontual. Não desligar o WAF nem alterar HTML para ignorar os erros.

A segunda tentativa da Action estava em andamento na consulta de 20/11/2026. A publicação só estará confirmada quando o job concluir com sucesso, incluindo `--assets-only`, `--html-and-assets` e verificação de SEO.
