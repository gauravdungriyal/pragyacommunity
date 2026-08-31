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
    $nameParts = explode(' ', $user['name']);

    sendJson([
        'status' => true,
        'message' => 'Login successful',
        'access_token' => $accessToken,
        'refresh_token' => $refreshToken,
        'uid' => (string)$user['id'],
        'name' => $nameParts[0] ?? 'User'
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
    $newAccess = JWT::encode(['email' => $email, 'iat' => time(), 'exp' => time() + 86400]);
    $newRefresh = JWT::encode(['email' => $email, 'iat' => time(), 'exp' => time() + (300 * 86400)]);

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

    sendJson([
        'status' => true,
        'data' => [
            'id' => (string)$user['id'],
            'username' => explode('@', $user['email'])[0],
            'warning' => 0,
            'profile' => 'https://pragya-yog.com/uploads/' . ($user['avatar'] ?? 'default.jpg'),
            'fullname' => $user['name'],
            'fname' => $fname,
            'lname' => $lname,
            'wallet_balance' => '100.00',
            'amount_expire' => '2026-12-31',
            'chinese_name' => '普拉吉亚',
            'dob' => '05-Jan',
            'dob_month' => '01',
            'dob_date' => '05',
            'gender' => 'male',
            'email' => $user['email'],
            'phone' => $user['phone'] ?? '',
            'hongkong_id' => 'A123******',
            'hkdf' => 'A1234567',
            'enroll_date' => date('d M Y', strtotime($user['created_at'] ?? 'now')),
            'notify_whatsapp' => '1',
            'notify_email' => '1',
            'notify_push' => '1',
            'bookings' => '3',
            'noshow_strikes' => 0,
            'late_checkin_strikes' => 0
        ]
    ]);
}

// 6. Action: edit_user_details
if ($action === 'edit_user_details') {
    $fname = trim($input['fname'] ?? '');
    $lname = trim($input['lname'] ?? '');
    $newName = trim("$fname $lname");
    if (!empty($newName)) {
        $up = $db->prepare("UPDATE users SET name = :name WHERE id = :id");
        $up->execute([':name' => $newName, ':id' => $user['id']]);
    }
    sendJson(['status' => true]);
}

// 7. Action: update-notification-settings
if ($action === 'update-notification-settings') {
    sendJson(['status' => true, 'message' => 'Notification settings updated successfully.']);
}

// 8. Action: emergency-contact
if ($action === 'emergency-contact') {
    $actionType = $input['action_type'] ?? 'get';
    if ($actionType === 'get') {
        sendJson([
            'status' => true,
            'data' => [
                ['id' => '1', 'user_id' => (string)$user['id'], 'photo' => 'blank.png', 'name' => 'Jane Doe', 'relation' => 'Sister', 'phone' => '+91 9123456780']
            ]
        ]);
    }
    if ($actionType === 'add') {
        sendJson(['status' => true, 'message' => 'Contact added successfully']);
    }
    if ($actionType === 'delete') {
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
    $stmt = $db->query("
        SELECT e.*, e.id AS _id, u.name AS creator_name 
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        ORDER BY e.date ASC
    ");
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
            'is_favorite' => false,
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
        SELECT e.*, u.name AS creator_name 
        FROM events e 
        LEFT JOIN users u ON e.created_by = u.id 
        WHERE e.id = :id
    ");
    $fetch->execute([':id' => $eventId]);
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
            'creator_name' => $event['creator_name'] ?? 'Organizer'
        ]
    ]);
}

// 13. Action: event-toggle-favorite
if ($action === 'event-toggle-favorite') {
    sendJson(['status' => true, 'favorited' => true, 'message' => 'Event favorited']);
}

// 14. Action: event-favorites
if ($action === 'event-favorites') {
    sendJson(['status' => true, 'data' => []]);
}

sendError("Invalid action type: $action", 400);
