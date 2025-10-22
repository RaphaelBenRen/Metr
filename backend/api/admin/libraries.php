<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAdmin();

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $query = "SELECT l.*, u.nom as user_nom, u.prenom as user_prenom, u.email as user_email,
              (SELECT COUNT(*) FROM articles WHERE library_id = l.id) as article_count
              FROM libraries l
              LEFT JOIN users u ON l.user_id = u.id
              ORDER BY l.created_at DESC";
    $stmt = $db->query($query);
    $libraries = $stmt->fetchAll();

    jsonSuccess($libraries);
} catch(PDOException $e) {
    error_log("Admin libraries error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des bibliothèques', 500);
}
