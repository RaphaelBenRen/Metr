<?php
/**
 * Logout API - Déconnexion et destruction de session
 */

session_start();

require_once '../../config/cors.php';

// Détruire la session
session_unset();
session_destroy();

// Supprimer le cookie de session
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

echo json_encode([
    'success' => true,
    'message' => 'Déconnexion réussie'
]);
