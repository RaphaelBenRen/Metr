<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonError('Méthode non autorisée', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['id'])) {
    jsonError('ID de la bibliothèque manquant');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $libraryId = $input['id'];

    // Vérifier que la bibliothèque appartient à l'utilisateur
    $query = "SELECT * FROM libraries WHERE id = :id AND user_id = :user_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $libraryId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonError('Bibliothèque non trouvée ou accès non autorisé', 404);
    }

    // Construire la requête de mise à jour
    $fields = [];
    $params = [':id' => $libraryId, ':user_id' => $userId];

    if (isset($input['nom'])) {
        $fields[] = 'nom = :nom';
        $params[':nom'] = $input['nom'];
    }
    if (isset($input['description'])) {
        $fields[] = 'description = :description';
        $params[':description'] = $input['description'];
    }
    if (isset($input['is_global'])) {
        $fields[] = 'is_global = :is_global';
        $params[':is_global'] = $input['is_global'];
    }

    if (empty($fields)) {
        jsonError('Aucune donnée à mettre à jour');
    }

    $query = "UPDATE libraries SET " . implode(', ', $fields) . " WHERE id = :id AND user_id = :user_id";
    $stmt = $db->prepare($query);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }

    if ($stmt->execute()) {
        $query = "SELECT * FROM libraries WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $libraryId);
        $stmt->execute();
        $library = $stmt->fetch();

        jsonSuccess($library, 'Bibliothèque mise à jour avec succès');
    } else {
        jsonError('Erreur lors de la mise à jour de la bibliothèque', 500);
    }
} catch(PDOException $e) {
    error_log("Library update error: " . $e->getMessage());
    jsonError('Erreur lors de la mise à jour de la bibliothèque', 500);
}
