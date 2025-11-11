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

if (!isset($data['project_id']) || !isset($data['user_id']) || !isset($data['role'])) {
    jsonError('project_id, user_id et role sont requis');
}

// Valider le rôle
if (!in_array($data['role'], ['viewer', 'editor'])) {
    jsonError('Le rôle doit être "viewer" ou "editor"');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $projectId = $data['project_id'];
    $targetUserId = $data['user_id'];
    $newRole = $data['role'];

    // Vérifier que le projet appartient à l'utilisateur
    $query = "SELECT id, user_id FROM projects WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $projectId);
    $stmt->execute();

    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$project) {
        jsonError('Projet non trouvé', 404);
    }

    if ($project['user_id'] != $userId) {
        jsonError('Seul le propriétaire du projet peut modifier les rôles', 403);
    }

    // Mettre à jour le rôle
    $query = "UPDATE project_shares
              SET role = :role
              WHERE project_id = :project_id
              AND owner_id = :owner_id
              AND shared_with_user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':role', $newRole);
    $stmt->bindParam(':project_id', $projectId);
    $stmt->bindParam(':owner_id', $userId);
    $stmt->bindParam(':user_id', $targetUserId);

    if ($stmt->execute()) {
        jsonSuccess(null, 'Rôle modifié avec succès');
    } else {
        jsonError('Erreur lors de la modification du rôle', 500);
    }

} catch(PDOException $e) {
    error_log("Project update role error: " . $e->getMessage());
    jsonError('Erreur lors de la modification du rôle', 500);
}
