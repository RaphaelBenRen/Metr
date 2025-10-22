<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db) {
    try {
        echo "🚀 Migration des tables devis...\n\n";

        // Lire le fichier SQL
        $sql = file_get_contents(__DIR__ . '/add_devis_tables.sql');

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
                    if (strpos($e->getMessage(), 'already exists') !== false) {
                        echo "⚠ Skipped (already exists): " . substr($statement, 0, 50) . "...\n";
                    } else {
                        throw $e;
                    }
                }
            }
        }

        echo "\n✅ Migration completed successfully!\n\n";

        // Vérifier les tables créées
        echo "📋 Tables vérifiées:\n";
        echo "============================\n";

        $tables = ['devis', 'devis_lignes'];
        foreach($tables as $table) {
            $stmt = $db->query("SHOW TABLES LIKE '$table'");
            if ($stmt->rowCount() > 0) {
                echo "✓ Table '$table' existe\n";

                // Afficher la structure
                $stmt = $db->query("DESCRIBE $table");
                $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach($columns as $col) {
                    echo "  - " . $col['Field'] . " (" . $col['Type'] . ")\n";
                }
                echo "\n";
            } else {
                echo "✗ Table '$table' n'existe pas\n\n";
            }
        }

    } catch(PDOException $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ Database connection failed\n";
}
