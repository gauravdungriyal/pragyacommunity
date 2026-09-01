<?php
// ==========================================================
// Pragya Connect - Automated Database Setup Script
//
// Usage via CLI: php db/setup_db.php
// Usage via Browser: http://localhost/pragyaConnect/backend-php/db/setup_db.php
// ==========================================================

$isCli = (php_sapi_name() === 'cli');

if (!$isCli) {
    header('Content-Type: text/html; charset=utf-8');
    echo "<pre style='background:#111; color:#0f0; padding:20px; font-family:monospace;'>";
}

echo "=====================================================\n";
echo " Pragya Connect - MySQL Setup & Seed Runner\n";
echo "=====================================================\n\n";

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$dbname = getenv('DB_NAME') ?: 'pragya_connect';
$username = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';

try {
    echo "[1/4] Connecting to MySQL server at {$host}:{$port}...\n";
    $pdo = new PDO("mysql:host={$host};port={$port}", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "      -> Connected successfully.\n\n";

    echo "[2/4] Ensuring database `{$dbname}` exists...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$dbname}`");
    echo "      -> Database `{$dbname}` is active.\n\n";

    echo "[3/4] Reading schema file `schema.sql`...\n";
    $schemaFile = __DIR__ . '/schema.sql';
    if (!file_exists($schemaFile)) {
        throw new Exception("schema.sql not found at: {$schemaFile}");
    }
    $sql = file_get_contents($schemaFile);
    echo "      -> Schema loaded (" . strlen($sql) . " bytes).\n\n";

    echo "[4/5] Executing database tables and seed records...\n";
    // Execute SQL script
    $pdo->exec($sql);
    echo "      -> All tables created and seed data inserted successfully!\n\n";

    echo "[5/5] Applying column migrations to existing tables...\n";

    /**
     * Add a column only when it is missing, so the script stays safe to re-run
     * on databases created before these features existed.
     */
    $addColumn = function (string $table, string $column, string $definition) use ($pdo, $dbname) {
        $check = $pdo->prepare("
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :tbl AND COLUMN_NAME = :col
        ");
        $check->execute([':db' => $dbname, ':tbl' => $table, ':col' => $column]);
        if ((int)$check->fetchColumn() === 0) {
            $pdo->exec("ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}");
            echo "      -> Added {$table}.{$column}\n";
        }
    };

    $addColumn('resources', 'course_id', 'INT NULL AFTER `category`');
    $addColumn('events', 'course_id', 'INT NULL AFTER `category`');
    $addColumn('messages', 'course_id', 'INT NULL AFTER `recipient`');
    $addColumn('notifications', 'user_id', 'INT NULL AFTER `user`');
    $addColumn('notifications', 'sender_id', 'INT NULL AFTER `user_id`');
    $addColumn('notifications', 'scope', "VARCHAR(20) NOT NULL DEFAULT 'individual' AFTER `type`");
    $addColumn('notifications', 'course_id', 'INT NULL AFTER `scope`');
    $addColumn('notifications', 'link', 'VARCHAR(255) NULL AFTER `content`');
    $addColumn('user_settings', 'welcome_seen', 'TINYINT(1) NOT NULL DEFAULT 0');

    // Group messages have no single recipient, so the column must accept NULL
    $pdo->exec("ALTER TABLE `messages` MODIFY `recipient` VARCHAR(191) NULL");

    // Backfill notification owners that were only stored by display name
    $pdo->exec("
        UPDATE notifications n
        INNER JOIN users u ON u.name = n.user
        SET n.user_id = u.id
        WHERE n.user_id IS NULL
    ");

    // Seed post_likes from the legacy counter so existing like totals stay believable
    $pdo->exec("
        INSERT IGNORE INTO post_likes (post_id, user_id)
        SELECT p.id, p.user_id FROM posts p
        WHERE p.likes > 0 AND p.user_id IS NOT NULL
    ");
    $pdo->exec("UPDATE posts p SET p.likes = (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id)");

    echo "      -> Migrations applied.\n\n";

    echo "=====================================================\n";
    echo " SUCCESS! Database setup complete.\n";
    echo " Default accounts:\n";
    echo "   - student@pragya.org / password123 (Student)\n";
    echo "   - mentor@pragya.org  / password123 (Mentor)\n";
    echo "   - admin@pragya.org   / password123 (Admin)\n";
    echo "=====================================================\n";

} catch (Exception $e) {
    echo "\n[ERROR]: " . $e->getMessage() . "\n";
}

if (!$isCli) {
    echo "</pre>";
}
