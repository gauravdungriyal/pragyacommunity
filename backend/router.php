<?php
// ==========================================================
// PHP Built-in Server Router
// Pragya Connect PHP Backend
//
// Usage: php -S 0.0.0.0:5000 router.php
// ==========================================================

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$filePath = __DIR__ . $uri;

// If a real static file exists, serve it directly
if ($uri !== '/' && file_exists($filePath) && !is_dir($filePath)) {
    return false;
}

// Otherwise forward all requests to the front controller index.php
require_once __DIR__ . '/index.php';
