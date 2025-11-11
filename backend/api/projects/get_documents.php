<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if (!isset($_GET['project_id'])) {
    jsonError('ID de projet manquant');
}

$projectId = $_GET['project_id'];

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();

    // Verify project ownership OR shared access
    $query = "SELECT p.id
              FROM projects p
              LEFT JOIN project_shares ps ON p.id = ps.project_id AND ps.shared_with_user_id = :user_id
              WHERE p.id = :id AND (p.user_id = :user_id OR ps.shared_with_user_id = :user_id)
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $projectId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    if (!$stmt->fetch()) {
        jsonError('Projet non trouvé ou accès refusé', 403);
    }

    // Get all documents for this project
    $query = "SELECT id, type, nom_fichier as filename, nom_original as original_filename, taille_fichier as file_size, format, uploaded_at as created_at
              FROM project_documents
              WHERE project_id = :project_id
              ORDER BY type, uploaded_at DESC";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':project_id', $projectId);
    $stmt->execute();

    $documents = $stmt->fetchAll();

    jsonSuccess($documents);

} catch(PDOException $e) {
    error_log("Get documents error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des documents', 500);
}
