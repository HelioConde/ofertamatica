<?php
declare(strict_types=1);
require __DIR__ . '/_stats.php';

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') stats_json(405, ['error' => 'Método não permitido']);

$host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
$host = preg_replace('/:\d+$/', '', $host);
if (!in_array($host, ['ofertamatica.com.br', 'www.ofertamatica.com.br', 'localhost', '127.0.0.1'], true)) {
    stats_json(403, ['error' => 'Host inválido']);
}
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origin && !in_array(strtolower(rtrim($origin, '/')), [
    'https://ofertamatica.com.br', 'https://www.ofertamatica.com.br',
    'http://localhost:5173', 'http://127.0.0.1:5173'
], true)) stats_json(403, ['error' => 'Origem inválida']);
if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? 'same-origin') !== 'same-origin') {
    stats_json(403, ['error' => 'Somente origem local']);
}
if (stripos((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json') !== 0) stats_json(415, ['error' => 'Formato inválido']);
$size = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($size > 1536) stats_json(413, ['error' => 'Corpo excedeu o limite']);
$raw = file_get_contents('php://input', false, null, 0, 1537);
if ($raw === false || strlen($raw) > 1536) stats_json(413, ['error' => 'Corpo excedeu o limite']);
$data = json_decode($raw, true);
if (!is_array($data) || ($data['consented'] ?? false) !== true) stats_json(400, ['error' => 'Consentimento ausente']);
if (preg_match('/bot|crawler|spider|headless|lighthouse|pagespeed|curl|wget|python-requests|playwright/i', (string) ($_SERVER['HTTP_USER_AGENT'] ?? ''))) {
    http_response_code(204);
    exit;
}
$allowed = [
    'page_view', 'format_selected',
    'print_started', 'pdf_started', 'background_print_started',
    'free_editor_print', 'free_editor_pdf', 'gallery_background_print',
    'model_selected'
];
$event = (string) ($data['event'] ?? '');
if (!in_array($event, $allowed, true)) stats_json(400, ['error' => 'Evento inválido']);
$path = (string) ($data['path'] ?? '/');
if (!preg_match('#^/[a-zA-Z0-9/_-]{0,120}$#D', $path) || strpos($path, '/monitoramento') === 0 || strpos($path, '/api/') === 0) {
    stats_json(400, ['error' => 'Página inválida']);
}
$source = (string) ($data['source'] ?? '');
if (!in_array($source, ['Direto', 'Google', 'Bing', 'Outras buscas', 'Redes sociais', 'Campanha', 'Outros sites'], true)) $source = 'Direto';
$session = (string) ($data['session'] ?? '');
if (!preg_match('/^[a-f0-9]{24,40}$/D', $session)) stats_json(400, ['error' => 'Sessão inválida']);
$modelId = '';
if ($event === 'model_selected') {
    $modelId = (string) ($data['model_id'] ?? '');
    if (!preg_match('/^[a-z0-9][a-z0-9-]{0,47}$/D', $modelId)) stats_json(400, ['error' => 'Modelo inválido']);
}
$dir = stats_dir();
if (!$dir) stats_json(503, ['error' => 'Registro indisponível: armazenamento privado']);
$file = $dir . '/' . date('Y-m-d') . '.ndjson';
$entry = [
    'date' => date('Y-m-d'),
    'at' => date(DATE_ATOM),
    'event' => $event,
    'path' => $path,
    'source' => $source,
    'session' => $session
];
if ($modelId !== '') $entry['model_id'] = $modelId;
// Não persistimos IP, identificador de usuário, URL completa, produto ou user-agent.
if (is_file($file) && filesize($file) > 50 * 1024 * 1024) stats_json(503, ['error' => 'Limite diário de registros']);
$result = @file_put_contents($file, json_encode($entry, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
if ($result === false) stats_json(503, ['error' => 'Falha ao registrar']);
if (random_int(1, 100) === 1) stats_clean_old_files($dir);
http_response_code(204);
