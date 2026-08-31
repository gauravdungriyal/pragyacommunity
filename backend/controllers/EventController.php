<?php
// ==========================================================
// Event Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';

class EventController {

    /**
     * Get all events / calendar
     */
    public static function getAll(): void {
        $db = Database::getConnection();

        $stmt = $db->query("
            SELECT e.*, e.id AS _id, u.name AS creator_name 
            FROM events e
            LEFT JOIN users u ON e.created_by = u.id
            ORDER BY e.date ASC
        ");
        $events = $stmt->fetchAll();

        // Format event models
        $formatted = array_map(function($e) {
            return [
                'id' => (int)$e['id'],
                '_id' => (string)$e['id'],
                'title' => $e['title'],
                'description' => $e['description'],
                'date' => $e['date'],
                'time' => $e['time'],
                'location' => $e['location'],
                'category' => $e['category'] ?? 'Yoga Workshops',
                'is_free' => (int)($e['is_free'] ?? 1),
                'amount' => (float)($e['amount'] ?? 0.00),
                'image' => $e['image'] ?? '',
                'likes_count' => (int)($e['likes_count'] ?? 0),
                'created_by' => (int)$e['created_by'],
                'creator_name' => $e['creator_name'] ?? 'Organizer',
                'created_at' => $e['created_at'],
                'createdAt' => $e['created_at']
            ];
        }, $events);

        sendJson($formatted);
    }

    /**
     * Create event
     */
    public static function create(): void {
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
        $createdBy = intval($data['created_by'] ?? 1);

        if (empty($title) || empty($date) || empty($time) || empty($location)) {
            sendError('title, date, time, and location are required', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("
            INSERT INTO events (title, description, date, time, location, category, is_free, amount, image, created_by)
            VALUES (:title, :description, :date, :time, :location, :category, :is_free, :amount, :image, :created_by)
        ");
        $stmt->execute([
            ':title' => $title,
            ':description' => $description,
            ':date' => $date,
            ':time' => $time,
            ':location' => $location,
            ':category' => $category,
            ':is_free' => $isFree,
            ':amount' => $amount,
            ':image' => $image,
            ':created_by' => $createdBy
        ]);

        $eventId = (int)$db->lastInsertId();

        $fetch = $db->prepare("SELECT e.*, u.name AS creator_name FROM events e LEFT JOIN users u ON e.created_by = u.id WHERE e.id = :id");
        $fetch->execute([':id' => $eventId]);
        $event = $fetch->fetch();

        sendJson([
            'message' => 'Event Created Successfully',
            'event' => [
                'id' => $eventId,
                '_id' => (string)$eventId,
                'title' => $event['title'],
                'description' => $event['description'],
                'date' => $event['date'],
                'time' => $event['time'],
                'location' => $event['location'],
                'category' => $event['category'] ?? 'Yoga Workshops',
                'is_free' => (int)($event['is_free'] ?? 1),
                'amount' => (float)($event['amount'] ?? 0.00),
                'image' => $event['image'] ?? '',
                'created_by' => (int)$event['created_by'],
                'creator_name' => $event['creator_name'] ?? 'Organizer',
                'created_at' => $event['created_at']
            ]
        ], 201);
    }

    /**
     * Register for event
     */
    public static function register(): void {
        $data = getJsonInput();
        $eventId = intval($data['event_id'] ?? 0);
        $userId = intval($data['user_id'] ?? 0);

        if ($eventId <= 0 || $userId <= 0) {
            sendError('event_id and user_id are required', 400);
        }

        $db = Database::getConnection();

        // Check if already registered
        $check = $db->prepare("SELECT id FROM event_registrations WHERE event_id = :event_id AND user_id = :user_id");
        $check->execute([':event_id' => $eventId, ':user_id' => $userId]);
        $existing = $check->fetch();

        if ($existing) {
            sendJson([
                'message' => 'Already registered for this event',
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

        sendJson([
            'message' => 'Event Registered Successfully',
            'registration' => [
                'id' => $regId,
                'event_id' => $eventId,
                'user_id' => $userId
            ]
        ], 201);
    }
}
