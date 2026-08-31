<?php
// ==========================================================
// Mentor Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';

class MentorController {

    /**
     * Get all mentors
     */
    public static function getAll(): void {
        $db = Database::getConnection();

        $query = "
            SELECT 
                u.id,
                u.id AS _id,
                u.name,
                u.email,
                u.role,
                COALESCE(m.bio, u.bio, 'Experienced instructor committed to wellness & yogic science.') AS bio,
                COALESCE(m.expertise, 'Hatha Yoga & Breathwork') AS expertise,
                COALESCE(m.availability, 'Mon-Fri (08:00 AM - 05:00 PM)') AS availability,
                COALESCE(m.rating, 4.9) AS rating,
                u.created_at
            FROM users u
            LEFT JOIN mentors m ON u.id = m.user_id
            WHERE LOWER(u.role) = 'mentor' OR LOWER(u.role) = 'teacher' OR m.id IS NOT NULL
            ORDER BY u.id ASC
        ";

        $stmt = $db->query($query);
        $mentors = $stmt->fetchAll();

        $formatted = array_map(function($m) {
            $m['id'] = (int)$m['id'];
            $m['_id'] = (string)$m['id'];
            $m['rating'] = (float)$m['rating'];
            return $m;
        }, $mentors);

        sendJson($formatted);
    }
}
