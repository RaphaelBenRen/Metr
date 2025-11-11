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

    // Récupérer tous les dossiers de l'utilisateur
    $query = "SELECT * FROM project_folders
              WHERE user_id = :user_id
              ORDER BY position ASC, created_at ASC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $folders = $stmt->fetchAll();

    jsonSuccess($folders);
} catch(PDOException $e) {
    error_log("Folders list error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des dossiers', 500);
}
