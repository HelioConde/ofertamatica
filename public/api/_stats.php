<?php
declare(strict_types=1);

/**
 * Ofertamática - telemetria própria. Nunca armazenar dados no public_html.
 * Requer PHP 7.4+ com suporte a arquivos e permissões de gravação no diretório pai.
 */
date_default_timezone_set('America/Sao_Paulo');

function stats_dir(): ?string {
    $root = realpath((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''));
    if (!$root) return null;
    $path = dirname($root) . DIRECTORY_SEPARATOR . 'ofertamatica-stats';
    if (!is_dir($path) && !@mkdir($path, 0700, true) && !is_dir($path)) return null;
    if (!is_writable($path)) return null;
    return $path;
}

function stats_json(int $status, array $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    header('X-Robots-Tag: noindex, nofollow');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function stats_password_file(): ?string {
    $dir = stats_dir();
    return $dir ? $dir . '/admin.password' : null;
}

function stats_require_admin(): void {
    header('Cache-Control: private, no-store');
    header('X-Robots-Tag: noindex, nofollow');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer');
    $file = stats_password_file();
    if (!$file || !is_file($file)) {
        http_response_code(503);
        header('Content-Type: text/plain; charset=utf-8');
        echo "Monitoramento ainda não configurado. Crie o arquivo privado admin.password conforme docs/MONITORAMENTO.md.";
        exit;
    }
    $hash = trim((string) @file_get_contents($file));
    $password = $_SERVER['PHP_AUTH_PW'] ?? null;
    if ($password === null) {
        $auth = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
        if (stripos($auth, 'Basic ') === 0) {
            $plain = base64_decode(substr($auth, 6), true);
            if ($plain !== false && strpos($plain, ':') !== false) $password = substr($plain, strpos($plain, ':') + 1);
        }
    }
    if (!is_string($password) || !password_verify($password, $hash)) {
        header('WWW-Authenticate: Basic realm="Ofertamatica - painel privado", charset="UTF-8"');
        http_response_code(401);
        header('Content-Type: text/plain; charset=utf-8');
        echo "Acesso restrito ao administrador.";
        exit;
    }
}

function stats_clean_old_files(string $dir): void {
    $min = date('Y-m-d', strtotime('-89 days'));
    foreach (glob($dir . '/20??-??-??.ndjson') ?: [] as $file) {
        $day = basename($file, '.ndjson');
        if (preg_match('/^20\d{2}-\d{2}-\d{2}$/', $day) && $day < $min) @unlink($file);
    }
}

function stats_report(int $days): array {
    $dir = stats_dir();
    if (!$dir) stats_json(503, ['error' => 'Armazenamento privado indisponível']);
    stats_clean_old_files($dir);
    $days = in_array($days, [7, 30, 90], true) ? $days : 7;
    $daily = [];
    $pages = [];
    $sources = [];
    $actions = [];
    $recent = [];
    $sessions = [];
    $searchSessions = [];
    $totalViews = 0;
    $totalActions = 0;

    for ($offset = $days - 1; $offset >= 0; $offset--) {
        $day = date('Y-m-d', strtotime("-$offset days"));
        $daily[$day] = ['date' => $day, 'views' => 0, 'sessions' => 0, 'search' => 0, 'actions' => 0];
        $file = $dir . '/' . $day . '.ndjson';
        if (!is_file($file)) continue;
        $handle = @fopen($file, 'rb');
        if (!$handle) continue;
        while (($line = fgets($handle, 2048)) !== false) {
            $row = json_decode($line, true);
            if (!is_array($row) || ($row['date'] ?? '') !== $day) continue;
            $event = (string) ($row['event'] ?? '');
            $session = (string) ($row['session'] ?? '');
            $source = (string) ($row['source'] ?? 'Direto');
            if ($event === 'page_view') {
                $daily[$day]['views']++;
                $totalViews++;
                $path = (string) ($row['path'] ?? '/');
                $pages[$path] = ($pages[$path] ?? 0) + 1;
                $sources[$source] = ($sources[$source] ?? 0) + 1;
                if ($session !== '' && !isset($sessions[$day][$session])) {
                    $sessions[$day][$session] = true;
                    $daily[$day]['sessions']++;
                    if ($source === 'Google' || $source === 'Bing' || $source === 'Outras buscas') {
                        $searchSessions[$day][$session] = true;
                        $daily[$day]['search']++;
                    }
                }
            } else {
                $daily[$day]['actions']++;
                $totalActions++;
                $actions[$event] = ($actions[$event] ?? 0) + 1;
            }
            $recent[] = [
                'at' => (string) ($row['at'] ?? ''),
                'event' => $event,
                'path' => (string) ($row['path'] ?? '/'),
                'source' => $source
            ];
            if (count($recent) > 50) array_shift($recent);
        }
        fclose($handle);
    }
    arsort($pages);
    arsort($sources);
    arsort($actions);
    $sessionCount = array_sum(array_column(array_values($daily), 'sessions'));
    $searchCount = array_sum(array_column(array_values($daily), 'search'));
    return [
        'period' => $days,
        'timezone' => 'America/Sao_Paulo',
        'updatedAt' => date(DATE_ATOM),
        'views' => $totalViews,
        'sessions' => $sessionCount,
        'searchSessions' => $searchCount,
        'searchShare' => $sessionCount ? round($searchCount * 100 / $sessionCount, 1) : 0,
        'actionsCount' => $totalActions,
        'days' => array_values($daily),
        'pages' => array_slice(array_map(static fn($k, $v) => ['path' => $k, 'views' => $v], array_keys($pages), array_values($pages)), 0, 15),
        'sources' => array_map(static fn($k, $v) => ['name' => $k, 'views' => $v], array_keys($sources), array_values($sources)),
        'actions' => array_map(static fn($k, $v) => ['event' => $k, 'count' => $v], array_keys($actions), array_values($actions)),
        'recent' => array_reverse($recent)
    ];
}
