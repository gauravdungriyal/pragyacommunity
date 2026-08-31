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

    echo "[4/4] Executing database tables and seed records...\n";
    // Execute SQL script
    $pdo->exec($sql);
    echo "      -> All tables created and seed data inserted successfully!\n\n";

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
