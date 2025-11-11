<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Méthode non autorisée', 405);
}

if (!isset($_GET['library_id'])) {
    jsonError('library_id est requis');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $libraryId = $_GET['library_id'];

    // Vérifier que la bibliothèque appartient à l'utilisateur
    $query = "SELECT id FROM libraries WHERE id = :id AND user_id = :user_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $libraryId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonError('Bibliothèque non trouvée ou accès non autorisé', 404);
    }

    // Récupérer tous les projets qui utilisent cette bibliothèque
    $query = "SELECT p.*, pl.created_at as assigned_at
              FROM projects p
              INNER JOIN project_libraries pl ON p.id = pl.project_id
              WHERE pl.library_id = :library_id
              ORDER BY pl.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':library_id', $libraryId);
    $stmt->execute();

    $projects = $stmt->fetchAll();

    jsonSuccess($projects, 'Projets récupérés avec succès');

} catch(PDOException $e) {
    error_log("Get library projects error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des projets', 500);
}
