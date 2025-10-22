<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    jsonError('Méthode non autorisée', 405);
}

if (!isset($_GET['id'])) {
    jsonError('ID de l\'article manquant');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $articleId = $_GET['id'];

    // Vérifier que l'article appartient à une bibliothèque de l'utilisateur
    $query = "SELECT a.* FROM articles a
              INNER JOIN libraries l ON a.library_id = l.id
              WHERE a.id = :id AND l.user_id = :user_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $articleId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonError('Article non trouvé ou accès non autorisé', 404);
    }

    // Supprimer l'article
    $query = "DELETE FROM articles WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $articleId);

    if ($stmt->execute()) {
        jsonSuccess(null, 'Article supprimé avec succès');
    } else {
        jsonError('Erreur lors de la suppression de l\'article', 500);
    }
} catch(PDOException $e) {
    error_log("Article delete error: " . $e->getMessage());
    jsonError('Erreur lors de la suppression de l\'article', 500);
}
