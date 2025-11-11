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

    // Vérifier que l'utilisateur a accès à la bibliothèque avec droits d'édition
    $query = "SELECT l.*,
              CASE WHEN l.user_id = :user_id THEN 1 ELSE 0 END as is_owner,
              ls.role as shared_role
              FROM libraries l
              LEFT JOIN library_shares ls ON l.id = ls.library_id AND ls.shared_with_user_id = :user_id
              WHERE l.id = :id AND (l.user_id = :user_id OR ls.shared_with_user_id = :user_id)
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $libraryId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $library = $stmt->fetch();

    if (!$library) {
        jsonError('Bibliothèque non trouvée ou accès non autorisé', 404);
    }

    // Vérifier les droits d'édition
    $canEdit = $library['is_owner'] || ($library['shared_role'] === 'editor');
    if (!$canEdit) {
        jsonError('Vous n\'avez pas les droits pour modifier cette bibliothèque', 403);
    }

    // Construire la requête de mise à jour
    $fields = [];
    $params = [':id' => $libraryId];

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

    $query = "UPDATE libraries SET " . implode(', ', $fields) . " WHERE id = :id";
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
