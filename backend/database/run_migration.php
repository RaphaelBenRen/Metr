<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db) {
    try {
        // Lire le fichier SQL
        $sql = file_get_contents(__DIR__ . '/add_google_sso.sql');

        // Supprimer les commentaires
        $lines = explode("\n", $sql);
        $cleanedLines = array_filter($lines, function($line) {
            return !preg_match('/^\s*--/', trim($line));
        });
        $sql = implode("\n", $cleanedLines);

        // Exécuter chaque commande SQL séparément
        $statements = array_filter(array_map('trim', explode(';', $sql)));

        foreach ($statements as $statement) {
            if (!empty($statement)) {
                try {
                    $db->exec($statement);
                    echo "✓ Executed: " . substr(str_replace("\n", " ", $statement), 0, 80) . "...\n";
                } catch(PDOException $e) {
                    if (strpos($e->getMessage(), 'Duplicate column name') !== false ||
                        strpos($e->getMessage(), 'Duplicate key name') !== false) {
                        echo "⚠ Skipped (already exists): " . substr($statement, 0, 50) . "...\n";
                    } else {
                        throw $e;
                    }
                }
            }
        }

        echo "\n✅ Migration completed successfully!\n";

        // Vérifier la nouvelle structure
        echo "\nNew users table structure:\n";
        echo "============================\n";
        $stmt = $db->query('DESCRIBE users');
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach($columns as $col) {
            echo $col['Field'] . ' | ' . $col['Type'] . "\n";
        }

    } catch(PDOException $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ Database connection failed\n";
}
