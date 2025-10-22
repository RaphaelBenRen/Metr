<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonError('Méthode non autorisée', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['id'])) {
    jsonError('Données manquantes');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = $input['id'];

    // Build dynamic update query
    $updates = [];
    $params = [':id' => $userId];

    $allowedFields = ['nom', 'prenom', 'email', 'entreprise', 'telephone', 'role'];

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = :$field";
            $params[":$field"] = $input[$field];
        }
    }

    // Handle password change (admin can change without knowing old password)
    if (isset($input['password']) && !empty($input['password'])) {
        if (strlen($input['password']) < 6) {
            jsonError('Le mot de passe doit contenir au moins 6 caractères');
        }
        $updates[] = "password = :password";
        $params[":password"] = password_hash($input['password'], PASSWORD_DEFAULT);
    }

    if (empty($updates)) {
        jsonError('Aucune donnée à mettre à jour');
    }

    $query = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :id";
    $stmt = $db->prepare($query);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }

    if ($stmt->execute()) {
        // Get updated user
        $query = "SELECT id, nom, prenom, email, entreprise, telephone, role, created_at, updated_at
                  FROM users WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        $user = $stmt->fetch();

        jsonSuccess($user, 'Utilisateur mis à jour avec succès');
    } else {
        jsonError('Erreur lors de la mise à jour', 500);
    }
} catch(PDOException $e) {
    error_log("Admin update user error: " . $e->getMessage());
    jsonError('Erreur lors de la mise à jour', 500);
}
