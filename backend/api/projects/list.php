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

    $query = "SELECT * FROM projects WHERE user_id = :user_id ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $projects = $stmt->fetchAll();

    jsonSuccess($projects);
} catch(PDOException $e) {
    error_log("Projects list error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des projets', 500);
}
