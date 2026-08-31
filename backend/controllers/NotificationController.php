<?php
// ==========================================================
// Notification Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';

class NotificationController {

    private static function formatNotification(array $n): array {
        return [
            'id' => (int)$n['id'],
            '_id' => (string)$n['id'],
            'user' => $n['user'],
            'title' => $n['title'],
            'type' => $n['type'],
            'content' => $n['content'] ?? '',
            'is_read' => (bool)$n['is_read'],
            'created_at' => $n['created_at'],
            'createdAt' => $n['created_at']
        ];
    }

    /**
     * Get all notifications for user
     */
    public static function getAll(): void {
        $user = $_GET['user'] ?? '';
        if (empty($user)) {
            sendError('User name/email is required', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT * FROM notifications WHERE user = :user ORDER BY created_at DESC");
        $stmt->execute([':user' => $user]);
        $notifications = $stmt->fetchAll();

        $formatted = array_map([self::class, 'formatNotification'], $notifications);
        sendJson($formatted);
    }

    /**
     * Mark all notifications as read
     */
    public static function markAllRead(): void {
        $data = getJsonInput();
        $user = trim($data['user'] ?? '');
        if (empty($user)) {
            sendError('User name/email is required', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE user = :user AND is_read = 0");
        $stmt->execute([':user' => $user]);

        sendJson(['message' => 'All notifications marked as read']);
    }

    /**
     * Mark single notification as read
     */
    public static function markRead(int $id): void {
        $db = Database::getConnection();

        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = :id");
        $stmt->execute([':id' => $id]);

        $fetch = $db->prepare("SELECT * FROM notifications WHERE id = :id");
        $fetch->execute([':id' => $id]);
        $notification = $fetch->fetch();

        if (!$notification) {
            sendError('Notification not found', 404);
        }

        sendJson(self::formatNotification($notification));
    }

    /**
     * Clear all notifications
     */
    public static function clearAll(): void {
        $user = $_GET['user'] ?? (getJsonInput()['user'] ?? '');
        if (empty($user)) {
            sendError('User name/email is required', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("DELETE FROM notifications WHERE user = :user");
        $stmt->execute([':user' => $user]);

        sendJson(['message' => 'All notifications cleared']);
    }
}
