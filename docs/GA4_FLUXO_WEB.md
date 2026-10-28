# Google Analytics 4: fluxo web da Ofertamática

## Diagnóstico em 28/10/2026
O painel do Google Analytics indicou **“A coleta de dados não está ativa”** para o fluxo web `ofertamatica`, ID de métricas **`G-K8YWSXBHS7`** (código do fluxo `14946856287`).

O repositório carregava condicionalmente o contêiner Google Tag Manager `GTM-5RGPM6HD`, mas não declarava o ID de métricas do GA4. Sem acesso à configuração publicada dentro desse contêiner, não foi possível confirmar se existia alguma tag GA4 nele. Além disso, a tag antiga só começava quando o consentimento analítico e o estado da CMP eram reconhecidos.

## O que foi feito
- A propriedade GA4 acima passa a ser configurada explicitamente via **Google tag (`gtag.js`)** ao conceder consentimento analítico válido.
- O contêiner GTM antigo deixa de iniciar automaticamente. Isso **evita dupla contagem** caso o contêiner já tivesse uma configuração GA4. **Atenção:** quaisquer outras tags que existam nesse contêiner também deixam de rodar; audite no Tag Manager antes de restaurar qualquer integração externa.
- O padrão do **Consent Mode v2 permanece negado**; o script não carrega antes do consentimento.
- O `page_view` do GA4 é enviado uma vez por caminho após consentimento e depois para mudanças reais de rota SPA, sem duplicação por `pushState` repetido.
- Eventos permitidos adicionais: `format_selected`, `print_started`, `pdf_started` e `model_selected`. Nomes de produtos, preços, listas, e-mails, IDs de sessão e URLs com query string não são enviados nesses eventos.
- Revogar estatísticas desativa a medição e recarrega a página para descartar scripts já inicializados.
- A coleta própria da Ofertamática em `/api/telemetria.php` continua separada do GA4.

## Como conferir após publicar
1. Abra `https://ofertamatica.com.br/` em uma janela anônima, sem extensões de bloqueio, e aceite explicitamente os cookies de **Estatísticas**. Não é necessário aceitar anúncios.
2. No console do navegador, rode:
   ```js
   window.ofertaAnalytics?.status()
   ```
   O resultado esperado após uma autorização **reconhecida** é `measurementId: "G-K8YWSXBHS7"`, `consented: true`, `started: true`. Se `consented: false`, confira `window.ofertaConsent?.getState()`; a política atual mantém a coleta bloqueada até a CMP informar sua aplicabilidade. **Não desative o controle de privacidade para gerar visitas artificiais.**
3. Em Rede/Network, procure `gtag/js?id=G-K8YWSXBHS7` e `g/collect`. Confirme `tid=G-K8YWSXBHS7` na requisição, sem dados pessoais. Alguns bloqueadores podem impedir as requisições.
4. No Google Analytics, abra **Relatórios > Tempo real** e navegue por duas páginas depois de consentir. As visualizações podem aparecer em minutos. Use o **Tag Assistant** (`tagassistant.google.com`) e **DebugView** se necessário.
5. Relatórios padrão e o aviso do fluxo podem levar mais tempo para atualizar (até 24–48 horas), mesmo após eventos aparecerem no Tempo real.

**Limites:** testes automáticos validam comportamento em navegador simulado, não comprovam que os servidores do Google receberam eventos reais nem garantem remoção imediata do aviso. O WAF/anti-bot da hospedagem continua sendo uma investigação separada.

## Fontes do Google
- [Resolver problemas de tags do GA4](https://support.google.com/analytics/answer/9311124?hl=pt-BR)
- [Verificar a configuração e a coleta de dados](https://developers.google.com/analytics/devguides/collection/ga4/troubleshoot?hl=pt-br)
- [Medição de visualizações de página em SPAs](https://developers.google.com/analytics/devguides/collection/ga4/views)
