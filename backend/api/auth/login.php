<?php
/**
 * Login API - Authentification simple avec sessions PHP
 */

session_start();

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Méthode non autorisée', 405);
}

// Récupérer les données
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['email']) || !isset($input['password'])) {
    jsonError('Email et mot de passe requis');
}

$email = sanitizeInput($input['email']);
$password = $input['password'];

// Valider l'email
if (!validateEmail($email)) {
    jsonError('Email invalide');
}

// Connexion à la base de données
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

// Rechercher l'utilisateur
try {
    $query = "SELECT * FROM users WHERE email = :email LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    $user = $stmt->fetch();

    if (!$user) {
        jsonError('Identifiants incorrects');
    }

    // Vérifier le mot de passe
    if (!password_verify($password, $user['password'])) {
        jsonError('Identifiants incorrects');
    }

    // Créer la session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['user_nom'] = $user['nom'];
    $_SESSION['user_prenom'] = $user['prenom'];

    // Retourner les données utilisateur (sans le password)
    unset($user['password']);

    jsonSuccess($user, 'Connexion réussie');

} catch(PDOException $e) {
    error_log("Login error: " . $e->getMessage());
    jsonError('Erreur lors de la connexion', 500);
}
