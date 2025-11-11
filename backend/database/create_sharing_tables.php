<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=metr_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = file_get_contents(__DIR__ . '/create_sharing_tables.sql');
    $pdo->exec($sql);

    echo "Tables de partage créées avec succès\n";
} catch(PDOException $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
