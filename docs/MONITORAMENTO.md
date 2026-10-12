# Monitoramento próprio da Ofertamática

Painel privado: \`https://ofertamatica.com.br/monitoramento/\`

O projeto usa React/Vite hospedado por FTP em Apache/Locaweb. O Vite copia \`public/api/*.php\` e \`public/monitoramento/*\` para \`dist\` e o workflow de deploy envia os arquivos. **PHP habilitado é pré-requisito**; a página não funciona apenas em hospedagem estática/GitHub Pages.

## Ativação segura na Locaweb

1. Confirme que o domínio executa PHP 7.4+ e que a conta pode criar/gravar uma pasta no mesmo nível de \`public_html\`.
2. Após um acesso com consentimento, o backend cria a pasta \`ofertamatica-stats\` **fora** de \`public_html\`. Se não conseguir, o endpoint retorna HTTP 503 e a telemetria não é coletada.
3. Crie uma senha forte própria, **não coloque a senha ou hash no GitHub**. Execute no terminal PHP de seu computador/servidor:
   \`php -r "echo password_hash('SENHA_FORTE_ESCOLHIDA', PASSWORD_DEFAULT), PHP_EOL;"\`
   Se o PHP local não estiver disponível, use um gerador confiável de bcrypt/PHP password_hash em ambiente sob seu controle, nunca um site público de hashes.
4. No gerenciador de arquivos/FTP, crie \`ofertamatica-stats/admin.password\` **fora de public_html**, contendo apenas o hash gerado (uma linha). Permissão 0600 quando possível. A conta PHP precisa conseguir ler este arquivo.
5. Acesse \`https://ofertamatica.com.br/monitoramento/\` via HTTPS. Login HTTP Basic: usuário obrigatório \`admin\`, senha forte definida acima.
6. No navegador, aceite **Estatísticas** e acesse algumas páginas. Verifique que \`/api/telemetria.php\` responde 204 à requisição POST consentida. Rejeite estatísticas e confirme que a requisição deixa de ocorrer. O painel deve indicar os números depois da primeira coleta.

O login fica **inoperante (HTTP 503)** até existir um arquivo válido. Não há senha padrão.

## Eventos e métricas

- \`page_view\`: visualização de página com consentimento.
- \`format_selected\`: escolha do formato.
- \`print_started\`, \`pdf_started\`, \`background_print_started\`: clique no fluxo de impressão/PDF, **não conclusão confirmada**.
- \`free_editor_print\`, \`free_editor_pdf\`, \`gallery_background_print\`: ações equivalentes nos editores.
- Fontes: Google, Bing, outras buscas, social, campanhas, sites externos e direto. Origem inferida por referrer e marcação UTM sem coletar URLs completas; restrições de navegadores e bloqueadores podem afetar os dados.

O painel mostra visualizações, sessões da aba (não usuários únicos), sessões de busca, páginas mais acessadas, fontes, ações e últimos 50 eventos para 7/30/90 dias. Fuso \`America/Sao_Paulo\`. Registros diários em NDJSON são removidos após aproximadamente 90 dias, em consultas ao painel e periodicamente na coleta. **Não se registram IP, user-agent bruto, conteúdo do cartaz ou URLs com parâmetros.**

## Privacidade e SEO

A coleta só inicia com \`analyticsEnabled\` verdadeiro fornecido pela escolha atual de cookies/CMP; negar ou revogar impede novas solicitações. A sessão aleatória vive apenas na aba (\`sessionStorage\`) depois do consentimento. Não há cookies de rastreamento próprios. A hospedagem poderá possuir logs técnicos independentes, conforme a política do provedor.

Medir acessos que vêm do Google é um **indicador indireto de SEO**. Impressões de pesquisa, consultas, CTR e posições não são fornecidos por esse log: consulte o Google Search Console para esses números. Não confundir tráfego pago com orgânico; marcadores \`gclid\`/UTM CPC são tratados como campanha, mas referências sem marcação podem ser ambíguas.

## Problemas comuns

- Página PHP faz download do código: **desative imediatamente essa implantação e habilite PHP no servidor.**
- HTTP 503 no coletor: pasta privada inexistente/sem permissão, ou armazenamento indisponível.
- HTTP 503 no painel: falta arquivo \`admin.password\`.
- HTTP 401: senha incorreta ou BasicAuth não transmitido pelo servidor/proxy; configure a passagem do cabeçalho Authorization no Apache.
- HTTP 404 após commit: aguarde/inspecione o workflow FTP; confirme presença de \`monitoramento/index.php\` e \`api/telemetria.php\` no \`public_html\`.
- Visitas zeradas: requisições bloqueadas, consentimento negado, JavaScript bloqueado, ou implantação incompleta.
- Segurança: envie logs apenas para o diretório privado; nunca publique o arquivo \`admin.password\` nem conceda acesso público a \`ofertamatica-stats\`.

**Próximo passo recomendado:** monitorar também métricas reais de SEO pelo Search Console (com integração segura servidor-servidor; nunca expor token do Google ao navegador).
