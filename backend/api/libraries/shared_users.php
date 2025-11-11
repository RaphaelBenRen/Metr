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

    // Vérifier que l'utilisateur a accès à la bibliothèque
    $query = "SELECT id, user_id FROM libraries WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $libraryId);
    $stmt->execute();

    $library = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$library) {
        jsonError('Bibliothèque non trouvée', 404);
    }

    $isOwner = ($library['user_id'] == $userId);

    // Vérifier si l'utilisateur a accès via un partage
    if (!$isOwner) {
        $query = "SELECT id FROM library_shares
                  WHERE library_id = :library_id
                  AND shared_with_user_id = :user_id
                  LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':library_id', $libraryId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            jsonError('Accès non autorisé', 403);
        }
    }

    // Récupérer le propriétaire
    $query = "SELECT id, email, nom, prenom FROM users WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $library['user_id']);
    $stmt->execute();
    $owner = $stmt->fetch(PDO::FETCH_ASSOC);

    // Récupérer tous les utilisateurs avec qui la bibliothèque est partagée
    $query = "SELECT u.id, u.email, u.nom, u.prenom, ls.role, ls.created_at as shared_at
              FROM library_shares ls
              INNER JOIN users u ON ls.shared_with_user_id = u.id
              WHERE ls.library_id = :library_id
              ORDER BY ls.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':library_id', $libraryId);
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
