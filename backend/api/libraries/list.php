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

    // Récupérer les bibliothèques dont l'utilisateur est propriétaire OU qui sont partagées avec lui OU globales
    // OU qui sont affectées à des projets partagés avec lui OU qu'il a partagés
    $query = "SELECT l.*,
              CASE WHEN l.user_id = :user_id THEN 1 ELSE 0 END as is_owner,
              (SELECT role FROM library_shares WHERE library_id = l.id AND shared_with_user_id = :user_id2 LIMIT 1) as shared_role,
              CASE WHEN EXISTS(SELECT 1 FROM project_libraries pl
                               INNER JOIN project_shares ps ON pl.project_id = ps.project_id
                               INNER JOIN projects p ON pl.project_id = p.id
                               WHERE pl.library_id = l.id
                               AND (ps.shared_with_user_id = :user_id3 OR p.user_id = :user_id4))
                   THEN 1 ELSE 0 END as from_shared_project,
              (SELECT ps.role FROM project_libraries pl
               INNER JOIN project_shares ps ON pl.project_id = ps.project_id
               WHERE pl.library_id = l.id AND ps.shared_with_user_id = :user_id5
               LIMIT 1) as project_shared_role
              FROM libraries l
              WHERE l.user_id = :user_id
                 OR EXISTS(SELECT 1 FROM library_shares WHERE library_id = l.id AND shared_with_user_id = :user_id6)
                 OR l.is_global = 1
                 OR EXISTS(SELECT 1 FROM project_libraries pl
                          INNER JOIN project_shares ps ON pl.project_id = ps.project_id
                          WHERE pl.library_id = l.id AND ps.shared_with_user_id = :user_id7)
              ORDER BY l.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':user_id2', $userId);
    $stmt->bindParam(':user_id3', $userId);
    $stmt->bindParam(':user_id4', $userId);
    $stmt->bindParam(':user_id5', $userId);
    $stmt->bindParam(':user_id6', $userId);
    $stmt->bindParam(':user_id7', $userId);
    $stmt->execute();

    $libraries = $stmt->fetchAll();

    jsonSuccess($libraries);
} catch(PDOException $e) {
    error_log("Libraries list error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des bibliothèques', 500);
}
