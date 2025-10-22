<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonError('Méthode non autorisée', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['id'])) {
    jsonError('ID de l\'article requis');
}

$articleId = $input['id'];

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();

    // Get article and verify ownership through library
    $query = "SELECT a.*, l.user_id
              FROM articles a
              JOIN libraries l ON a.library_id = l.id
              WHERE a.id = :id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $articleId);
    $stmt->execute();

    $article = $stmt->fetch();

    if (!$article) {
        jsonError('Article non trouvé', 404);
    }

    if ($article['user_id'] != $userId) {
        jsonError('Accès refusé', 403);
    }

    // Toggle favorite status
    $newFavoriteStatus = $article['is_favorite'] ? 0 : 1;

    $updateQuery = "UPDATE articles SET is_favorite = :is_favorite WHERE id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':is_favorite', $newFavoriteStatus);
    $updateStmt->bindParam(':id', $articleId);

    if ($updateStmt->execute()) {
        jsonSuccess([
            'id' => $articleId,
            'is_favorite' => (bool)$newFavoriteStatus
        ], 'Favori mis à jour');
    } else {
        jsonError('Erreur lors de la mise à jour');
    }

} catch(PDOException $e) {
    error_log("Toggle favorite error: " . $e->getMessage());
    jsonError('Erreur lors de la mise à jour du favori', 500);
}
