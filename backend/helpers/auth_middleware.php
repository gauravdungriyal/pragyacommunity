<?php
// ==========================================================
// Authentication Middleware
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';

function getBearerToken(): ?string {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(
            array_map('ucwords', array_keys($requestHeaders)),
            array_values($requestHeaders)
        );
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }

    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/i', $headers, $matches)) {
            return $matches[1];
        }
    }

    return null;
}

/**
 * Require valid JWT authentication.
 * Returns payload array if valid, sends 401 response and exits otherwise.
 */
function requireAuth(): array {
    $token = getBearerToken();

    if (!$token) {
        sendError('Authorization token required', 401);
    }

    $payload = JWT::decode($token);
    if (!$payload) {
        sendError('Invalid or expired authentication token', 401);
    }

    return $payload;
}

/**
 * Get optional auth payload (doesn't exit if no token)
 */
function getAuthUser(): ?array {
    $token = getBearerToken();
    if (!$token) return null;
    return JWT::decode($token);
}
