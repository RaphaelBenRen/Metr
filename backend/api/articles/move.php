<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonError('Méthode non autorisée', 405);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['article_ids']) || !isset($data['target_library_id'])) {
    jsonError('Données manquantes');
}

$articleIds = $data['article_ids'];
$targetLibraryId = $data['target_library_id'];

if (!is_array($articleIds) || empty($articleIds)) {
    jsonError('Liste d\'articles invalide');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();

    // Verify target library ownership
    $query = "SELECT id FROM libraries WHERE id = :id AND user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $targetLibraryId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    if (!$stmt->fetch()) {
        jsonError('Bibliothèque cible non trouvée ou accès refusé', 403);
    }

    // Start transaction
    $db->beginTransaction();

    $successCount = 0;

    foreach ($articleIds as $articleId) {
        // Verify article ownership through its current library
        $query = "SELECT a.*, l.user_id
                  FROM articles a
                  JOIN libraries l ON a.library_id = l.id
                  WHERE a.id = :id AND l.user_id = :user_id";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $articleId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        $article = $stmt->fetch();

        if (!$article) {
            continue; // Skip articles the user doesn't own
        }

        // Move article to target library
        $query = "UPDATE articles SET library_id = :library_id, updated_at = NOW() WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':library_id', $targetLibraryId);
        $stmt->bindParam(':id', $articleId);

        if ($stmt->execute()) {
            $successCount++;
        }
    }

    $db->commit();

    jsonSuccess([
        'moved_count' => $successCount,
        'total_requested' => count($articleIds)
    ], $successCount . ' article(s) déplacé(s) avec succès');

} catch(PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Move articles error: " . $e->getMessage());
    jsonError('Erreur lors du déplacement', 500);
}
