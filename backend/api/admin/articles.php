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
    $query = "SELECT a.*, l.nom as library_nom, u.nom as user_nom, u.prenom as user_prenom
              FROM articles a
              LEFT JOIN libraries l ON a.library_id = l.id
              LEFT JOIN users u ON l.user_id = u.id
              ORDER BY a.created_at DESC";
    $stmt = $db->query($query);
    $articles = $stmt->fetchAll();

    jsonSuccess($articles);
} catch(PDOException $e) {
    error_log("Admin articles error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des articles', 500);
}
