<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=metr_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = file_get_contents(__DIR__ . '/create_project_libraries_table.sql');
    $pdo->exec($sql);

    echo "Table project_libraries créée avec succès\n";
} catch(PDOException $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
