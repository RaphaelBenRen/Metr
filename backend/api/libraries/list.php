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

    $query = "SELECT * FROM libraries WHERE user_id = :user_id OR is_global = 1 ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $libraries = $stmt->fetchAll();

    jsonSuccess($libraries);
} catch(PDOException $e) {
    error_log("Libraries list error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des bibliothèques', 500);
}
