<?php
// ==========================================================
// Profile Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';

class ProfileController {

    private static function formatUser(array $u): array {
        $skills = $u['skills'] ?? '[]';
        if (is_string($skills)) {
            $decoded = json_decode($skills, true);
            $skills = is_array($decoded) ? $decoded : array_filter(array_map('trim', explode(',', $skills)));
        }

        return [
            'id' => (int)$u['id'],
            '_id' => (string)$u['id'],
            'name' => $u['name'],
            'email' => $u['email'],
            'role' => $u['role'],
            'phone' => $u['phone'] ?? '',
            'avatar' => $u['avatar'] ?? 'default.jpg',
            'expertise' => $u['expertise'] ?? 'Vedic Sciences & Asana',
            'skills' => $skills,
            'bio' => $u['bio'] ?? '',
            'created_at' => $u['created_at'],
            'createdAt' => $u['created_at'],
            'updated_at' => $u['updated_at'] ?? $u['created_at']
        ];
    }

    /**
     * Get user profile by ID
     */
    public static function getProfile(int $id): void {
        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $user = $stmt->fetch();

        if (!$user) {
            sendError('User Not Found', 404);
        }

        sendJson(self::formatUser($user));
    }

    /**
     * Update user profile
     */
    public static function updateProfile(int $id): void {
        $data = getJsonInput();
        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $user = $stmt->fetch();

        if (!$user) {
            sendError('User Not Found', 404);
        }

        $name = trim($data['name'] ?? $user['name']);
        $bio = isset($data['bio']) ? trim($data['bio']) : ($user['bio'] ?? '');
        $role = trim($data['role'] ?? $user['role']);
        $phone = trim($data['phone'] ?? ($user['phone'] ?? ''));
        $expertise = trim($data['expertise'] ?? ($user['expertise'] ?? 'Vedic Sciences & Asana'));
        
        $skills = $data['skills'] ?? ($user['skills'] ?? []);
        if (is_array($skills)) {
            $skills = json_encode(array_values($skills));
        }

        $update = $db->prepare("
            UPDATE users 
            SET name = :name, bio = :bio, role = :role, phone = :phone, expertise = :expertise, skills = :skills
            WHERE id = :id
        ");
        $update->execute([
            ':name' => $name,
            ':bio' => $bio,
            ':role' => $role,
            ':phone' => $phone,
            ':expertise' => $expertise,
            ':skills' => $skills,
            ':id' => $id
        ]);

        $stmt->execute([':id' => $id]);
        $updatedUser = $stmt->fetch();

        sendJson(self::formatUser($updatedUser));
    }
}
