<?php
// ==========================================================
// Pragya Connect - REST API Entry Point & Front Controller
// PHP & MySQL Backend
// ==========================================================

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/helpers/response.php';

// Apply CORS & handle preflight OPTIONS
handleCors();

// Autoload / Require Controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/PostController.php';
require_once __DIR__ . '/controllers/EventController.php';
require_once __DIR__ . '/controllers/MentorController.php';
require_once __DIR__ . '/controllers/MessageController.php';
require_once __DIR__ . '/controllers/NotificationController.php';
require_once __DIR__ . '/controllers/ResourceController.php';
require_once __DIR__ . '/controllers/ProfileController.php';
require_once __DIR__ . '/controllers/AdminController.php';
require_once __DIR__ . '/controllers/DashboardController.php';

// Normalize Request Path & Method
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$rawUri = $_SERVER['REQUEST_URI'] ?? '/';
$parsedUrl = parse_url($rawUri, PHP_URL_PATH);

// Clean path (strip subfolder path if running inside a subdirectory like /Pragya-Connect/backend-php/)
$path = $parsedUrl;

// If /api is anywhere in the path, strip everything before /api
if (($apiPos = strpos($path, '/api')) !== false) {
    $path = substr($path, $apiPos);
}

// Remove trailing slashes (except root '/')
if (strlen($path) > 1 && substr($path, -1) === '/') {
    $path = rtrim($path, '/');
}

// ==========================================================
// API Routing Table
// ==========================================================

// Action-based protocol (frontend posts to /api_v2.php or /api.php) → api.php dispatcher
if ($path === '/api_v2.php' || $path === '/api.php') {
    require __DIR__ . '/api.php';
    exit;
}

// Health Check
if ($path === '/api/health' || $path === '/api') {
    sendJson([
        'status' => 'ok',
        'engine' => 'PHP (PDO MySQL)',
        'timestamp' => date('c'),
        'service' => 'Pragya Connect Backend API'
    ]);
}

// 1. Authentication Routes
if ($requestMethod === 'POST' && $path === '/api/auth/register') {
    AuthController::register();
}
if ($requestMethod === 'POST' && $path === '/api/auth/login') {
    AuthController::login();
}

// 2. Post & Comment Routes
if ($requestMethod === 'GET' && $path === '/api/posts') {
    PostController::getAll();
}
if ($requestMethod === 'POST' && $path === '/api/posts/create') {
    PostController::create();
}
if ($requestMethod === 'PUT' && preg_match('#^/api/posts/edit/(\d+)$#', $path, $matches)) {
    PostController::edit((int)$matches[1]);
}
if ($requestMethod === 'DELETE' && preg_match('#^/api/posts/delete/(\d+)$#', $path, $matches)) {
    PostController::delete((int)$matches[1]);
}
if ($requestMethod === 'PUT' && preg_match('#^/api/posts/like/(\d+)$#', $path, $matches)) {
    PostController::toggleLike((int)$matches[1]);
}
if ($requestMethod === 'POST' && $path === '/api/posts/comment') {
    PostController::addComment();
}
if ($requestMethod === 'DELETE' && preg_match('#^/api/posts/comment/(\d+)$#', $path, $matches)) {
    PostController::deleteComment((int)$matches[1]);
}

// 3. Event Routes
if ($requestMethod === 'GET' && ($path === '/api/events' || $path === '/api/events/calendar')) {
    EventController::getAll();
}
if ($requestMethod === 'POST' && $path === '/api/events/create') {
    EventController::create();
}
if ($requestMethod === 'POST' && $path === '/api/events/register') {
    EventController::register();
}

// 4. Mentor Routes
if ($requestMethod === 'GET' && $path === '/api/mentors') {
    MentorController::getAll();
}

// 5. Message / Chat Routes
if ($requestMethod === 'GET' && $path === '/api/messages/history') {
    MessageController::getHistory();
}
if ($requestMethod === 'GET' && $path === '/api/messages/conversations') {
    MessageController::getConversations();
}
if ($requestMethod === 'POST' && $path === '/api/messages/send') {
    MessageController::send();
}
if ($requestMethod === 'PUT' && $path === '/api/messages/read') {
    MessageController::markRead();
}
if ($requestMethod === 'PUT' && preg_match('#^/api/messages/edit/(\d+)$#', $path, $matches)) {
    MessageController::edit((int)$matches[1]);
}
if ($requestMethod === 'DELETE' && preg_match('#^/api/messages/delete/(\d+)$#', $path, $matches)) {
    MessageController::delete((int)$matches[1]);
}
if ($requestMethod === 'PUT' && preg_match('#^/api/messages/pin/(\d+)$#', $path, $matches)) {
    MessageController::togglePin((int)$matches[1]);
}
if ($requestMethod === 'PUT' && preg_match('#^/api/messages/star/(\d+)$#', $path, $matches)) {
    MessageController::toggleStar((int)$matches[1]);
}
if ($requestMethod === 'PUT' && preg_match('#^/api/messages/react/(\d+)$#', $path, $matches)) {
    MessageController::react((int)$matches[1]);
}

// 6. Notification Routes
if ($requestMethod === 'GET' && $path === '/api/notifications') {
    NotificationController::getAll();
}
if ($requestMethod === 'PUT' && $path === '/api/notifications/read-all') {
    NotificationController::markAllRead();
}
if ($requestMethod === 'PUT' && preg_match('#^/api/notifications/read/(\d+)$#', $path, $matches)) {
    NotificationController::markRead((int)$matches[1]);
}
if ($requestMethod === 'DELETE' && $path === '/api/notifications/clear-all') {
    NotificationController::clearAll();
}

// 7. Resource Routes
if ($requestMethod === 'GET' && $path === '/api/resources') {
    ResourceController::getAll();
}
if ($requestMethod === 'POST' && $path === '/api/resources/create') {
    ResourceController::create();
}
if ($requestMethod === 'PUT' && preg_match('#^/api/resources/(\d+)$#', $path, $matches)) {
    ResourceController::update((int)$matches[1]);
}
if ($requestMethod === 'DELETE' && preg_match('#^/api/resources/(\d+)$#', $path, $matches)) {
    ResourceController::delete((int)$matches[1]);
}

// 8. Profile Routes
if ($requestMethod === 'GET' && preg_match('#^/api/profile/(\d+)$#', $path, $matches)) {
    ProfileController::getProfile((int)$matches[1]);
}
if ($requestMethod === 'PUT' && preg_match('#^/api/profile/(\d+)$#', $path, $matches)) {
    ProfileController::updateProfile((int)$matches[1]);
}

// 9. Admin Routes
if ($requestMethod === 'GET' && $path === '/api/admin/users') {
    AdminController::getUsers();
}
if ($requestMethod === 'DELETE' && preg_match('#^/api/admin/user/(\d+)$#', $path, $matches)) {
    AdminController::deleteUser((int)$matches[1]);
}
if ($requestMethod === 'GET' && $path === '/api/admin/stats') {
    AdminController::getStats();
}
if ($requestMethod === 'GET' && $path === '/api/admin/reports') {
    AdminController::getReports();
}
if ($requestMethod === 'DELETE' && preg_match('#^/api/admin/post/(\d+)$#', $path, $matches)) {
    AdminController::deletePost((int)$matches[1]);
}
if ($requestMethod === 'DELETE' && preg_match('#^/api/admin/comment/(\d+)$#', $path, $matches)) {
    AdminController::deleteComment((int)$matches[1]);
}
if ($requestMethod === 'POST' && $path === '/api/admin/broadcast') {
    AdminController::broadcast();
}

// 10. Dashboard Routes
if ($requestMethod === 'GET' && ($path === '/api/dashboard/quote' || $path === '/api/dashboard')) {
    DashboardController::getDailyQuote();
}

// 404 Fallback for unmatched API routes
sendError("API route [{$requestMethod}] {$path} not found", 404);
