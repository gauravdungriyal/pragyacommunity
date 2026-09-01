<?php
// ==========================================================
// Admin Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth_middleware.php';

class AdminController {

    /**
     * Get all registered users
     */
    public static function getUsers(): void {
        $db = Database::getConnection();

        $stmt = $db->query("SELECT id, id AS _id, name, email, role, bio, created_at, updated_at FROM users ORDER BY created_at DESC");
        $users = $stmt->fetchAll();

        $formatted = array_map(function($u) {
            $u['id'] = (int)$u['id'];
            $u['_id'] = (string)$u['id'];
            return $u;
        }, $users);

        sendJson($formatted);
    }

    /**
     * Delete user
     */
    public static function deleteUser(int $id): void {
        $db = Database::getConnection();

        $stmt = $db->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute([':id' => $id]);

        sendJson(['message' => 'User Deleted Successfully']);
    }

    /**
     * Get system stats
     */
    public static function getStats(): void {
        $db = Database::getConnection();

        $users = (int)$db->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $posts = (int)$db->query("SELECT COUNT(*) FROM posts")->fetchColumn();
        $comments = (int)$db->query("SELECT COUNT(*) FROM comments")->fetchColumn();
        $events = (int)$db->query("SELECT COUNT(*) FROM events")->fetchColumn();

        sendJson([
            'users' => $users,
            'posts' => $posts,
            'comments' => $comments,
            'events' => $events
        ]);
    }

    /**
     * Get administrative reports
     */
    public static function getReports(): void {
        $db = Database::getConnection();

        $totalUsers = (int)$db->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $totalPosts = (int)$db->query("SELECT COUNT(*) FROM posts")->fetchColumn();
        $totalComments = (int)$db->query("SELECT COUNT(*) FROM comments")->fetchColumn();
        $totalEvents = (int)$db->query("SELECT COUNT(*) FROM events")->fetchColumn();

        sendJson([
            'totalUsers' => $totalUsers,
            'totalPosts' => $totalPosts,
            'totalComments' => $totalComments,
            'totalEvents' => $totalEvents
        ]);
    }

    /**
     * Delete post by Admin
     */
    public static function deletePost(int $id): void {
        $db = Database::getConnection();

        $stmt = $db->prepare("DELETE FROM posts WHERE id = :id");
        $stmt->execute([':id' => $id]);

        sendJson(['message' => 'Post Deleted Successfully']);
    }

    /**
     * Delete comment by Admin
     */
    public static function deleteComment(int $id): void {
        $db = Database::getConnection();

        $stmt = $db->prepare("DELETE FROM comments WHERE id = :id");
        $stmt->execute([':id' => $id]);

        sendJson(['message' => 'Comment Deleted Successfully']);
    }

    /**
     * Send an announcement. `target` is either "all" for a platform-wide
     * broadcast or "user" to reach a single member.
     */
    public static function broadcast(): void {
        $sender = requireAdmin();
        $data = getJsonInput();
        $title = trim($data['title'] ?? '');
        $message = trim($data['message'] ?? '');
        $target = strtolower(trim($data['target'] ?? 'all'));
        $targetUserId = (int)($data['user_id'] ?? 0);

        if (empty($title) || empty($message)) {
            sendError('Title and message are required', 400);
        }

        $db = Database::getConnection();

        if ($target === 'user') {
            if ($targetUserId <= 0) {
                sendError('user_id is required when sending to a single member', 400);
            }
            $lookup = $db->prepare("SELECT id, name FROM users WHERE id = :id");
            $lookup->execute([':id' => $targetUserId]);
            $recipients = array_filter([$lookup->fetch()]);
            if (empty($recipients)) {
                sendError('Recipient not found', 404);
            }
            $scope = 'individual';
        } else {
            $recipients = $db->query("SELECT id, name FROM users")->fetchAll();
            $scope = 'all';
        }

        $stmt = $db->prepare("
            INSERT INTO notifications (user, user_id, sender_id, title, type, scope, content, link, is_read)
            VALUES (:user, :user_id, :sender_id, :title, 'system', :scope, :content, :link, 0)
        ");

        foreach ($recipients as $r) {
            $stmt->execute([
                ':user' => $r['name'],
                ':user_id' => (int)$r['id'],
                ':sender_id' => (int)$sender['id'],
                ':title' => $title,
                ':scope' => $scope,
                ':content' => $message,
                ':link' => $data['link'] ?? null
            ]);
        }

        sendJson([
            'status' => true,
            'message' => $scope === 'all'
                ? 'Announcement sent to all ' . count($recipients) . ' members'
                : 'Announcement sent to ' . ($recipients[array_key_first($recipients)]['name'] ?? 'the member'),
            'recipients' => count($recipients)
        ]);
    }
}
