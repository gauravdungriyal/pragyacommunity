<?php
// ==========================================================
// Admin Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';

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
     * Broadcast notification to all users
     */
    public static function broadcast(): void {
        $data = getJsonInput();
        $title = trim($data['title'] ?? '');
        $message = trim($data['message'] ?? '');

        if (empty($title) || empty($message)) {
            sendError('Title and message are required', 400);
        }

        $db = Database::getConnection();
        $users = $db->query("SELECT name FROM users")->fetchAll(PDO::FETCH_COLUMN);

        $stmt = $db->prepare("INSERT INTO notifications (user, title, type, content, is_read) VALUES (:user, :title, 'system', :content, 0)");
        foreach ($users as $userName) {
            $stmt->execute([':user' => $userName, ':title' => $title, ':content' => $message]);
        }

        sendJson(['status' => true, 'message' => 'Broadcast sent to all users']);
    }
}
