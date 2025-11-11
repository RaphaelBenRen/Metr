<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if (!isset($_GET['id'])) {
    jsonError('ID de projet manquant');
}

$projectId = $_GET['id'];

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();

    // Get project by ID and verify ownership OR shared access
    $query = "SELECT DISTINCT p.*,
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
        jsonError('Projet non trouvé ou accès refusé', 404);
    }

    jsonSuccess($project);
} catch(PDOException $e) {
    error_log("Get project error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération du projet', 500);
}
