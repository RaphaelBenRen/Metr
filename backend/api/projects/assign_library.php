<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Méthode non autorisée', 405);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['project_id']) || !isset($data['library_id'])) {
    jsonError('project_id et library_id sont requis');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $projectId = $data['project_id'];
    $libraryId = $data['library_id'];

    // Vérifier que le projet appartient à l'utilisateur
    $query = "SELECT id FROM projects WHERE id = :id AND user_id = :user_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $projectId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonError('Projet non trouvé ou accès non autorisé', 404);
    }

    // Vérifier que la bibliothèque appartient à l'utilisateur
    $query = "SELECT id FROM libraries WHERE id = :id AND user_id = :user_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $libraryId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonError('Bibliothèque non trouvée ou accès non autorisé', 404);
    }

    // Assigner la bibliothèque au projet (INSERT IGNORE pour éviter les doublons)
    $query = "INSERT IGNORE INTO project_libraries (project_id, library_id) VALUES (:project_id, :library_id)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':project_id', $projectId);
    $stmt->bindParam(':library_id', $libraryId);

    if ($stmt->execute()) {
        jsonSuccess(null, 'Bibliothèque assignée au projet avec succès');
    } else {
        jsonError('Erreur lors de l\'assignation de la bibliothèque', 500);
    }

} catch(PDOException $e) {
    error_log("Project assign library error: " . $e->getMessage());
    jsonError('Erreur lors de l\'assignation de la bibliothèque', 500);
}
