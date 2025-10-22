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
    $libraryId = isset($_GET['library_id']) ? intval($_GET['library_id']) : null;

    if (!$libraryId) {
        jsonError('ID de bibliothèque requis');
    }

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
