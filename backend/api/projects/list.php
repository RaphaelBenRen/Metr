<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();

    // Get the "Projets partagés" folder ID for this user
    $sharedFolderQuery = "SELECT id FROM project_folders WHERE user_id = :user_id AND nom LIKE 'Projets partag%' AND is_system = 1 LIMIT 1";
    $stmt = $db->prepare($sharedFolderQuery);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $sharedFolderId = $stmt->fetchColumn();

    // Fallback: if not found, get by comparing with the two possible encodings
    if (!$sharedFolderId) {
        $sharedFolderQuery = "SELECT id FROM project_folders WHERE user_id = :user_id AND is_system = 1 AND (nom = 'Projets partagés' OR nom = 'Projets partagÃ©s') LIMIT 1";
        $stmt = $db->prepare($sharedFolderQuery);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $sharedFolderId = $stmt->fetchColumn();
    }

    // Récupérer les projets dont l'utilisateur est propriétaire OU qui sont partagés avec lui (et acceptés)
    $query = "SELECT p.*,
              CASE WHEN p.user_id = :user_id THEN 1 ELSE 0 END as is_owner,
              (SELECT role FROM project_shares WHERE project_id = p.id AND shared_with_user_id = :user_id2 AND status = 'accepted' LIMIT 1) as shared_role,
              CASE
                WHEN p.user_id = :user_id THEN p.folder_id
                ELSE :shared_folder_id
              END as folder_id
              FROM projects p
              WHERE p.user_id = :user_id
                 OR EXISTS (SELECT 1 FROM project_shares WHERE project_id = p.id AND shared_with_user_id = :user_id3 AND status = 'accepted')
              ORDER BY p.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':user_id2', $userId);
    $stmt->bindParam(':user_id3', $userId);
    $stmt->bindParam(':shared_folder_id', $sharedFolderId);
    $stmt->execute();

    $projects = $stmt->fetchAll();

    jsonSuccess($projects);
} catch(PDOException $e) {
    error_log("Projects list error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des projets', 500);
}
