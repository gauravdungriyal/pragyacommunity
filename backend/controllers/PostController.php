<?php
// ==========================================================
// Post & Comment Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';

class PostController {

    /**
     * Get all posts with author details and nested comments
     */
    public static function getAll(): void {
        $db = Database::getConnection();

        $query = "
            SELECT 
                p.id,
                p.id AS _id,
                p.user_id,
                p.content,
                p.image,
                p.category,
                p.likes,
                p.created_at,
                p.updated_at,
                u.name AS user_name,
                u.role AS user_role,
                u.email AS user_email
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        ";
        $stmt = $db->query($query);
        $posts = $stmt->fetchAll();

        if (empty($posts)) {
            sendJson([]);
        }

        // Fetch all comments for these posts in one efficient query
        $postIds = array_column($posts, 'id');
        $inClause = implode(',', array_map('intval', $postIds));

        $commentsQuery = "
            SELECT 
                c.id,
                c.id AS _id,
                c.post_id,
                c.user_id,
                c.comment_text,
                c.created_at,
                c.updated_at,
                u.name AS user_name,
                u.role AS user_role
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.post_id IN ($inClause)
            ORDER BY c.created_at ASC
        ";
        $commentsStmt = $db->query($commentsQuery);
        $comments = $commentsStmt->fetchAll();

        // Group comments by post_id
        $commentsByPost = [];
        foreach ($comments as $c) {
            $postId = $c['post_id'];
            $formattedComment = [
                'id' => (int)$c['id'],
                '_id' => (string)$c['id'],
                'post_id' => (int)$c['post_id'],
                'user_id' => [
                    'id' => (int)$c['user_id'],
                    '_id' => (string)$c['user_id'],
                    'name' => $c['user_name'] ?? 'User',
                    'role' => $c['user_role'] ?? 'Student'
                ],
                'comment_text' => $c['comment_text'],
                'created_at' => $c['created_at'],
                'createdAt' => $c['created_at'],
                'updated_at' => $c['updated_at']
            ];
            $commentsByPost[$postId][] = $formattedComment;
        }

        // Format posts output matching frontend expectation
        $result = [];
        foreach ($posts as $p) {
            $postId = $p['id'];
            $result[] = [
                'id' => (int)$p['id'],
                '_id' => (string)$p['id'],
                'content' => $p['content'],
                'image' => $p['image'] ?? '',
                'category' => $p['category'] ?? 'Yoga & Asana',
                'likes' => (int)($p['likes'] ?? 0),
                'created_at' => $p['created_at'],
                'createdAt' => $p['created_at'],
                'updated_at' => $p['updated_at'],
                'user_id' => [
                    'id' => (int)$p['user_id'],
                    '_id' => (string)$p['user_id'],
                    'name' => $p['user_name'] ?? 'Anonymous',
                    'role' => $p['user_role'] ?? 'Student',
                    'email' => $p['user_email'] ?? ''
                ],
                'comments' => $commentsByPost[$postId] ?? []
            ];
        }

        sendJson($result);
    }

    /**
     * Create a new post
     */
    public static function create(): void {
        $data = getJsonInput();
        $userId = intval($data['user_id'] ?? 0);
        $content = trim($data['content'] ?? '');
        $image = trim($data['image'] ?? '');
        $category = trim($data['category'] ?? 'Yoga & Asana');

        if ($userId <= 0 || empty($content)) {
            sendError('user_id and content are required', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("
            INSERT INTO posts (user_id, content, image, category, likes)
            VALUES (:user_id, :content, :image, :category, 0)
        ");
        $stmt->execute([
            ':user_id' => $userId,
            ':content' => $content,
            ':image' => $image,
            ':category' => $category
        ]);

        $postId = (int)$db->lastInsertId();

        // Retrieve created post with user info
        $fetch = $db->prepare("
            SELECT p.*, u.name as user_name, u.role as user_role
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = :id
        ");
        $fetch->execute([':id' => $postId]);
        $post = $fetch->fetch();

        sendJson([
            'id' => $postId,
            '_id' => (string)$postId,
            'content' => $post['content'],
            'image' => $post['image'] ?? '',
            'category' => $post['category'] ?? 'Yoga & Asana',
            'likes' => (int)$post['likes'],
            'created_at' => $post['created_at'],
            'createdAt' => $post['created_at'],
            'user_id' => [
                'id' => (int)$post['user_id'],
                '_id' => (string)$post['user_id'],
                'name' => $post['user_name'],
                'role' => $post['user_role']
            ],
            'comments' => []
        ], 201);
    }

    /**
     * Edit an existing post
     */
    public static function edit(int $id): void {
        $data = getJsonInput();
        $content = trim($data['content'] ?? '');
        $image = isset($data['image']) ? trim($data['image']) : null;
        $category = isset($data['category']) ? trim($data['category']) : null;

        if (empty($content)) {
            sendError('Content is required', 400);
        }

        $db = Database::getConnection();

        $updates = ['content = :content'];
        $params = [':content' => $content, ':id' => $id];

        if ($image !== null) {
            $updates[] = 'image = :image';
            $params[':image'] = $image;
        }
        if ($category !== null) {
            $updates[] = 'category = :category';
            $params[':category'] = $category;
        }

        $sql = "UPDATE posts SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        $fetch = $db->prepare("SELECT * FROM posts WHERE id = :id");
        $fetch->execute([':id' => $id]);
        $post = $fetch->fetch();

        if (!$post) {
            sendError('Post not found', 404);
        }

        sendJson([
            'id' => (int)$post['id'],
            '_id' => (string)$post['id'],
            'content' => $post['content'],
            'image' => $post['image'] ?? '',
            'category' => $post['category'] ?? 'Yoga & Asana',
            'likes' => (int)$post['likes'],
            'created_at' => $post['created_at'],
            'updated_at' => $post['updated_at']
        ]);
    }

    /**
     * Delete post
     */
    public static function delete(int $id): void {
        $db = Database::getConnection();

        $stmt = $db->prepare("DELETE FROM posts WHERE id = :id");
        $stmt->execute([':id' => $id]);

        sendJson(['message' => 'Post Deleted Successfully']);
    }

    /**
     * Like or unlike a post
     */
    public static function toggleLike(int $id): void {
        $data = getJsonInput();
        $action = $data['action'] ?? 'like';

        $db = Database::getConnection();

        if ($action === 'unlike') {
            $stmt = $db->prepare("UPDATE posts SET likes = GREATEST(0, likes - 1) WHERE id = :id");
        } else {
            $stmt = $db->prepare("UPDATE posts SET likes = likes + 1 WHERE id = :id");
        }
        $stmt->execute([':id' => $id]);

        $fetch = $db->prepare("SELECT likes FROM posts WHERE id = :id");
        $fetch->execute([':id' => $id]);
        $post = $fetch->fetch();

        if (!$post) {
            sendError('Post not found', 404);
        }

        sendJson([
            'likes' => (int)$post['likes'],
            'isLiked' => $action !== 'unlike'
        ]);
    }

    /**
     * Add comment to post
     */
    public static function addComment(): void {
        $data = getJsonInput();
        $postId = intval($data['post_id'] ?? 0);
        $userId = intval($data['user_id'] ?? 0);
        $commentText = trim($data['comment_text'] ?? '');

        if ($postId <= 0 || $userId <= 0 || empty($commentText)) {
            sendError('post_id, user_id and comment_text are required', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("
            INSERT INTO comments (post_id, user_id, comment_text)
            VALUES (:post_id, :user_id, :comment_text)
        ");
        $stmt->execute([
            ':post_id' => $postId,
            ':user_id' => $userId,
            ':comment_text' => $commentText
        ]);

        $commentId = (int)$db->lastInsertId();

        $fetch = $db->prepare("
            SELECT c.*, u.name as user_name, u.role as user_role
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = :id
        ");
        $fetch->execute([':id' => $commentId]);
        $comment = $fetch->fetch();

        sendJson([
            'id' => $commentId,
            '_id' => (string)$commentId,
            'post_id' => (int)$comment['post_id'],
            'comment_text' => $comment['comment_text'],
            'created_at' => $comment['created_at'],
            'createdAt' => $comment['created_at'],
            'user_id' => [
                'id' => (int)$comment['user_id'],
                '_id' => (string)$comment['user_id'],
                'name' => $comment['user_name'],
                'role' => $comment['user_role']
            ]
        ], 201);
    }

    /**
     * Delete comment
     */
    public static function deleteComment(int $id): void {
        $db = Database::getConnection();

        $stmt = $db->prepare("DELETE FROM comments WHERE id = :id");
        $stmt->execute([':id' => $id]);

        sendJson(['message' => 'Comment Deleted Successfully']);
    }
}
