<?php
/**
 * Endpoint pour initier la connexion Google OAuth
 * Génère l'URL d'autorisation Google et la renvoie au frontend
 */

require_once '../../config/cors.php';
require_once '../../config/google_oauth.php';

try {
    $googleOAuth = new GoogleOAuthConfig();

    // Générer un state token pour la sécurité CSRF
    session_start();
    $state = bin2hex(random_bytes(16));
    $_SESSION['google_oauth_state'] = $state;

    // Générer l'URL d'autorisation
    $authUrl = $googleOAuth->getAuthUrl($state);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'auth_url' => $authUrl,
            'client_id' => $googleOAuth->getClientId()
        ]
    ]);

} catch(Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur lors de la génération de l\'URL Google: ' . $e->getMessage()
    ]);
}
