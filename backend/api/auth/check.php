<?php
/**
 * Check Auth API - Vérifier si l'utilisateur est authentifié
 */

session_start();

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

// Vérifier si l'utilisateur est connecté
if (!isAuthenticated()) {
    jsonError('Non authentifié', 401);
}

// Connexion à la base de données
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    // Récupérer les données de l'utilisateur
    $userId = getCurrentUserId();
    $query = "SELECT * FROM users WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $userId);
    $stmt->execute();

    $user = $stmt->fetch();

    if (!$user) {
        // Session invalide
        session_unset();
        session_destroy();
        jsonError('Session invalide', 401);
    }

    // Retourner les données utilisateur (sans le password)
    unset($user['password']);

    jsonSuccess($user);

} catch(PDOException $e) {
    error_log("Check auth error: " . $e->getMessage());
    jsonError('Erreur lors de la vérification', 500);
}
