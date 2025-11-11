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

if (!isset($data['project_id']) || !isset($data['email'])) {
    jsonError('project_id et email sont requis');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $projectId = $data['project_id'];
    $email = trim($data['email']);
    $role = isset($data['role']) ? $data['role'] : 'editor';

    // Vérifier que le projet appartient à l'utilisateur (seul le propriétaire peut partager)
    $query = "SELECT id, user_id FROM projects WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $projectId);
    $stmt->execute();

    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$project) {
        jsonError('Projet non trouvé', 404);
    }

    if ($project['user_id'] != $userId) {
        jsonError('Seul le propriétaire du projet peut le partager', 403);
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
        jsonError('Vous ne pouvez pas partager un projet avec vous-même');
    }

    // Créer le partage (INSERT IGNORE pour éviter les doublons)
    $query = "INSERT IGNORE INTO project_shares (project_id, owner_id, shared_with_user_id, role)
              VALUES (:project_id, :owner_id, :shared_with_user_id, :role)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':project_id', $projectId);
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
        ], 'Projet partagé avec succès');
    } else {
        jsonError('Erreur lors du partage du projet', 500);
    }

} catch(PDOException $e) {
    error_log("Project share error: " . $e->getMessage());
    jsonError('Erreur lors du partage du projet', 500);
}
