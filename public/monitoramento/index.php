<?php
declare(strict_types=1);
require __DIR__ . '/../api/_stats.php';
stats_require_admin();
header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="referrer" content="no-referrer">
<title>Monitoramento privado | Ofertamática</title>
<link rel="icon" href="/icons/favicon-32.png">
<style>
:root{color-scheme:light;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;color:#18243b;background:#f3f6fd}
*{box-sizing:border-box}body{margin:0}a{color:#255dd6;text-decoration:none}
header{background:#14274d;color:white;padding:25px max(20px,calc((100vw - 1180px)/2));display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
header a{color:#dce8ff}header strong{font-size:23px;letter-spacing:-.5px}header span{font-size:12px;color:#bdcce8}
main{max-width:1180px;margin:28px auto 70px;padding:0 20px}
h1{font-size:28px;letter-spacing:-.8px;margin:0 0 8px}h2{font-size:17px;margin:0 0 15px}
p{color:#5e6980}.filters{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:22px 0}
button{cursor:pointer;font:inherit;border:1px solid #b9c9e6;border-radius:11px;background:#fff;padding:10px 16px;color:#24375e}
button[aria-pressed="true"]{background:#255dd6;border-color:#255dd6;color:#fff}
.cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:13px}
.card,.panel{background:#fff;border:1px solid #e1e8f4;border-radius:16px;box-shadow:0 2px 10px #1b395005;padding:20px}
.card small{display:block;color:#65758e;font-size:12px}.card strong{display:block;font-size:29px;margin:12px 0 3px;font-variant-numeric:tabular-nums}.card em{font-size:12px;color:#6b7690;font-style:normal}
.panel{margin-top:16px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.bars{min-height:180px;display:flex;align-items:flex-end;gap:3px;border-bottom:1px solid #e0e8f4;padding:12px 0 0}
.bar{flex:1;min-width:2px;background:#3972e9;border-radius:4px 4px 0 0;opacity:.85}
.bar.search{background:#e48a22}
.legend{display:flex;gap:18px;font-size:12px;color:#67748b;margin-top:14px}.dot{height:9px;width:9px;display:inline-block;margin-right:6px;border-radius:50%;background:#3972e9}.dot.orange{background:#e48a22}
.list{display:grid;gap:12px}.line{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;font-size:14px}
.line .name{overflow-wrap:anywhere}.line strong{font-variant-numeric:tabular-nums}.meter{height:6px;margin:5px 0 0;background:#e8effc;border-radius:100px;overflow:hidden}.meter span{height:100%;background:#3972e9;display:block}
table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;color:#65758e;font-weight:600}td,th{padding:10px;border-bottom:1px solid #edf1f8}td{overflow-wrap:anywhere}
.note{font-size:13px;line-height:1.6}.status{border-radius:8px;padding:11px 13px;background:#fff2de;color:#755010;margin:14px 0;display:none}
@media(max-width:890px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}.columns{grid-template-columns:1fr}}
@media(max-width:480px){.cards{grid-template-columns:1fr 1fr}.card{padding:13px}.card strong{font-size:23px}h1{font-size:24px}table{font-size:11px}td,th{padding:8px 4px}}
</style>
<script src="/monitoramento/painel.js" defer></script>
</head>
<body>
<header><div><strong>Ofertamática <span>MONITORAMENTO</span></strong><div><span>Área administrativa privada · horário de Brasília</span></div></div><a href="/">← Voltar ao site</a></header>
<main>
<h1>Visitas, origens e resultados</h1>
<p>Telemetria própria baseada nas sessões que autorizaram estatísticas. Sem Google Analytics.</p>
<div class="filters"><div id="periods"><button data-days="7" aria-pressed="true">7 dias</button> <button data-days="30" aria-pressed="false">30 dias</button> <button data-days="90" aria-pressed="false">90 dias</button></div><span id="updated">Carregando registros...</span></div>
<div class="status" id="status" role="status"></div>
<section class="cards" aria-label="Indicadores">
<div class="card"><small>Visualizações de páginas</small><strong id="views">—</strong><em>Páginas carregadas</em></div>
<div class="card"><small>Sessões registradas</small><strong id="sessions">—</strong><em>Não são pessoas únicas</em></div>
<div class="card"><small>Sessões de busca</small><strong id="search">—</strong><em>Google, Bing e outras buscas</em></div>
<div class="card"><small>Participação de buscas</small><strong id="share">—</strong><em>Entre sessões com consentimento</em></div>
<div class="card"><small>Ações iniciadas</small><strong id="actionsCount">—</strong><em>Impressão, PDF e formato</em></div>
</section>
<section class="panel"><h2>Evolução diária de visitas</h2><div id="graph" class="bars" role="img" aria-label="Gráfico de visitas por dia"></div><div class="legend"><span><i class="dot"></i>Cada coluna representa visualizações; passe o mouse para ver também sessões de busca.</span></div></section>
<div class="columns">
<section class="panel"><h2>Páginas mais visitadas</h2><div id="pages" class="list"></div></section>
<section class="panel"><h2>Origem das visitas</h2><div id="sources" class="list"></div></section>
<section class="panel"><h2>Ações no gerador</h2><div id="actions" class="list"></div></section>
<section class="panel"><h2>Últimos eventos (sem identificação pessoal)</h2><div style="overflow-x:auto"><table><thead><tr><th>Data</th><th>Evento</th><th>Página</th><th>Origem</th></tr></thead><tbody id="recent"></tbody></table></div></section>
</div>
<section class="panel note"><h2>Como interpretar seu SEO</h2>
<p><b>O Google está trazendo visitantes?</b> Compare as sessões com origem Google ao longo das semanas e as páginas de entrada. O tráfego de buscas é um sinal positivo, não uma prova isolada de melhoria no ranking.</p>
<p><b>Quais palavras-chave e posições no Google?</b> Esses dados não são visíveis no navegador. Para impressões, CTR, consultas e posição média, o Search Console continua sendo a fonte apropriada. O painel não substitui essas métricas.</p>
<p><b>Privacidade:</b> registramos página, categoria de origem, evento, horário e sessão aleatória da aba, sem gravar IP, endereço de referência completo, dados de produtos ou user-agent. Dados individuais são excluídos após até 90 dias. Visitantes sem consentimento não entram na contagem. A hospedagem pode manter logs técnicos próprios.</p>
</section>
</main>
</body>
</html>
