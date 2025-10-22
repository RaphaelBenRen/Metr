<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Méthode non autorisée', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['nom'])) {
    jsonError('Nom de la bibliothèque manquant');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();

    $query = "INSERT INTO libraries (user_id, nom, description, is_global)
              VALUES (:user_id, :nom, :description, :is_global)";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':nom', $input['nom']);
    $stmt->bindValue(':description', $input['description'] ?? null);
    $stmt->bindValue(':is_global', $input['is_global'] ?? 0, PDO::PARAM_INT);

    if ($stmt->execute()) {
        $libraryId = $db->lastInsertId();

        $query = "SELECT * FROM libraries WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $libraryId);
        $stmt->execute();
        $library = $stmt->fetch();

        jsonSuccess($library, 'Bibliothèque créée avec succès');
    } else {
        jsonError('Erreur lors de la création de la bibliothèque', 500);
    }
} catch(PDOException $e) {
    error_log("Library create error: " . $e->getMessage());
    jsonError('Erreur lors de la création de la bibliothèque', 500);
}
