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

if (!isset($data['project_id'])) {
    jsonError('project_id est requis');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $projectId = $data['project_id'];

    // Vérifier que l'utilisateur n'est pas le propriétaire
    $query = "SELECT user_id FROM projects WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $projectId);
    $stmt->execute();

    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$project) {
        jsonError('Projet non trouvé', 404);
    }

    if ($project['user_id'] == $userId) {
        jsonError('Vous ne pouvez pas quitter votre propre projet', 403);
    }

    // Supprimer le partage
    $query = "DELETE FROM project_shares WHERE project_id = :project_id AND shared_with_user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':project_id', $projectId);
    $stmt->bindParam(':user_id', $userId);

    if ($stmt->execute()) {
        jsonSuccess(['message' => 'Vous avez quitté le projet avec succès']);
    } else {
        jsonError('Erreur lors de la sortie du projet', 500);
    }

} catch(PDOException $e) {
    error_log("Leave project error: " . $e->getMessage());
    jsonError('Erreur lors de la sortie du projet', 500);
}
