<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Méthode non autorisée', 405);
}

if (!isset($_GET['project_id'])) {
    jsonError('project_id est requis');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $projectId = $_GET['project_id'];

    // Vérifier que l'utilisateur a accès au projet (propriétaire ou partagé avec lui)
    $query = "SELECT id, user_id FROM projects WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $projectId);
    $stmt->execute();

    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$project) {
        jsonError('Projet non trouvé', 404);
    }

    $isOwner = ($project['user_id'] == $userId);

    // Vérifier si l'utilisateur a accès via un partage
    if (!$isOwner) {
        $query = "SELECT id FROM project_shares
                  WHERE project_id = :project_id
                  AND shared_with_user_id = :user_id
                  LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':project_id', $projectId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            jsonError('Accès non autorisé', 403);
        }
    }

    // Récupérer le propriétaire
    $query = "SELECT id, email, nom, prenom FROM users WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $project['user_id']);
    $stmt->execute();
    $owner = $stmt->fetch(PDO::FETCH_ASSOC);

    // Récupérer tous les utilisateurs avec qui le projet est partagé
    $query = "SELECT u.id, u.email, u.nom, u.prenom, ps.role, ps.created_at as shared_at
              FROM project_shares ps
              INNER JOIN users u ON ps.shared_with_user_id = u.id
              WHERE ps.project_id = :project_id
              ORDER BY ps.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':project_id', $projectId);
    $stmt->execute();

    $sharedUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonSuccess([
        'owner' => $owner,
        'is_owner' => $isOwner,
        'shared_users' => $sharedUsers
    ], 'Liste des utilisateurs récupérée avec succès');

} catch(PDOException $e) {
    error_log("Get shared users error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des utilisateurs', 500);
}
