<?php
/**
 * Register API - Inscription d'un nouvel utilisateur
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

if (!$input) {
    jsonError('Données invalides');
}

// Validation des champs requis
$requiredFields = ['nom', 'prenom', 'email', 'password'];
foreach ($requiredFields as $field) {
    if (!isset($input[$field]) || empty($input[$field])) {
        jsonError("Le champ '$field' est requis");
    }
}

$nom = sanitizeInput($input['nom']);
$prenom = sanitizeInput($input['prenom']);
$email = sanitizeInput($input['email']);
$password = $input['password'];
$entreprise = isset($input['entreprise']) ? sanitizeInput($input['entreprise']) : null;
$telephone = isset($input['telephone']) ? sanitizeInput($input['telephone']) : null;

// Validation
if (!validateEmail($email)) {
    jsonError('Email invalide');
}

if (!validatePassword($password)) {
    jsonError('Le mot de passe doit contenir au moins 6 caractères');
}

// Connexion à la base de données
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    // Vérifier si l'email existe déjà
    $query = "SELECT id FROM users WHERE email = :email LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if ($stmt->fetch()) {
        jsonError('Cet email est déjà utilisé');
    }

    // Hash du mot de passe
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insérer l'utilisateur
    $query = "INSERT INTO users (nom, prenom, email, password, entreprise, telephone, role)
              VALUES (:nom, :prenom, :email, :password, :entreprise, :telephone, 'user')";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':nom', $nom);
    $stmt->bindParam(':prenom', $prenom);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password', $hashedPassword);
    $stmt->bindParam(':entreprise', $entreprise);
    $stmt->bindParam(':telephone', $telephone);

    if ($stmt->execute()) {
        $userId = $db->lastInsertId();

        // Créer une bibliothèque par défaut pour l'utilisateur
        $libQuery = "INSERT INTO libraries (user_id, nom, description)
                     VALUES (:user_id, 'Ma bibliothèque', 'Bibliothèque par défaut')";
        $libStmt = $db->prepare($libQuery);
        $libStmt->bindParam(':user_id', $userId);
        $libStmt->execute();

        // Récupérer les données de l'utilisateur
        $query = "SELECT * FROM users WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        $user = $stmt->fetch();

        // Créer la session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['user_nom'] = $user['nom'];
        $_SESSION['user_prenom'] = $user['prenom'];

        // Retourner les données utilisateur (sans le password)
        unset($user['password']);

        jsonSuccess($user, 'Inscription réussie');
    } else {
        jsonError('Erreur lors de l\'inscription', 500);
    }

} catch(PDOException $e) {
    error_log("Register error: " . $e->getMessage());
    jsonError('Erreur lors de l\'inscription', 500);
}
