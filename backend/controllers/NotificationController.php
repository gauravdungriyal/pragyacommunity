<?php
// ==========================================================
// Notification Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth_middleware.php';

class NotificationController {

    private static function formatNotification(array $n): array {
        return [
            'id' => (int)$n['id'],
            '_id' => (string)$n['id'],
            'user' => $n['user'],
            'user_id' => isset($n['user_id']) ? (int)$n['user_id'] : null,
            'title' => $n['title'],
            'type' => $n['type'],
            'scope' => $n['scope'] ?? 'individual',
            'course_id' => isset($n['course_id']) && $n['course_id'] !== null ? (int)$n['course_id'] : null,
            'course_name' => $n['course_name'] ?? null,
            'sender_name' => $n['sender_name'] ?? null,
            'content' => $n['content'] ?? '',
            // The UI reads `message`; `content` is kept for older API consumers.
            'message' => $n['content'] ?? '',
            'link' => $n['link'] ?? null,
            'is_read' => (bool)$n['is_read'],
            'created_at' => $n['created_at'],
            'createdAt' => $n['created_at']
        ];
    }

    /**
     * Notifications addressed to the caller, newest first.
     * Falls back to the display-name column for rows created before
     * notifications were keyed by user id.
     */
    public static function getAll(): void {
        $viewer = currentUser();
        $userName = $_GET['user'] ?? ($viewer['name'] ?? '');
        $userId = $viewer ? (int)$viewer['id'] : 0;

        if ($userId === 0 && $userName === '') {
            sendError('User name/email is required', 400);
        }

        $db = Database::getConnection();

        $limit = isset($_GET['limit']) ? max(1, min(200, (int)$_GET['limit'])) : 100;

        $stmt = $db->prepare("
            SELECT n.*, c.name AS course_name, s.name AS sender_name
            FROM notifications n
            LEFT JOIN courses c ON n.course_id = c.id
            LEFT JOIN users s ON n.sender_id = s.id
            WHERE n.user_id = :uid OR (n.user_id IS NULL AND n.user = :uname)
            ORDER BY n.created_at DESC, n.id DESC
            LIMIT {$limit}
        ");
        $stmt->execute([':uid' => $userId, ':uname' => $userName]);

        sendJson(array_map([self::class, 'formatNotification'], $stmt->fetchAll()));
    }

    /**
     * Mark all notifications as read
     */
    public static function markAllRead(): void {
        $viewer = currentUser();
        $data = getJsonInput();
        $userName = trim($data['user'] ?? ($viewer['name'] ?? ''));
        $userId = $viewer ? (int)$viewer['id'] : 0;

        if ($userId === 0 && $userName === '') {
            sendError('User name/email is required', 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("
            UPDATE notifications SET is_read = 1
            WHERE (user_id = :uid OR (user_id IS NULL AND user = :uname)) AND is_read = 0
        ");
        $stmt->execute([':uid' => $userId, ':uname' => $userName]);

        sendJson(['message' => 'All notifications marked as read']);
    }

    /**
     * Mark single notification as read
     */
    public static function markRead(int $id): void {
        $db = Database::getConnection();

        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = :id");
        $stmt->execute([':id' => $id]);

        $fetch = $db->prepare("
            SELECT n.*, c.name AS course_name, s.name AS sender_name
            FROM notifications n
            LEFT JOIN courses c ON n.course_id = c.id
            LEFT JOIN users s ON n.sender_id = s.id
            WHERE n.id = :id
        ");
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
        $viewer = currentUser();
        $userName = $_GET['user'] ?? (getJsonInput()['user'] ?? ($viewer['name'] ?? ''));
        $userId = $viewer ? (int)$viewer['id'] : 0;

        if ($userId === 0 && $userName === '') {
            sendError('User name/email is required', 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("
            DELETE FROM notifications
            WHERE user_id = :uid OR (user_id IS NULL AND user = :uname)
        ");
        $stmt->execute([':uid' => $userId, ':uname' => $userName]);

        sendJson(['message' => 'All notifications cleared']);
    }

    /**
     * Deliver a notification to every enrolled member of a course.
     * Mentors use this to reach only their own students.
     */
    public static function sendToCourse(): void {
        $sender = requireStaff();
        $data = getJsonInput();

        $courseId = (int)($data['course_id'] ?? 0);
        $title = trim($data['title'] ?? '');
        $message = trim($data['message'] ?? ($data['content'] ?? ''));

        if ($courseId <= 0 || $title === '' || $message === '') {
            sendError('course_id, title and message are required', 400);
        }

        $db = Database::getConnection();

        $courseStmt = $db->prepare("SELECT id, name FROM courses WHERE id = :id");
        $courseStmt->execute([':id' => $courseId]);
        $course = $courseStmt->fetch();
        if (!$course) {
            sendError('Course not found', 404);
        }

        $members = $db->prepare("
            SELECT u.id, u.name FROM course_enrollments ce
            INNER JOIN users u ON u.id = ce.user_id
            WHERE ce.course_id = :cid
        ");
        $members->execute([':cid' => $courseId]);
        $recipients = $members->fetchAll();

        $insert = $db->prepare("
            INSERT INTO notifications (user, user_id, sender_id, title, type, scope, course_id, content, link, is_read)
            VALUES (:user, :user_id, :sender_id, :title, 'course', 'course', :course_id, :content, :link, 0)
        ");

        foreach ($recipients as $r) {
            $insert->execute([
                ':user' => $r['name'],
                ':user_id' => (int)$r['id'],
                ':sender_id' => (int)$sender['id'],
                ':title' => $title,
                ':course_id' => $courseId,
                ':content' => $message,
                ':link' => $data['link'] ?? '/resources'
            ]);
        }

        sendJson([
            'status' => true,
            'message' => 'Notification sent to ' . count($recipients) . ' member(s) of ' . $course['name'],
            'recipients' => count($recipients)
        ], 201);
    }
}
