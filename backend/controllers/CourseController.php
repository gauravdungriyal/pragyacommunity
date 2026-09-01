<?php
// ==========================================================
// Course Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth_middleware.php';

class CourseController {

    private static function formatCourse(array $c): array {
        return [
            'id' => (int)$c['id'],
            '_id' => (string)$c['id'],
            'name' => $c['name'],
            'description' => $c['description'] ?? '',
            'mentor_id' => isset($c['mentor_id']) ? (int)$c['mentor_id'] : null,
            'mentor_name' => $c['mentor_name'] ?? null,
            'is_enrolled' => isset($c['is_enrolled']) ? (bool)$c['is_enrolled'] : false,
            'member_count' => isset($c['member_count']) ? (int)$c['member_count'] : 0,
            'created_at' => $c['created_at'] ?? null,
            'createdAt' => $c['created_at'] ?? null
        ];
    }

    /**
     * All courses, flagged with whether the caller is enrolled.
     */
    public static function getAll(): void {
        $user = currentUser();
        $userId = $user ? (int)$user['id'] : 0;

        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT c.*, u.name AS mentor_name,
                   (e.id IS NOT NULL) AS is_enrolled,
                   (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) AS member_count
            FROM courses c
            LEFT JOIN users u ON c.mentor_id = u.id
            LEFT JOIN course_enrollments e ON e.course_id = c.id AND e.user_id = :uid
            ORDER BY c.name ASC
        ");
        $stmt->execute([':uid' => $userId]);

        sendJson(array_map([self::class, 'formatCourse'], $stmt->fetchAll()));
    }

    /**
     * Only the courses the caller is enrolled in.
     * Mentors and admins also see the courses they teach.
     */
    public static function getMine(): void {
        $user = requireUser();
        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT c.*, u.name AS mentor_name, 1 AS is_enrolled,
                   (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) AS member_count
            FROM courses c
            LEFT JOIN users u ON c.mentor_id = u.id
            WHERE c.id IN (SELECT course_id FROM course_enrollments WHERE user_id = :uid)
               OR c.mentor_id = :uid2
            ORDER BY c.name ASC
        ");
        $stmt->execute([':uid' => $user['id'], ':uid2' => $user['id']]);

        sendJson(array_map([self::class, 'formatCourse'], $stmt->fetchAll()));
    }

    /**
     * Create a course (mentors and admins).
     */
    public static function create(): void {
        $staff = requireStaff();
        $data = getJsonInput();

        $name = trim($data['name'] ?? '');
        $description = trim($data['description'] ?? '');
        $mentorId = !empty($data['mentor_id']) ? (int)$data['mentor_id'] : (int)$staff['id'];

        if ($name === '') {
            sendError('Course name is required', 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO courses (name, description, mentor_id) VALUES (:name, :description, :mentor_id)");
        $stmt->execute([':name' => $name, ':description' => $description, ':mentor_id' => $mentorId]);

        $courseId = (int)$db->lastInsertId();
        $fetch = $db->prepare("
            SELECT c.*, u.name AS mentor_name, 0 AS is_enrolled, 0 AS member_count
            FROM courses c LEFT JOIN users u ON c.mentor_id = u.id WHERE c.id = :id
        ");
        $fetch->execute([':id' => $courseId]);

        sendJson(self::formatCourse($fetch->fetch()), 201);
    }

    /**
     * Delete a course (admins only).
     */
    public static function delete(int $id): void {
        requireAdmin();

        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM courses WHERE id = :id");
        $stmt->execute([':id' => $id]);

        sendJson(['message' => 'Course deleted successfully']);
    }

    /**
     * Join or leave a course.
     */
    public static function toggleEnrollment(int $id): void {
        $user = requireUser();
        $db = Database::getConnection();

        $check = $db->prepare("SELECT id FROM courses WHERE id = :id");
        $check->execute([':id' => $id]);
        if (!$check->fetch()) {
            sendError('Course not found', 404);
        }

        $existing = $db->prepare("SELECT id FROM course_enrollments WHERE course_id = :cid AND user_id = :uid");
        $existing->execute([':cid' => $id, ':uid' => $user['id']]);

        if ($existing->fetch()) {
            $del = $db->prepare("DELETE FROM course_enrollments WHERE course_id = :cid AND user_id = :uid");
            $del->execute([':cid' => $id, ':uid' => $user['id']]);
            sendJson(['enrolled' => false, 'message' => 'Left the course']);
        }

        $ins = $db->prepare("INSERT INTO course_enrollments (course_id, user_id) VALUES (:cid, :uid)");
        $ins->execute([':cid' => $id, ':uid' => $user['id']]);

        ActivityLog::record((int)$user['id'], 'course', 'Enrolled in a course', '/resources');

        sendJson(['enrolled' => true, 'message' => 'Enrolled in the course'], 201);
    }

    /**
     * Members enrolled in a course, used by the group chat header.
     */
    public static function getMembers(int $id): void {
        requireUser();
        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT u.id, u.name, u.role, u.avatar
            FROM course_enrollments ce
            INNER JOIN users u ON u.id = ce.user_id
            WHERE ce.course_id = :cid
            ORDER BY u.name ASC
        ");
        $stmt->execute([':cid' => $id]);

        $members = array_map(function ($m) {
            return [
                'id' => (int)$m['id'],
                '_id' => (string)$m['id'],
                'name' => $m['name'],
                'role' => $m['role'],
                'avatar' => $m['avatar'] ?? 'default.jpg'
            ];
        }, $stmt->fetchAll());

        sendJson($members);
    }
}

/**
 * Small append-only trail used by the dashboard's recent activity panel.
 */
class ActivityLog {
    public static function record(int $userId, string $type, string $description, ?string $link = null): void {
        if ($userId <= 0) {
            return;
        }
        try {
            $db = Database::getConnection();
            $stmt = $db->prepare("
                INSERT INTO activity_log (user_id, type, description, link)
                VALUES (:uid, :type, :description, :link)
            ");
            $stmt->execute([
                ':uid' => $userId,
                ':type' => $type,
                ':description' => mb_substr($description, 0, 255),
                ':link' => $link
            ]);
        } catch (Throwable $e) {
            // Activity tracking must never break the request that triggered it
        }
    }
}
