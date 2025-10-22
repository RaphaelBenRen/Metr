<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

$userId = getCurrentUserId();

// GET - Récupérer le profil de l'utilisateur
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "SELECT id, nom, prenom, email, entreprise, telephone, photo_profil, role, created_at, updated_at
                  FROM users WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();

        $user = $stmt->fetch();

        if ($user) {
            jsonSuccess($user, 'Profil récupéré avec succès');
        } else {
            jsonError('Utilisateur non trouvé', 404);
        }
    } catch(PDOException $e) {
        error_log("Get user error: " . $e->getMessage());
        jsonError('Erreur lors de la récupération du profil', 500);
    }
}

// PUT - Mettre à jour le profil de l'utilisateur
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        jsonError('Aucune donnée fournie');
    }

    try {
        // Construire la requête de mise à jour
        $fields = [];
        $params = [':id' => $userId];

        if (isset($input['nom'])) {
            $fields[] = 'nom = :nom';
            $params[':nom'] = sanitizeInput($input['nom']);
        }
        if (isset($input['prenom'])) {
            $fields[] = 'prenom = :prenom';
            $params[':prenom'] = sanitizeInput($input['prenom']);
        }
        if (isset($input['email'])) {
            if (!validateEmail($input['email'])) {
                jsonError('Email invalide');
            }
            // Vérifier si l'email n'est pas déjà utilisé
            $query = "SELECT id FROM users WHERE email = :email AND id != :id LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':email', $input['email']);
            $stmt->bindParam(':id', $userId);
            $stmt->execute();
            if ($stmt->rowCount() > 0) {
                jsonError('Cet email est déjà utilisé');
            }
            $fields[] = 'email = :email';
            $params[':email'] = sanitizeInput($input['email']);
        }
        if (isset($input['entreprise'])) {
            $fields[] = 'entreprise = :entreprise';
            $params[':entreprise'] = sanitizeInput($input['entreprise']);
        }
        if (isset($input['telephone'])) {
            $fields[] = 'telephone = :telephone';
            $params[':telephone'] = sanitizeInput($input['telephone']);
        }

        if (empty($fields)) {
            jsonError('Aucune donnée à mettre à jour');
        }

        $query = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $db->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        if ($stmt->execute()) {
            // Récupérer l'utilisateur mis à jour
            $query = "SELECT id, nom, prenom, email, entreprise, telephone, photo_profil, role, created_at, updated_at
                      FROM users WHERE id = :id LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $userId);
            $stmt->execute();
            $user = $stmt->fetch();

            // Mettre à jour la session
            $_SESSION['user_nom'] = $user['nom'];
            $_SESSION['user_prenom'] = $user['prenom'];
            $_SESSION['user_email'] = $user['email'];

            jsonSuccess($user, 'Profil mis à jour avec succès');
        } else {
            jsonError('Erreur lors de la mise à jour du profil', 500);
        }
    } catch(PDOException $e) {
        error_log("Update user error: " . $e->getMessage());
        jsonError('Erreur lors de la mise à jour du profil', 500);
    }
}

else {
    jsonError('Méthode non autorisée', 405);
}
