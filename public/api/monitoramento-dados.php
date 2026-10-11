<?php
declare(strict_types=1);
require __DIR__ . '/_stats.php';
stats_require_admin();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') stats_json(405, ['error' => 'Método não permitido']);
stats_json(200, stats_report((int) ($_GET['dias'] ?? 7)));
