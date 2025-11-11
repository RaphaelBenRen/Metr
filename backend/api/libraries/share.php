<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Méthode non autorisée', 405);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['library_id']) || !isset($data['email'])) {
    jsonError('library_id et email sont requis');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $libraryId = $data['library_id'];
    $email = trim($data['email']);
    $role = isset($data['role']) ? $data['role'] : 'editor';

    // Vérifier que la bibliothèque appartient à l'utilisateur
    $query = "SELECT id, user_id FROM libraries WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $libraryId);
    $stmt->execute();

    $library = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$library) {
        jsonError('Bibliothèque non trouvée', 404);
    }

    if ($library['user_id'] != $userId) {
        jsonError('Seul le propriétaire de la bibliothèque peut la partager', 403);
    }

    // Trouver l'utilisateur par email
    $query = "SELECT id, email, nom FROM users WHERE email = :email LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$targetUser) {
        jsonError('Aucun utilisateur trouvé avec cet email');
    }

    if ($targetUser['id'] == $userId) {
        jsonError('Vous ne pouvez pas partager une bibliothèque avec vous-même');
    }

    // Créer le partage
    $query = "INSERT IGNORE INTO library_shares (library_id, owner_id, shared_with_user_id, role)
              VALUES (:library_id, :owner_id, :shared_with_user_id, :role)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':library_id', $libraryId);
    $stmt->bindParam(':owner_id', $userId);
    $stmt->bindParam(':shared_with_user_id', $targetUser['id']);
    $stmt->bindParam(':role', $role);

    if ($stmt->execute()) {
        jsonSuccess([
            'user' => [
                'id' => $targetUser['id'],
                'email' => $targetUser['email'],
                'nom' => $targetUser['nom'],
                'role' => $role
            ]
        ], 'Bibliothèque partagée avec succès');
    } else {
        jsonError('Erreur lors du partage de la bibliothèque', 500);
    }

} catch(PDOException $e) {
    error_log("Library share error: " . $e->getMessage());
    jsonError('Erreur lors du partage de la bibliothèque', 500);
}
