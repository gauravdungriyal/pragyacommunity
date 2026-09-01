<?php
// ==========================================================
// Event Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth_middleware.php';
require_once __DIR__ . '/CourseController.php';

class EventController {

    private static function formatEvent(array $e): array {
        return [
            'id' => (int)$e['id'],
            '_id' => (string)$e['id'],
            'title' => $e['title'],
            'description' => $e['description'],
            'date' => $e['date'],
            'time' => $e['time'],
            'location' => $e['location'],
            'category' => $e['category'] ?? 'Yoga Workshops',
            'course_id' => isset($e['course_id']) && $e['course_id'] !== null ? (int)$e['course_id'] : null,
            'course_name' => $e['course_name'] ?? null,
            'is_free' => (int)($e['is_free'] ?? 1),
            'amount' => (float)($e['amount'] ?? 0.00),
            'image' => $e['image'] ?? '',
            'likes_count' => (int)($e['likes_count'] ?? 0),
            'is_favorite' => (bool)($e['is_favorite'] ?? false),
            'is_registered' => (bool)($e['is_registered'] ?? false),
            'attendeesCount' => (int)($e['attendees_count'] ?? 0),
            'created_by' => isset($e['created_by']) ? (int)$e['created_by'] : null,
            'creator_name' => $e['creator_name'] ?? 'Organizer',
            'created_at' => $e['created_at'] ?? null,
            'createdAt' => $e['created_at'] ?? null
        ];
    }

    /**
     * The shared SELECT used by every event listing. Favourite and booking
     * state are resolved per viewer so the UI never has to guess.
     */
    private static function baseQuery(string $whereClause = ''): string {
        return "
            SELECT e.*, u.name AS creator_name, c.name AS course_name,
                   (f.id IS NOT NULL) AS is_favorite,
                   (r.id IS NOT NULL) AS is_registered,
                   (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) AS attendees_count
            FROM events e
            LEFT JOIN users u ON e.created_by = u.id
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN event_favorites f ON f.event_id = e.id AND f.user_id = :uid
            LEFT JOIN event_registrations r ON r.event_id = e.id AND r.user_id = :uid2
            {$whereClause}
        ";
    }

    /**
     * List events. `scope` narrows the set so the calendar never dumps
     * every session at once: upcoming (default), today, past, mine, favorites.
     */
    public static function getAll(): void {
        $viewer = currentUser();
        $viewerId = $viewer ? (int)$viewer['id'] : 0;

        $scope = strtolower($_GET['scope'] ?? 'upcoming');
        $params = [':uid' => $viewerId, ':uid2' => $viewerId];

        switch ($scope) {
            case 'today':
                $where = 'WHERE e.date = CURDATE()';
                $order = 'ORDER BY e.date ASC, e.id ASC';
                break;
            case 'past':
                $where = 'WHERE e.date < CURDATE()';
                $order = 'ORDER BY e.date DESC, e.id DESC';
                break;
            case 'mine':
                $where = 'WHERE r.id IS NOT NULL';
                $order = 'ORDER BY e.date ASC, e.id ASC';
                break;
            case 'favorites':
                $where = 'WHERE f.id IS NOT NULL';
                $order = 'ORDER BY e.date ASC, e.id ASC';
                break;
            case 'all':
                $where = '';
                $order = 'ORDER BY e.date ASC, e.id ASC';
                break;
            case 'upcoming':
            default:
                $where = 'WHERE e.date >= CURDATE()';
                $order = 'ORDER BY e.date ASC, e.id ASC';
                break;
        }

        $sql = self::baseQuery($where) . ' ' . $order;

        // Optional paging keeps long lists off a single screen
        if (isset($_GET['limit'])) {
            $limit = max(1, min(100, (int)$_GET['limit']));
            $offset = max(0, (int)($_GET['offset'] ?? 0));
            $sql .= " LIMIT {$limit} OFFSET {$offset}";
        }

        $stmt = Database::getConnection()->prepare($sql);
        $stmt->execute($params);

        sendJson(array_map([self::class, 'formatEvent'], $stmt->fetchAll()));
    }

    /**
     * One event, for its own detail page.
     */
    public static function getOne(int $id): void {
        $viewer = currentUser();
        $viewerId = $viewer ? (int)$viewer['id'] : 0;

        $stmt = Database::getConnection()->prepare(self::baseQuery('WHERE e.id = :id'));
        $stmt->execute([':uid' => $viewerId, ':uid2' => $viewerId, ':id' => $id]);
        $event = $stmt->fetch();

        if (!$event) {
            sendError('Event not found', 404);
        }

        sendJson(self::formatEvent($event));
    }

    /**
     * Every event the caller has booked.
     */
    public static function getMyRegistrations(): void {
        $user = requireUser();

        $stmt = Database::getConnection()->prepare(
            self::baseQuery('WHERE r.id IS NOT NULL') . ' ORDER BY e.date ASC'
        );
        $stmt->execute([':uid' => $user['id'], ':uid2' => $user['id']]);

        sendJson(array_map([self::class, 'formatEvent'], $stmt->fetchAll()));
    }

    /**
     * Create event
     */
    public static function create(): void {
        $staff = requireStaff();
        $data = getJsonInput();
        $title = trim($data['title'] ?? '');
        $description = trim($data['description'] ?? '');
        $date = trim($data['date'] ?? '');
        $time = trim($data['time'] ?? '');
        $location = trim($data['location'] ?? '');
        $category = trim($data['category'] ?? 'Yoga Workshops');
        $isFree = isset($data['is_free']) ? (int)$data['is_free'] : 1;
        $amount = isset($data['amount']) ? (float)$data['amount'] : 0.00;
        $image = trim($data['image'] ?? '');
        $courseId = !empty($data['course_id']) ? (int)$data['course_id'] : null;
        $createdBy = (int)$staff['id'];

        if (empty($title) || empty($date) || empty($time) || empty($location)) {
            sendError('title, date, time, and location are required', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("
            INSERT INTO events (title, description, date, time, location, category, course_id, is_free, amount, image, created_by)
            VALUES (:title, :description, :date, :time, :location, :category, :course_id, :is_free, :amount, :image, :created_by)
        ");
        $stmt->execute([
            ':title' => $title,
            ':description' => $description,
            ':date' => $date,
            ':time' => $time,
            ':location' => $location,
            ':category' => $category,
            ':course_id' => $courseId,
            ':is_free' => $isFree,
            ':amount' => $amount,
            ':image' => $image,
            ':created_by' => $createdBy
        ]);

        $eventId = (int)$db->lastInsertId();

        $fetch = $db->prepare(self::baseQuery('WHERE e.id = :id'));
        $fetch->execute([':uid' => $createdBy, ':uid2' => $createdBy, ':id' => $eventId]);

        ActivityLog::record($createdBy, 'event', 'Published event: ' . $title, '/events/' . $eventId);

        sendJson([
            'message' => 'Event Created Successfully',
            'event' => self::formatEvent($fetch->fetch())
        ], 201);
    }

    /**
     * Book a place on an event. Booking is idempotent — a second call
     * reports the existing booking instead of duplicating it.
     */
    public static function register(): void {
        $user = requireUser();
        $data = getJsonInput();
        $eventId = intval($data['event_id'] ?? 0);
        $userId = (int)$user['id'];

        if ($eventId <= 0) {
            sendError('event_id is required', 400);
        }

        $db = Database::getConnection();

        $eventStmt = $db->prepare("SELECT id, title FROM events WHERE id = :id");
        $eventStmt->execute([':id' => $eventId]);
        $event = $eventStmt->fetch();
        if (!$event) {
            sendError('Event not found', 404);
        }

        $check = $db->prepare("SELECT id FROM event_registrations WHERE event_id = :event_id AND user_id = :user_id");
        $check->execute([':event_id' => $eventId, ':user_id' => $userId]);
        $existing = $check->fetch();

        if ($existing) {
            sendJson([
                'status' => true,
                'already_registered' => true,
                'message' => 'You are already booked on this session',
                'registration' => [
                    'id' => (int)$existing['id'],
                    'event_id' => $eventId,
                    'user_id' => $userId
                ]
            ]);
        }

        $stmt = $db->prepare("INSERT INTO event_registrations (event_id, user_id) VALUES (:event_id, :user_id)");
        $stmt->execute([':event_id' => $eventId, ':user_id' => $userId]);
        $regId = (int)$db->lastInsertId();

        // Confirmations are delivered in-app so the booking is traceable
        $notify = $db->prepare("
            INSERT INTO notifications (user, user_id, title, type, scope, content, link, is_read)
            VALUES (:user, :user_id, :title, 'event', 'individual', :content, :link, 0)
        ");
        $notify->execute([
            ':user' => $user['name'],
            ':user_id' => $userId,
            ':title' => 'Booking confirmed: ' . $event['title'],
            ':content' => 'Your place on "' . $event['title'] . '" is confirmed. See the event page for joining details.',
            ':link' => '/events/' . $eventId
        ]);

        ActivityLog::record($userId, 'booking', 'Booked: ' . $event['title'], '/events/' . $eventId);

        sendJson([
            'status' => true,
            'already_registered' => false,
            'message' => 'Event Registered Successfully',
            'registration' => [
                'id' => $regId,
                'event_id' => $eventId,
                'user_id' => $userId
            ]
        ], 201);
    }

    /**
     * Cancel a booking.
     */
    public static function cancelRegistration(int $eventId): void {
        $user = requireUser();
        $db = Database::getConnection();

        $stmt = $db->prepare("DELETE FROM event_registrations WHERE event_id = :eid AND user_id = :uid");
        $stmt->execute([':eid' => $eventId, ':uid' => $user['id']]);

        if ($stmt->rowCount() === 0) {
            sendError('You do not have a booking for this event', 404);
        }

        sendJson(['status' => true, 'message' => 'Booking cancelled']);
    }

    /**
     * Delete an event (staff only).
     */
    public static function delete(int $id): void {
        requireStaff();
        $db = Database::getConnection();

        $stmt = $db->prepare("DELETE FROM events WHERE id = :id");
        $stmt->execute([':id' => $id]);

        sendJson(['message' => 'Event deleted successfully']);
    }
}
