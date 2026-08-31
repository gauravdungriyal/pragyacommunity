<?php
// ==========================================================
// Auth Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';

class AuthController {

    public static function register(): void {
        $data = getJsonInput();
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = trim($data['password'] ?? '');
        $role = trim($data['role'] ?? 'Student');

        if (empty($name) || empty($email) || empty($password)) {
            sendError('Name, email and password are required', 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendError('Invalid email format', 400);
        }

        $db = Database::getConnection();

        // Check if user already exists
        $stmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        if ($stmt->fetch()) {
            sendError('Email already registered', 409);
        }

        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        // Normalize role
        $allowedRoles = ['Student', 'Teacher', 'Mentor', 'Admin'];
        $formattedRole = 'Student';
        foreach ($allowedRoles as $r) {
            if (strcasecmp($r, $role) === 0) {
                $formattedRole = $r;
                break;
            }
        }

        // Insert new user
        $insert = $db->prepare("
            INSERT INTO users (name, email, password, role)
            VALUES (:name, :email, :password, :role)
        ");
        $insert->execute([
            ':name' => $name,
            ':email' => $email,
            ':password' => $hashedPassword,
            ':role' => $formattedRole
        ]);

        $userId = $db->lastInsertId();

        sendJson([
            'status' => true,
            'message' => 'User Registered Successfully',
            'user' => [
                'id' => (int)$userId,
                'name' => $name,
                'email' => $email,
                'role' => $formattedRole
            ]
        ], 201);
    }

    public static function login(): void {
        $data = getJsonInput();
        $email = trim($data['email'] ?? '');
        $password = trim($data['password'] ?? '');

        if (empty($email) || empty($password)) {
            sendError('Email and password are required', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT id, name, email, password, role FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            sendError('Invalid email or password', 401);
        }

        // Generate JWT token
        $tokenPayload = [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role']
        ];
        $token = JWT::encode($tokenPayload);

        sendJson([
            'status' => true,
            'message' => 'Login Successful',
            'token' => $token,
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
            ]
        ]);
    }
}
