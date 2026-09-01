<?php
// ==========================================================
// Resource Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth_middleware.php';

class ResourceController {

    private static function formatResource(array $r): array {
        return [
            'id' => (int)$r['id'],
            '_id' => (string)$r['id'],
            'title' => $r['title'],
            'description' => $r['description'] ?? '',
            'file_url' => $r['file_url'],
            'category' => $r['category'] ?? 'Yoga Guides',
            'course_id' => isset($r['course_id']) && $r['course_id'] !== null ? (int)$r['course_id'] : null,
            'course_name' => $r['course_name'] ?? null,
            // A resource with no course is general library material open to everyone
            'is_extra' => !isset($r['course_id']) || $r['course_id'] === null,
            'uploaded_by' => (int)$r['uploaded_by'],
            'author_name' => $r['author_name'] ?? 'Pragya Scholar',
            'created_at' => $r['created_at'],
            'createdAt' => $r['created_at']
        ];
    }

    /**
     * Get learning resources. Optionally filtered by course or category.
     * Each item is flagged so the library can split course material from
     * the general "extra resources" shelf.
     */
    public static function getAll(): void {
        $db = Database::getConnection();

        $where = [];
        $params = [];

        if (isset($_GET['course_id']) && $_GET['course_id'] !== '') {
            $where[] = 'r.course_id = :course_id';
            $params[':course_id'] = (int)$_GET['course_id'];
        }
        if (!empty($_GET['category'])) {
            $where[] = 'r.category = :category';
            $params[':category'] = $_GET['category'];
        }
        if (!empty($_GET['search'])) {
            $where[] = '(r.title LIKE :search OR r.description LIKE :search2)';
            $params[':search'] = '%' . $_GET['search'] . '%';
            $params[':search2'] = '%' . $_GET['search'] . '%';
        }

        $sql = "
            SELECT r.*, u.name AS author_name, c.name AS course_name
            FROM resources r
            LEFT JOIN users u ON r.uploaded_by = u.id
            LEFT JOIN courses c ON r.course_id = c.id
        ";
        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY r.created_at DESC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        sendJson(array_map([self::class, 'formatResource'], $stmt->fetchAll()));
    }

    /**
     * Admin-managed library filters.
     */
    public static function getCategories(): void {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT id, name FROM resource_categories ORDER BY name ASC");

        $categories = array_map(function ($c) {
            return ['id' => (int)$c['id'], '_id' => (string)$c['id'], 'name' => $c['name']];
        }, $stmt->fetchAll());

        sendJson($categories);
    }

    /**
     * Create a library filter (admins only).
     */
    public static function createCategory(): void {
        $admin = requireAdmin();
        $data = getJsonInput();
        $name = trim($data['name'] ?? '');

        if ($name === '') {
            sendError('Filter name is required', 400);
        }

        $db = Database::getConnection();
        $exists = $db->prepare("SELECT id FROM resource_categories WHERE name = :name");
        $exists->execute([':name' => $name]);
        if ($exists->fetch()) {
            sendError('That filter already exists', 409);
        }

        $stmt = $db->prepare("INSERT INTO resource_categories (name, created_by) VALUES (:name, :by)");
        $stmt->execute([':name' => $name, ':by' => $admin['id']]);

        sendJson([
            'id' => (int)$db->lastInsertId(),
            '_id' => (string)$db->lastInsertId(),
            'name' => $name
        ], 201);
    }

    /**
     * Delete a library filter (admins only). Resources keep their label.
     */
    public static function deleteCategory(int $id): void {
        requireAdmin();

        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM resource_categories WHERE id = :id");
        $stmt->execute([':id' => $id]);

        sendJson(['message' => 'Filter deleted successfully']);
    }

    /**
     * Create new resource
     */
    public static function create(): void {
        $staff = requireStaff();
        $data = getJsonInput();
        $title = trim($data['title'] ?? '');
        $description = trim($data['description'] ?? '');
        $fileUrl = trim($data['file_url'] ?? '');
        $category = trim($data['category'] ?? 'Yoga Guides');

        // No course means the resource lands on the general "extra resources" shelf
        $courseId = isset($data['course_id']) && $data['course_id'] !== '' && $data['course_id'] !== null
            ? (int)$data['course_id']
            : null;

        $uploadedBy = (int)$staff['id'];

        if (empty($title) || empty($fileUrl)) {
            sendError('title and file_url are required', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("
            INSERT INTO resources (title, description, file_url, category, course_id, uploaded_by)
            VALUES (:title, :description, :file_url, :category, :course_id, :uploaded_by)
        ");
        $stmt->execute([
            ':title' => $title,
            ':description' => $description,
            ':file_url' => $fileUrl,
            ':category' => $category,
            ':course_id' => $courseId,
            ':uploaded_by' => $uploadedBy
        ]);

        $resourceId = (int)$db->lastInsertId();

        $fetch = $db->prepare("
            SELECT r.*, u.name AS author_name, c.name AS course_name
            FROM resources r
            LEFT JOIN users u ON r.uploaded_by = u.id
            LEFT JOIN courses c ON r.course_id = c.id
            WHERE r.id = :id
        ");
        $fetch->execute([':id' => $resourceId]);
        $resource = $fetch->fetch();

        ActivityLog::record($uploadedBy, 'resource', 'Uploaded resource: ' . $title, '/resources');

        sendJson([
            'message' => 'Resource Created Successfully',
            'resource' => self::formatResource($resource)
        ], 201);
    }

    /**
     * Update resource
     */
    public static function update(int $id): void {
        requireStaff();
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
        $courseId = array_key_exists('course_id', $data)
            ? ($data['course_id'] === '' || $data['course_id'] === null ? null : (int)$data['course_id'])
            : $resource['course_id'];

        $stmt = $db->prepare("
            UPDATE resources
            SET title = :title, description = :description, file_url = :file_url,
                category = :category, course_id = :course_id
            WHERE id = :id
        ");
        $stmt->execute([
            ':title' => $title,
            ':description' => $description,
            ':file_url' => $fileUrl,
            ':category' => $category,
            ':course_id' => $courseId,
            ':id' => $id
        ]);

        $fetch = $db->prepare("
            SELECT r.*, u.name AS author_name, c.name AS course_name
            FROM resources r
            LEFT JOIN users u ON r.uploaded_by = u.id
            LEFT JOIN courses c ON r.course_id = c.id
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
        requireStaff();
        $db = Database::getConnection();

        $stmt = $db->prepare("DELETE FROM resources WHERE id = :id");
        $stmt->execute([':id' => $id]);

        sendJson(['message' => 'Resource Deleted Successfully']);
    }
}
