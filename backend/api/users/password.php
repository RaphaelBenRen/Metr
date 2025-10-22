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

if (!$input || !isset($input['currentPassword']) || !isset($input['newPassword'])) {
    jsonError('Mot de passe actuel et nouveau mot de passe requis');
}

$currentPassword = $input['currentPassword'];
$newPassword = $input['newPassword'];

// Validation du nouveau mot de passe
if (strlen($newPassword) < 8) {
    jsonError('Le nouveau mot de passe doit contenir au moins 8 caractères');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();

    // Récupérer le mot de passe actuel
    $query = "SELECT password FROM users WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $userId);
    $stmt->execute();

    $user = $stmt->fetch();

    if (!$user) {
        jsonError('Utilisateur non trouvé', 404);
    }

    // Vérifier le mot de passe actuel
    if (!password_verify($currentPassword, $user['password'])) {
        jsonError('Mot de passe actuel incorrect');
    }

    // Hasher le nouveau mot de passe
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    // Mettre à jour le mot de passe
    $query = "UPDATE users SET password = :password WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':password', $hashedPassword);
    $stmt->bindParam(':id', $userId);

    if ($stmt->execute()) {
        jsonSuccess(null, 'Mot de passe modifié avec succès');
    } else {
        jsonError('Erreur lors de la modification du mot de passe', 500);
    }
} catch(PDOException $e) {
    error_log("Password change error: " . $e->getMessage());
    jsonError('Erreur lors de la modification du mot de passe', 500);
}
