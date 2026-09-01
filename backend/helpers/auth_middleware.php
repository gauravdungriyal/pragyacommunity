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

/**
 * Resolve the full user row for the caller's token, or null when unauthenticated.
 * The token may carry an id, an email, or both depending on which login issued it.
 */
function currentUser(): ?array {
    static $cached = false;
    static $user = null;

    if ($cached) {
        return $user;
    }
    $cached = true;

    $payload = getAuthUser();
    if (!$payload) {
        return null;
    }

    require_once __DIR__ . '/../config/db.php';
    $db = Database::getConnection();

    if (!empty($payload['id'])) {
        $stmt = $db->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => (int)$payload['id']]);
        $user = $stmt->fetch() ?: null;
    }

    if (!$user && !empty($payload['email'])) {
        $stmt = $db->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $payload['email']]);
        $user = $stmt->fetch() ?: null;
    }

    return $user;
}

/**
 * Resolve the caller's user row, refusing the request when there is none.
 */
function requireUser(): array {
    $user = currentUser();
    if (!$user) {
        sendError('Authentication required', 401);
    }
    return $user;
}

/**
 * Resolve the caller's user row and require an Admin role.
 */
function requireAdmin(): array {
    $user = requireUser();
    if (strcasecmp($user['role'] ?? '', 'Admin') !== 0) {
        sendError('Administrator access required', 403);
    }
    return $user;
}

/**
 * Resolve the caller and require a role that may manage course content.
 */
function requireStaff(): array {
    $user = requireUser();
    $role = strtolower($user['role'] ?? '');
    if (!in_array($role, ['admin', 'mentor', 'teacher'], true)) {
        sendError('Mentor or administrator access required', 403);
    }
    return $user;
}
