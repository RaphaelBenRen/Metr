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

if (!$input || !isset($input['id'])) {
    jsonError('ID de l\'article manquant');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $articleId = $input['id'];

    // Vérifier que l'article appartient à une bibliothèque accessible avec droits d'édition
    $query = "SELECT a.*,
              CASE WHEN l.user_id = :user_id THEN 1 ELSE 0 END as is_owner,
              ls.role as library_shared_role,
              ps.role as project_shared_role
              FROM articles a
              INNER JOIN libraries l ON a.library_id = l.id
              LEFT JOIN library_shares ls ON l.id = ls.library_id AND ls.shared_with_user_id = :user_id
              LEFT JOIN project_libraries pl ON l.id = pl.library_id
              LEFT JOIN project_shares ps ON pl.project_id = ps.project_id AND ps.shared_with_user_id = :user_id2
              WHERE a.id = :id
              AND (l.user_id = :user_id3
                   OR ls.shared_with_user_id = :user_id3
                   OR ps.shared_with_user_id = :user_id2)
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $articleId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':user_id2', $userId);
    $stmt->bindParam(':user_id3', $userId);
    $stmt->execute();

    $article = $stmt->fetch();

    if (!$article) {
        jsonError('Article non trouvé ou accès non autorisé', 404);
    }

    // Vérifier les droits d'édition
    $canEdit = $article['is_owner']
               || ($article['library_shared_role'] === 'editor')
               || ($article['project_shared_role'] === 'editor');
    if (!$canEdit) {
        jsonError('Vous n\'avez pas les droits pour modifier cet article', 403);
    }

    // Construire la requête de mise à jour
    $fields = [];
    $params = [':id' => $articleId];

    if (isset($input['designation'])) {
        $fields[] = 'designation = :designation';
        $params[':designation'] = $input['designation'];
    }
    if (isset($input['lot'])) {
        $fields[] = 'lot = :lot';
        $params[':lot'] = $input['lot'];
    }
    if (isset($input['sous_categorie'])) {
        $fields[] = 'sous_categorie = :sous_categorie';
        $params[':sous_categorie'] = $input['sous_categorie'];
    }
    if (isset($input['unite'])) {
        $fields[] = 'unite = :unite';
        $params[':unite'] = $input['unite'];
    }
    if (isset($input['prix_unitaire'])) {
        $fields[] = 'prix_unitaire = :prix_unitaire';
        $params[':prix_unitaire'] = $input['prix_unitaire'];
    }
    if (isset($input['statut'])) {
        $fields[] = 'statut = :statut';
        $params[':statut'] = $input['statut'];
    }

    if (empty($fields)) {
        jsonError('Aucune donnée à mettre à jour');
    }

    $query = "UPDATE articles SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }

    if ($stmt->execute()) {
        $query = "SELECT * FROM articles WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $articleId);
        $stmt->execute();
        $article = $stmt->fetch();

        jsonSuccess($article, 'Article mis à jour avec succès');
    } else {
        jsonError('Erreur lors de la mise à jour de l\'article', 500);
    }
} catch(PDOException $e) {
    error_log("Article update error: " . $e->getMessage());
    jsonError('Erreur lors de la mise à jour de l\'article', 500);
}
