<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=metr_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "=== PROJECTS TABLE ===\n";
    $stmt = $pdo->query('SHOW CREATE TABLE projects');
    $result = $stmt->fetch();
    echo $result['Create Table'] . "\n\n";

    echo "=== LIBRARIES TABLE ===\n";
    $stmt = $pdo->query('SHOW CREATE TABLE libraries');
    $result = $stmt->fetch();
    echo $result['Create Table'] . "\n";

} catch(PDOException $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
