<?php
// ==========================================================
// Dashboard Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth_middleware.php';

class DashboardController {

    private static array $quotes = [
        [
            'quote' => 'Yoga is the journey of the self, through the self, to the self.',
            'author' => 'The Bhagavad Gita'
        ],
        [
            'quote' => 'Yoga does not just change the way we see things, it transforms the person who sees.',
            'author' => 'B.K.S. Iyengar'
        ],
        [
            'quote' => 'Calming the mind is yoga. Not just standing on the head.',
            'author' => 'Swami Satchidananda'
        ],
        [
            'quote' => 'Undisturbed calmness of mind is attained by cultivating friendliness toward the happy, compassion for the unhappy, delight in the virtuous, and indifference toward the wicked.',
            'author' => 'Patanjali (Yoga Sutras)'
        ],
        [
            'quote' => 'The body benefits from movement, and the mind benefits from stillness.',
            'author' => 'Sakyong Mipham'
        ]
    ];

    /**
     * Get Daily Quote
     */
    public static function getDailyQuote(): void {
        // Deterministic daily quote based on the day of the year
        $dayIndex = (int)date('z') % count(self::$quotes);
        $selected = self::$quotes[$dayIndex];

        sendJson([
            'success' => true,
            'quote' => $selected['quote'],
            'author' => $selected['author']
        ]);
    }

    /**
     * Everything the dashboard needs in one request: the member's own classes
     * for today, their enrolled courses, their recent activity and their
     * personal counters. Deliberately carries no community feed content —
     * the feed is its own page.
     */
    public static function getSummary(): void {
        $user = requireUser();
        $userId = (int)$user['id'];
        $db = Database::getConnection();

        // 1. Today's classes — only sessions this member has actually booked
        $todayStmt = $db->prepare("
            SELECT e.id, e.title, e.time, e.location, e.category, e.date,
                   c.name AS course_name, u.name AS instructor_name
            FROM event_registrations r
            INNER JOIN events e ON e.id = r.event_id
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN users u ON e.created_by = u.id
            WHERE r.user_id = :uid AND e.date = CURDATE()
            ORDER BY e.time ASC
        ");
        $todayStmt->execute([':uid' => $userId]);
        $todayClasses = array_map(function ($e) {
            return [
                'id' => (int)$e['id'],
                '_id' => (string)$e['id'],
                'title' => $e['title'],
                'time' => $e['time'],
                'date' => $e['date'],
                'location' => $e['location'],
                'category' => $e['category'],
                'course_name' => $e['course_name'],
                'instructor_name' => $e['instructor_name'] ?? 'Pragya Faculty'
            ];
        }, $todayStmt->fetchAll());

        // 2. Next booked sessions after today
        $upcomingStmt = $db->prepare("
            SELECT e.id, e.title, e.date, e.time, e.location, e.category
            FROM event_registrations r
            INNER JOIN events e ON e.id = r.event_id
            WHERE r.user_id = :uid AND e.date > CURDATE()
            ORDER BY e.date ASC, e.time ASC
            LIMIT 3
        ");
        $upcomingStmt->execute([':uid' => $userId]);
        $upcoming = array_map(function ($e) {
            return [
                'id' => (int)$e['id'],
                '_id' => (string)$e['id'],
                'title' => $e['title'],
                'date' => $e['date'],
                'time' => $e['time'],
                'location' => $e['location'],
                'category' => $e['category']
            ];
        }, $upcomingStmt->fetchAll());

        // 3. Enrolled courses
        $coursesStmt = $db->prepare("
            SELECT c.id, c.name, u.name AS mentor_name,
                   (SELECT COUNT(*) FROM resources r WHERE r.course_id = c.id) AS resource_count
            FROM course_enrollments ce
            INNER JOIN courses c ON c.id = ce.course_id
            LEFT JOIN users u ON c.mentor_id = u.id
            WHERE ce.user_id = :uid
            ORDER BY c.name ASC
        ");
        $coursesStmt->execute([':uid' => $userId]);
        $courses = array_map(function ($c) {
            return [
                'id' => (int)$c['id'],
                'name' => $c['name'],
                'mentor_name' => $c['mentor_name'] ?? 'Pragya Faculty',
                'resource_count' => (int)$c['resource_count']
            ];
        }, $coursesStmt->fetchAll());

        // 4. Recent activity trail
        $activityStmt = $db->prepare("
            SELECT id, type, description, link, created_at
            FROM activity_log
            WHERE user_id = :uid
            ORDER BY created_at DESC, id DESC
            LIMIT 8
        ");
        $activityStmt->execute([':uid' => $userId]);
        $activity = array_map(function ($a) {
            return [
                'id' => (int)$a['id'],
                'type' => $a['type'],
                'description' => $a['description'],
                'link' => $a['link'],
                'created_at' => $a['created_at'],
                'createdAt' => $a['created_at']
            ];
        }, $activityStmt->fetchAll());

        // 5. Personal counters
        $counter = function (string $sql) use ($db, $userId): int {
            $stmt = $db->prepare($sql);
            $stmt->execute([':uid' => $userId]);
            return (int)$stmt->fetchColumn();
        };

        $stats = [
            'courses' => count($courses),
            'bookings' => $counter("SELECT COUNT(*) FROM event_registrations WHERE user_id = :uid"),
            'attended' => $counter("
                SELECT COUNT(*) FROM event_registrations r
                INNER JOIN events e ON e.id = r.event_id
                WHERE r.user_id = :uid AND e.date < CURDATE()
            "),
            'resources' => $counter("
                SELECT COUNT(*) FROM resources r
                WHERE r.course_id IS NULL
                   OR r.course_id IN (SELECT course_id FROM course_enrollments WHERE user_id = :uid)
            "),
            'posts' => $counter("SELECT COUNT(*) FROM posts WHERE user_id = :uid"),
            'unread_notifications' => $counter("SELECT COUNT(*) FROM notifications WHERE user_id = :uid AND is_read = 0")
        ];

        sendJson([
            'status' => true,
            'user' => [
                'id' => (string)$user['id'],
                'name' => $user['name'],
                'role' => $user['role']
            ],
            'today_classes' => $todayClasses,
            'upcoming_classes' => $upcoming,
            'courses' => $courses,
            'recent_activity' => $activity,
            'stats' => $stats
        ]);
    }
}
