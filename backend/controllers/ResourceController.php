<?php
// ==========================================================
// Resource Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';

class ResourceController {

    private static function formatResource(array $r): array {
        return [
            'id' => (int)$r['id'],
            '_id' => (string)$r['id'],
            'title' => $r['title'],
            'description' => $r['description'] ?? '',
            'file_url' => $r['file_url'],
            'category' => $r['category'] ?? 'Yoga Guides',
            'uploaded_by' => (int)$r['uploaded_by'],
            'author_name' => $r['author_name'] ?? 'Pragya Scholar',
            'created_at' => $r['created_at'],
            'createdAt' => $r['created_at']
        ];
    }

    /**
     * Get all learning & yoga resources
     */
    public static function getAll(): void {
        $db = Database::getConnection();

        $stmt = $db->query("
            SELECT r.*, u.name AS author_name 
            FROM resources r
            LEFT JOIN users u ON r.uploaded_by = u.id
            ORDER BY r.created_at DESC
        ");
        $resources = $stmt->fetchAll();

        $formatted = array_map([self::class, 'formatResource'], $resources);
        sendJson($formatted);
    }

    /**
     * Create new resource
     */
    public static function create(): void {
        $data = getJsonInput();
        $title = trim($data['title'] ?? '');
        $description = trim($data['description'] ?? '');
        $fileUrl = trim($data['file_url'] ?? '');
        $category = trim($data['category'] ?? 'Yoga Guides');
        
        $uploadedBy = intval($data['uploaded_by'] ?? ($data['user_id'] ?? 1));
        if ($uploadedBy <= 0) {
            $uploadedBy = 1;
        }

        if (empty($title) || empty($fileUrl)) {
            sendError('title and file_url are required', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("
            INSERT INTO resources (title, description, file_url, category, uploaded_by)
            VALUES (:title, :description, :file_url, :category, :uploaded_by)
        ");
        $stmt->execute([
            ':title' => $title,
            ':description' => $description,
            ':file_url' => $fileUrl,
            ':category' => $category,
            ':uploaded_by' => $uploadedBy
        ]);

        $resourceId = (int)$db->lastInsertId();

        $fetch = $db->prepare("
            SELECT r.*, u.name AS author_name 
            FROM resources r 
            LEFT JOIN users u ON r.uploaded_by = u.id 
            WHERE r.id = :id
        ");
        $fetch->execute([':id' => $resourceId]);
        $resource = $fetch->fetch();

        sendJson([
            'message' => 'Resource Created Successfully',
            'resource' => self::formatResource($resource)
        ], 201);
    }

    /**
     * Update resource
     */
    public static function update(int $id): void {
        $data = getJsonInput();
        $db = Database::getConnection();

        $fetch = $db->prepare("SELECT * FROM resources WHERE id = :id");
        $fetch->execute([':id' => $id]);
        $resource = $fetch->fetch();

        if (!$resource) {
            sendError('Resource not found', 404);
        }

        $title = trim($data['title'] ?? $resource['title']);
        $description = trim($data['description'] ?? $resource['description']);
        $fileUrl = trim($data['file_url'] ?? $resource['file_url']);
        $category = trim($data['category'] ?? $resource['category']);

        $stmt = $db->prepare("
            UPDATE resources 
            SET title = :title, description = :description, file_url = :file_url, category = :category
            WHERE id = :id
        ");
        $stmt->execute([
            ':title' => $title,
            ':description' => $description,
            ':file_url' => $fileUrl,
            ':category' => $category,
            ':id' => $id
        ]);

        $fetch = $db->prepare("
            SELECT r.*, u.name AS author_name 
            FROM resources r 
            LEFT JOIN users u ON r.uploaded_by = u.id 
            WHERE r.id = :id
        ");
        $fetch->execute([':id' => $id]);
        $updated = $fetch->fetch();

        sendJson(self::formatResource($updated));
    }

    /**
     * Delete resource
     */
    public static function delete(int $id): void {
        $db = Database::getConnection();

        $stmt = $db->prepare("DELETE FROM resources WHERE id = :id");
        $stmt->execute([':id' => $id]);

        sendJson(['message' => 'Resource Deleted Successfully']);
    }
}
