<?php
// Simple script to execute SQL files
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die("Connection failed\n");
}

$sql = file_get_contents(__DIR__ . '/add_project_documents.sql');

try {
    // Execute each statement
    $statements = explode(';', $sql);
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (empty($statement)) continue;

        $db->exec($statement);
    }
    echo "SQL executed successfully\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
