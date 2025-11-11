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

    // Vérifier que l'utilisateur a accès au projet avec droits d'édition
    $query = "SELECT p.id,
              CASE WHEN p.user_id = :user_id THEN 1 ELSE 0 END as is_owner,
              ps.role as shared_role
              FROM projects p
              LEFT JOIN project_shares ps ON p.id = ps.project_id AND ps.shared_with_user_id = :user_id
              WHERE p.id = :id AND (p.user_id = :user_id OR ps.shared_with_user_id = :user_id)
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $projectId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $project = $stmt->fetch();

    if (!$project) {
        jsonError('Projet non trouvé ou accès non autorisé', 404);
    }

    // Vérifier les droits d'édition
    $canEdit = $project['is_owner'] || ($project['shared_role'] === 'editor');
    if (!$canEdit) {
        jsonError('Vous n\'avez pas les droits pour modifier ce projet', 403);
    }

    // Retirer l'assignation
    $query = "DELETE FROM project_libraries WHERE project_id = :project_id AND library_id = :library_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':project_id', $projectId);
    $stmt->bindParam(':library_id', $libraryId);

    if ($stmt->execute()) {
        jsonSuccess(null, 'Bibliothèque retirée du projet avec succès');
    } else {
        jsonError('Erreur lors du retrait de la bibliothèque', 500);
    }

} catch(PDOException $e) {
    error_log("Project unassign library error: " . $e->getMessage());
    jsonError('Erreur lors du retrait de la bibliothèque', 500);
}
