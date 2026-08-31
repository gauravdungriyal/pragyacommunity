<?php
// ==========================================================
// Standard JSON Response & Request Helpers
// Pragya Connect PHP Backend
// ==========================================================

/**
 * Send JSON response and terminate script
 */
function sendJson(mixed $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Send JSON error response and terminate script
 */
function sendError(string $message, int $statusCode = 400, mixed $details = null): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    $payload = [
        'status' => false,
        'message' => $message
    ];
    if ($details !== null) {
        $payload['details'] = $details;
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Parse JSON request body
 */
function getJsonInput(): array {
    $rawInput = file_get_contents('php://input');
    if (empty($rawInput)) {
        return $_POST;
    }
    $decoded = json_decode($rawInput, true);
    if (!is_array($decoded)) {
        return $_POST;
    }
    return $decoded;
}
