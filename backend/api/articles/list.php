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
    $libraryId = isset($_GET['library_id']) ? intval($_GET['library_id']) : null;

    if (!$libraryId) {
        jsonError('ID de bibliothèque requis');
    }

    // Vérifier que l'utilisateur a accès à la bibliothèque (propriétaire, partagée avec lui, globale, ou via projet partagé)
    $query = "SELECT DISTINCT l.id
              FROM libraries l
              LEFT JOIN library_shares ls ON l.id = ls.library_id AND ls.shared_with_user_id = :user_id
              LEFT JOIN project_libraries pl ON l.id = pl.library_id
              LEFT JOIN project_shares ps ON pl.project_id = ps.project_id AND ps.shared_with_user_id = :user_id2
              WHERE l.id = :library_id
              AND (l.user_id = :user_id3
                   OR ls.shared_with_user_id = :user_id3
                   OR l.is_global = 1
                   OR (pl.library_id IS NOT NULL AND ps.shared_with_user_id = :user_id2))
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':library_id', $libraryId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':user_id2', $userId);
    $stmt->bindParam(':user_id3', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonError('Accès à cette bibliothèque non autorisé', 403);
    }

    // Récupérer les articles
    $query = "SELECT * FROM articles WHERE library_id = :library_id ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':library_id', $libraryId);
    $stmt->execute();

    $articles = $stmt->fetchAll();

    jsonSuccess($articles);
} catch(PDOException $e) {
    error_log("Articles list error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des articles', 500);
}
