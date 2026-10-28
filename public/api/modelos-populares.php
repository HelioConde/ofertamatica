<?php
declare(strict_types=1);
require __DIR__ . '/_stats.php';

// Somente totais agregados. Nunca devolve sessão, origem, IP ou eventos individuais.
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') stats_json(405, ['error' => 'Método não permitido']);
$dir = stats_dir();
if (!$dir) stats_json(503, ['error' => 'Armazenamento privado indisponível']);
$cache = $dir . '/model-popularity-public-v1.json';
$ttl = 900;
if (is_file($cache) && (time() - (int) filemtime($cache)) < $ttl) {
    $cached = @file_get_contents($cache);
    if ($cached !== false && json_decode($cached, true) !== null) {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: public, max-age=300');
        echo $cached;
        exit;
    }
}
$seen = [];
$counts = [];
// Observa até 30 dias de escolhas com consentimento analítico.
// Deduplicação por sessão e modelo em todo o período, para não favorecer cliques repetidos.
for ($offset = 0; $offset < 30; $offset++) {
    $day = date('Y-m-d', strtotime("-$offset days"));
    $file = $dir . '/' . $day . '.ndjson';
    if (!is_file($file)) continue;
    $handle = @fopen($file, 'rb');
    if (!$handle) continue;
    while (($line = fgets($handle, 2048)) !== false) {
        $entry = json_decode($line, true);
        if (!is_array($entry) || ($entry['date'] ?? '') !== $day || ($entry['event'] ?? '') !== 'model_selected') continue;
        $id = (string) ($entry['model_id'] ?? '');
        $session = (string) ($entry['session'] ?? '');
        if (!preg_match('/^[a-z0-9][a-z0-9-]{0,47}$/D', $id)
            || !preg_match('/^[a-f0-9]{24,40}$/D', $session)
            || isset($seen[$id][$session])) continue;
        $seen[$id][$session] = true;
        $counts[$id] = ($counts[$id] ?? 0) + 1;
    }
    fclose($handle);
}
// Abaixo do limiar não há dado público nem selo de popularidade.
$counts = array_filter($counts, static fn($n) => $n >= 5);
arsort($counts);
$payload = json_encode([
    'periodDays' => 30,
    'minSessions' => 5,
    'counts' => (object) $counts
], JSON_UNESCAPED_UNICODE);
if ($payload === false) stats_json(503, ['error' => 'Falha na agregação']);
@file_put_contents($cache, $payload, LOCK_EX);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');
echo $payload;
