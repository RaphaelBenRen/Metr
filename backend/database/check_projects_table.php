<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db) {
    $stmt = $db->query('DESCRIBE projects');
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Projects table structure:\n";
    echo "============================\n";
    foreach($columns as $col) {
        echo $col['Field'] . ' | ' . $col['Type'] . ' | Null: ' . $col['Null'] . ' | Key: ' . $col['Key'] . "\n";
    }
} else {
    echo "Database connection failed\n";
}
