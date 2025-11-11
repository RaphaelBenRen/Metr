<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Méthode non autorisée', 405);
}

if (!isset($_GET['project_id'])) {
    jsonError('project_id est requis');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $projectId = $_GET['project_id'];

    // Vérifier que l'utilisateur a accès au projet (propriétaire ou partagé)
    $query = "SELECT p.id
              FROM projects p
              LEFT JOIN project_shares ps ON p.id = ps.project_id AND ps.shared_with_user_id = :user_id
              WHERE p.id = :id AND (p.user_id = :user_id OR ps.shared_with_user_id = :user_id)
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $projectId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonError('Projet non trouvé ou accès non autorisé', 404);
    }

    // Récupérer toutes les bibliothèques assignées au projet
    $query = "SELECT l.*, pl.created_at as assigned_at,
              (SELECT COUNT(*) FROM articles WHERE library_id = l.id) as article_count
              FROM libraries l
              INNER JOIN project_libraries pl ON l.id = pl.library_id
              WHERE pl.project_id = :project_id
              ORDER BY pl.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':project_id', $projectId);
    $stmt->execute();

    $libraries = $stmt->fetchAll();

    jsonSuccess($libraries, 'Bibliothèques récupérées avec succès');

} catch(PDOException $e) {
    error_log("Get project libraries error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des bibliothèques', 500);
}
