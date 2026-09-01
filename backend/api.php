<?php
// ==========================================================
// Pragya Connect - api.php Action Dispatcher
// Matches live action-based protocol (POST with body field 'action')
// ==========================================================

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/jwt.php';

handleCors();

$input = getJsonInput();
if (empty($input) && !empty($_POST)) {
    $input = $_POST;
}

$action = $input['action'] ?? ($_GET['action'] ?? '');

if (empty($action)) {
    sendError('Action parameter is required', 400);
}

// 1. Action: login
if ($action === 'login') {
    $email = trim($input['email'] ?? '');
    $password = trim($input['password'] ?? '');

    if (empty($email) || empty($password)) {
        sendJson(['status' => false, 'message' => 'Email and password required']);
    }

    $db = Database::getConnection();
    $stmt = $db->prepare("SELECT id, name, email, password, role FROM users WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        sendJson(['status' => false, 'message' => 'Invalid email or password']);
    }

    $tokenPayload = ['email' => $user['email'], 'id' => (int)$user['id'], 'iat' => time(), 'exp' => time() + 86400];
    $refreshPayload = ['email' => $user['email'], 'id' => (int)$user['id'], 'iat' => time(), 'exp' => time() + (300 * 86400)];

    $accessToken = JWT::encode($tokenPayload);
    $refreshToken = JWT::encode($refreshPayload);

    // The full name is returned because notifications, messages and comment
    // authorship are all matched on the user's display name.
    sendJson([
        'status' => true,
        'message' => 'Login successful',
        'access_token' => $accessToken,
        'refresh_token' => $refreshToken,
        'uid' => (string)$user['id'],
        'name' => $user['name'],
        'user' => [
            'id' => (string)$user['id'],
            '_id' => (string)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ]);
}

// 2. Action: check-token
if ($action === 'check-token') {
    $token = $input['token'] ?? '';
    $refreshToken = $input['refresh_token'] ?? '';

    if (!empty($token)) {
        $decoded = JWT::decode($token);
        if ($decoded) {
            sendJson(['status' => true, 'message' => false]);
        }
    }

    if (empty($refreshToken)) {
        if (empty($token)) {
            sendJson(['status' => false, 'message' => 'Session expired. Please sign in again.']);
        }
        sendJson(['status' => false, 'message' => 'Refresh token required']);
    }

    $decodedRefresh = JWT::decode($refreshToken);
    if (!$decodedRefresh) {
        sendJson(['status' => false, 'message' => 'Invalid or expired refresh token']);
    }

    $email = $decodedRefresh['email'] ?? '';
    $db = Database::getConnection();
    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $refreshUser = $stmt->fetch();
    if (!$refreshUser) {
        sendJson(['status' => false, 'message' => 'Account no longer exists. Please sign in again.']);
    }

    $userId = (int)$refreshUser['id'];
    $newAccess = JWT::encode(['email' => $email, 'id' => $userId, 'iat' => time(), 'exp' => time() + 86400]);
    $newRefresh = JWT::encode(['email' => $email, 'id' => $userId, 'iat' => time(), 'exp' => time() + (300 * 86400)]);

    sendJson([
        'status' => true,
        'message' => true,
        'access_token' => $newAccess,
        'refresh_token' => $newRefresh
    ]);
}

// 3. Action: reset-password
if ($action === 'reset-password') {
    $email = trim($input['email'] ?? '');
    if (empty($email)) {
        sendJson(['status' => false, 'message' => 'Can not reset password.']);
    }
    sendJson(['status' => true, 'message' => 'Reset password link sent to your email']);
}

// Token Verification for Protected Actions
$token = $input['token'] ?? '';
if (empty($token)) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
    }
}

if (empty($token)) {
    http_response_code(401);
    sendJson(['status' => false, 'message' => 'Token missing'], 401);
}

$decoded = JWT::decode($token);
if (!$decoded || empty($decoded['email'])) {
    http_response_code(401);
    sendJson(['status' => false, 'message' => 'Invalid or expired token'], 401);
}

$db = Database::getConnection();
$stmt = $db->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
$stmt->execute([':email' => $decoded['email']]);
$user = $stmt->fetch();

if (!$user) {
    sendError('User not found', 404);
}

// 4. Action: passwrod_change
if ($action === 'passwrod_change') {
    $oldPass = $input['old_pass'] ?? '';
    $newPass = $input['password'] ?? '';
    $confirm = $input['confirmpassword'] ?? '';

    if (!password_verify($oldPass, $user['password'])) {
        sendJson(['status' => false, 'message' => 'Error! Old Password is wrong. please try again.']);
    }

    if ($newPass !== $confirm) {
        sendJson(['status' => false, 'message' => 'New Password & Confirm Password should be same.']);
    }

    $hash = password_hash($newPass, PASSWORD_BCRYPT);
    $up = $db->prepare("UPDATE users SET password = :p WHERE id = :id");
    $up->execute([':p' => $hash, ':id' => $user['id']]);

    sendJson(['status' => true, 'message' => 'Your password has Successfully Changed. please login again..']);
}

// 5. Action: get-profile
if ($action === 'get-profile') {
    $nameParts = explode(' ', $user['name']);
    $fname = $nameParts[0] ?? 'User';
    $lname = $nameParts[1] ?? '';

    // Notification preferences (defaults to all-on when no row exists yet)
    $settingsStmt = $db->prepare("SELECT notify_whatsapp, notify_email, notify_push, welcome_seen FROM user_settings WHERE user_id = :id");
    $settingsStmt->execute([':id' => $user['id']]);
    $settings = $settingsStmt->fetch() ?: ['notify_whatsapp' => 1, 'notify_email' => 1, 'notify_push' => 1, 'welcome_seen' => 0];

    $bookingsStmt = $db->prepare("SELECT COUNT(*) AS cnt FROM event_registrations WHERE user_id = :id");
    $bookingsStmt->execute([':id' => $user['id']]);
    $bookings = (int)($bookingsStmt->fetch()['cnt'] ?? 0);

    $skills = $user['skills'] ?? '';
    if (is_string($skills) && $skills !== '') {
        $decodedSkills = json_decode($skills, true);
        $skills = is_array($decodedSkills)
            ? $decodedSkills
            : array_values(array_filter(array_map('trim', explode(',', $skills))));
    } else {
        $skills = [];
    }

    $coursesStmt = $db->prepare("SELECT COUNT(*) AS cnt FROM course_enrollments WHERE user_id = :id");
    $coursesStmt->execute([':id' => $user['id']]);
    $courseCount = (int)($coursesStmt->fetch()['cnt'] ?? 0);

    $postsStmt = $db->prepare("SELECT COUNT(*) AS cnt FROM posts WHERE user_id = :id");
    $postsStmt->execute([':id' => $user['id']]);
    $postCount = (int)($postsStmt->fetch()['cnt'] ?? 0);

    sendJson([
        'status' => true,
        'data' => [
            'id' => (string)$user['id'],
            'username' => explode('@', $user['email'])[0],
            'profile' => $user['avatar'] ?? 'default.jpg',
            'avatar' => $user['avatar'] ?? 'default.jpg',
            'fullname' => $user['name'],
            'name' => $user['name'],
            'fname' => $fname,
            'lname' => $lname,
            'role' => $user['role'],
            'email' => $user['email'],
            'phone' => $user['phone'] ?? '',
            'bio' => $user['bio'] ?? '',
            'expertise' => $user['expertise'] ?? '',
            'skills' => $skills,
            'enroll_date' => date('d M Y', strtotime($user['created_at'] ?? 'now')),
            'notify_whatsapp' => (string)$settings['notify_whatsapp'],
            'notify_email' => (string)$settings['notify_email'],
            'notify_push' => (string)$settings['notify_push'],
            'welcome_seen' => (int)($settings['welcome_seen'] ?? 0),
            'bookings' => (string)$bookings,
            'courses' => $courseCount,
            'posts' => $postCount
        ]
    ]);
}

// 6. Action: edit_user_details
if ($action === 'edit_user_details') {
    $fname = trim($input['fname'] ?? '');
    $lname = trim($input['lname'] ?? '');
    $newName = trim("$fname $lname");

    $fields = [];
    $params = [':id' => $user['id']];

    if ($newName !== '') {
        $fields[] = 'name = :name';
        $params[':name'] = $newName;
    }
    if (isset($input['phone'])) {
        $fields[] = 'phone = :phone';
        $params[':phone'] = trim($input['phone']);
    }
    if (isset($input['bio'])) {
        $fields[] = 'bio = :bio';
        $params[':bio'] = trim($input['bio']);
    }
    if (isset($input['expertise'])) {
        $fields[] = 'expertise = :expertise';
        $params[':expertise'] = trim($input['expertise']);
    }
    if (isset($input['skills'])) {
        $skills = $input['skills'];
        $fields[] = 'skills = :skills';
        $params[':skills'] = is_array($skills) ? json_encode(array_values($skills)) : (string)$skills;
    }

    if (!empty($fields)) {
        $up = $db->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id");
        $up->execute($params);
    }

    $fresh = $db->prepare("SELECT id, name, email, role, phone, bio, expertise, skills, avatar FROM users WHERE id = :id");
    $fresh->execute([':id' => $user['id']]);
    $updated = $fresh->fetch();

    sendJson(['status' => true, 'message' => 'Profile updated successfully', 'data' => $updated]);
}

// 6b. Action: welcome-seen — records that the one-time welcome popup was shown
if ($action === 'welcome-seen') {
    $up = $db->prepare("
        INSERT INTO user_settings (user_id, welcome_seen) VALUES (:id, 1)
        ON DUPLICATE KEY UPDATE welcome_seen = 1
    ");
    $up->execute([':id' => $user['id']]);
    sendJson(['status' => true]);
}

// 7. Action: update-notification-settings
if ($action === 'update-notification-settings') {
    $whatsapp = isset($input['notify_whatsapp']) ? (int)(bool)$input['notify_whatsapp'] : null;
    $emailPref = isset($input['notify_email']) ? (int)(bool)$input['notify_email'] : null;
    $push = isset($input['notify_push']) ? (int)(bool)$input['notify_push'] : null;

    // Load current values so a partial update keeps the untouched flags
    $stmt = $db->prepare("SELECT notify_whatsapp, notify_email, notify_push FROM user_settings WHERE user_id = :id");
    $stmt->execute([':id' => $user['id']]);
    $current = $stmt->fetch() ?: ['notify_whatsapp' => 1, 'notify_email' => 1, 'notify_push' => 1];

    $w = $whatsapp ?? (int)$current['notify_whatsapp'];
    $e = $emailPref ?? (int)$current['notify_email'];
    $p = $push ?? (int)$current['notify_push'];

    $up = $db->prepare("
        INSERT INTO user_settings (user_id, notify_whatsapp, notify_email, notify_push)
        VALUES (:id, :w, :e, :p)
        ON DUPLICATE KEY UPDATE notify_whatsapp = :w2, notify_email = :e2, notify_push = :p2
    ");
    $up->execute([
        ':id' => $user['id'],
        ':w' => $w, ':e' => $e, ':p' => $p,
        ':w2' => $w, ':e2' => $e, ':p2' => $p,
    ]);

    sendJson(['status' => true, 'message' => 'Notification settings updated successfully.']);
}

// 8. Action: emergency-contact
if ($action === 'emergency-contact') {
    $actionType = $input['action_type'] ?? 'get';

    if ($actionType === 'get') {
        $stmt = $db->prepare("SELECT id, user_id, photo, name, relation, phone FROM emergency_contacts WHERE user_id = :id ORDER BY id ASC");
        $stmt->execute([':id' => $user['id']]);
        $contacts = array_map(function ($c) {
            return [
                'id' => (string)$c['id'],
                'user_id' => (string)$c['user_id'],
                'photo' => $c['photo'],
                'name' => $c['name'],
                'relation' => $c['relation'],
                'phone' => $c['phone'],
            ];
        }, $stmt->fetchAll());
        sendJson(['status' => true, 'data' => $contacts]);
    }

    if ($actionType === 'add') {
        $name = trim($input['name'] ?? '');
        $relation = trim($input['relationship'] ?? ($input['relation'] ?? ''));
        $phone = trim($input['phone'] ?? '');

        if ($name === '' || $phone === '') {
            sendJson(['status' => false, 'message' => 'Name and phone are required']);
        }

        $ins = $db->prepare("INSERT INTO emergency_contacts (user_id, name, relation, phone) VALUES (:uid, :name, :relation, :phone)");
        $ins->execute([':uid' => $user['id'], ':name' => $name, ':relation' => $relation, ':phone' => $phone]);
        sendJson(['status' => true, 'message' => 'Contact added successfully']);
    }

    if ($actionType === 'delete') {
        $contactId = intval($input['contact_id'] ?? 0);
        $del = $db->prepare("DELETE FROM emergency_contacts WHERE id = :id AND user_id = :uid");
        $del->execute([':id' => $contactId, ':uid' => $user['id']]);
        if ($del->rowCount() === 0) {
            sendJson(['status' => false, 'message' => 'Contact not found']);
        }
        sendJson(['status' => true, 'message' => 'Contact deleted successfully']);
    }
}

// 9. Action: wallet
if ($action === 'wallet') {
    sendJson([
        'status' => true,
        'balance' => '100.00',
        'history' => [
            ['amount' => '+50', 'type' => true, 'comments' => 'Top up', 'date' => '05 Jan 2026'],
            ['amount' => '-20', 'type' => false, 'comments' => 'Booking', 'date' => '04 Jan 2026']
        ]
    ]);
}

// 10. Action: register-device-token / unregister
if ($action === 'register-device-token') {
    sendJson(['status' => true, 'message' => 'Token registered']);
}
if ($action === 'unregister-device-token') {
    sendJson(['status' => true, 'message' => 'Token removed']);
}

// 11. Action: upcoming-events
if ($action === 'upcoming-events') {
    $stmt = $db->prepare("
        SELECT e.*, e.id AS _id, u.name AS creator_name,
               (f.id IS NOT NULL) AS is_favorite
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN event_favorites f ON f.event_id = e.id AND f.user_id = :uid
        ORDER BY e.date ASC
    ");
    $stmt->execute([':uid' => $user['id']]);
    $events = $stmt->fetchAll();
    $formatted = array_map(function($e) {
        return [
            'id' => (string)$e['id'],
            '_id' => (string)$e['id'],
            'title' => $e['title'],
            'description' => $e['description'],
            'date' => $e['date'],
            'time' => $e['time'],
            'location' => $e['location'],
            'category' => $e['category'] ?? 'Yoga Workshops',
            'is_free' => (int)($e['is_free'] ?? 1),
            'amount' => (float)($e['amount'] ?? 0.00),
            'is_favorite' => (bool)$e['is_favorite'],
            'likes_count' => (int)($e['likes_count'] ?? 0),
            'creator_name' => $e['creator_name'] ?? 'Organizer'
        ];
    }, $events);
    sendJson(['status' => true, 'data' => $formatted]);
}

// 12. Action: upcoming-event-detail
if ($action === 'upcoming-event-detail') {
    $eventId = intval($input['event_id'] ?? 0);
    $fetch = $db->prepare("
        SELECT e.*, u.name AS creator_name,
               (f.id IS NOT NULL) AS is_favorite
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN event_favorites f ON f.event_id = e.id AND f.user_id = :uid
        WHERE e.id = :id
    ");
    $fetch->execute([':id' => $eventId, ':uid' => $user['id']]);
    $event = $fetch->fetch();
    if (!$event) {
        sendError('Event not found', 404);
    }
    sendJson([
        'status' => true,
        'data' => [
            'id' => (string)$event['id'],
            '_id' => (string)$event['id'],
            'title' => $event['title'],
            'description' => $event['description'],
            'date' => $event['date'],
            'time' => $event['time'],
            'location' => $event['location'],
            'category' => $event['category'] ?? 'Yoga Workshops',
            'is_free' => (int)($event['is_free'] ?? 1),
            'amount' => (float)($event['amount'] ?? 0.00),
            'is_favorite' => (bool)$event['is_favorite'],
            'likes_count' => (int)($event['likes_count'] ?? 0),
            'creator_name' => $event['creator_name'] ?? 'Organizer'
        ]
    ]);
}

// 13. Action: event-toggle-favorite
if ($action === 'event-toggle-favorite') {
    $eventId = intval($input['event_id'] ?? 0);

    $check = $db->prepare("SELECT id FROM events WHERE id = :id");
    $check->execute([':id' => $eventId]);
    if (!$check->fetch()) {
        sendError('Event not found', 404);
    }

    $existing = $db->prepare("SELECT id FROM event_favorites WHERE event_id = :eid AND user_id = :uid");
    $existing->execute([':eid' => $eventId, ':uid' => $user['id']]);

    if ($existing->fetch()) {
        $del = $db->prepare("DELETE FROM event_favorites WHERE event_id = :eid AND user_id = :uid");
        $del->execute([':eid' => $eventId, ':uid' => $user['id']]);
        $favorited = false;
        $message = 'Event removed from favorites';
    } else {
        $ins = $db->prepare("INSERT INTO event_favorites (event_id, user_id) VALUES (:eid, :uid)");
        $ins->execute([':eid' => $eventId, ':uid' => $user['id']]);
        $favorited = true;
        $message = 'Event favorited';
    }

    // Keep the event's likes_count in sync with its favorite count
    $sync = $db->prepare("
        UPDATE events SET likes_count = (SELECT COUNT(*) FROM event_favorites WHERE event_id = :eid)
        WHERE id = :eid2
    ");
    $sync->execute([':eid' => $eventId, ':eid2' => $eventId]);

    $count = $db->prepare("SELECT likes_count FROM events WHERE id = :id");
    $count->execute([':id' => $eventId]);
    $likesCount = (int)($count->fetch()['likes_count'] ?? 0);

    sendJson(['status' => true, 'favorited' => $favorited, 'likes_count' => $likesCount, 'message' => $message]);
}

// 14. Action: event-favorites
if ($action === 'event-favorites') {
    $stmt = $db->prepare("
        SELECT e.*, e.id AS _id, u.name AS creator_name
        FROM event_favorites f
        INNER JOIN events e ON e.id = f.event_id
        LEFT JOIN users u ON e.created_by = u.id
        WHERE f.user_id = :uid
        ORDER BY e.date ASC
    ");
    $stmt->execute([':uid' => $user['id']]);
    $favorites = array_map(function($e) {
        return [
            'id' => (string)$e['id'],
            '_id' => (string)$e['id'],
            'title' => $e['title'],
            'description' => $e['description'],
            'date' => $e['date'],
            'time' => $e['time'],
            'location' => $e['location'],
            'category' => $e['category'] ?? 'Yoga Workshops',
            'is_free' => (int)($e['is_free'] ?? 1),
            'amount' => (float)($e['amount'] ?? 0.00),
            'is_favorite' => true,
            'likes_count' => (int)($e['likes_count'] ?? 0),
            'creator_name' => $e['creator_name'] ?? 'Organizer'
        ];
    }, $stmt->fetchAll());
    sendJson(['status' => true, 'data' => $favorites]);
}

// 15. Action: get-notification (up to 10 unseen notifications)
if ($action === 'get-notification') {
    $stmt = $db->prepare("
        SELECT id, title, type, content, created_at
        FROM notifications
        WHERE user = :name AND is_read = 0
        ORDER BY created_at DESC
        LIMIT 10
    ");
    $stmt->execute([':name' => $user['name']]);
    $rows = array_map(function ($n) {
        return [
            'id' => (string)$n['id'],
            'title' => $n['title'],
            'type' => $n['type'],
            'content' => $n['content'],
            'created_at' => $n['created_at'],
        ];
    }, $stmt->fetchAll());
    sendJson(['status' => true, 'data' => $rows]);
}

// 16. Action: del-notification (mark a single notification as seen)
if ($action === 'del-notification') {
    $notifId = intval($input['id'] ?? 0);
    $up = $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = :id AND user = :name");
    $up->execute([':id' => $notifId, ':name' => $user['name']]);
    sendJson(['status' => true]);
}

sendError("Invalid action type: $action", 400);
