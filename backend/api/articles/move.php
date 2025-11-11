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

    // Verify target library ownership OR shared access with editor role
    $query = "SELECT l.*,
              CASE WHEN l.user_id = :user_id THEN 1 ELSE 0 END as is_owner,
              ls.role as library_shared_role,
              ps.role as project_shared_role
              FROM libraries l
              LEFT JOIN library_shares ls ON l.id = ls.library_id AND ls.shared_with_user_id = :user_id
              LEFT JOIN project_libraries pl ON l.id = pl.library_id
              LEFT JOIN project_shares ps ON pl.project_id = ps.project_id AND ps.shared_with_user_id = :user_id2
              WHERE l.id = :id
              AND (l.user_id = :user_id3
                   OR ls.shared_with_user_id = :user_id3
                   OR ps.shared_with_user_id = :user_id2)
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $targetLibraryId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':user_id2', $userId);
    $stmt->bindParam(':user_id3', $userId);
    $stmt->execute();

    $targetLibrary = $stmt->fetch();

    if (!$targetLibrary) {
        jsonError('Bibliothèque cible non trouvée ou accès refusé', 403);
    }

    // Vérifier les droits d'édition pour la bibliothèque cible
    $canEditTarget = $targetLibrary['is_owner']
                     || ($targetLibrary['library_shared_role'] === 'editor')
                     || ($targetLibrary['project_shared_role'] === 'editor');
    if (!$canEditTarget) {
        jsonError('Vous n\'avez pas les droits pour ajouter des articles à cette bibliothèque', 403);
    }

    // Start transaction
    $db->beginTransaction();

    $successCount = 0;

    foreach ($articleIds as $articleId) {
        // Verify article ownership through its current library (with shared access check)
        $query = "SELECT a.*,
                  CASE WHEN l.user_id = :user_id THEN 1 ELSE 0 END as is_owner,
                  ls.role as library_shared_role,
                  ps.role as project_shared_role
                  FROM articles a
                  JOIN libraries l ON a.library_id = l.id
                  LEFT JOIN library_shares ls ON l.id = ls.library_id AND ls.shared_with_user_id = :user_id
                  LEFT JOIN project_libraries pl ON l.id = pl.library_id
                  LEFT JOIN project_shares ps ON pl.project_id = ps.project_id AND ps.shared_with_user_id = :user_id2
                  WHERE a.id = :id
                  AND (l.user_id = :user_id3
                       OR ls.shared_with_user_id = :user_id3
                       OR ps.shared_with_user_id = :user_id2)";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $articleId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':user_id2', $userId);
        $stmt->bindParam(':user_id3', $userId);
        $stmt->execute();

        $article = $stmt->fetch();

        if (!$article) {
            continue; // Skip articles the user doesn't have access to
        }

        // Verify editor rights on source library
        $canEditSource = $article['is_owner']
                         || ($article['library_shared_role'] === 'editor')
                         || ($article['project_shared_role'] === 'editor');
        if (!$canEditSource) {
            continue; // Skip articles user can't modify
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
