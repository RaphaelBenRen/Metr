<?php
/**
 * Endpoint de callback Google OAuth
 * Reçoit le code d'autorisation, l'échange contre un token,
 * récupère les infos utilisateur et crée/connecte l'utilisateur
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/google_oauth.php';

session_start();

// Créer un fichier de log pour debug
$logFile = __DIR__ . '/../../logs/google_callback.log';
$debugLog = "=== Google Callback - " . date('Y-m-d H:i:s') . " ===\n";
$debugLog .= "GET: " . json_encode($_GET) . "\n";
$debugLog .= "Session ID: " . session_id() . "\n";

try {
    // Vérifier la présence du code
    if (!isset($_GET['code'])) {
        throw new Exception('No authorization code received');
    }

    $debugLog .= "Code received\n";

    // Note: On skip la vérification du state pour le moment pour identifier le problème
    // Dans un environnement de production, il faudrait le réactiver

    $code = $_GET['code'];
    $googleOAuth = new GoogleOAuthConfig();

    // Échanger le code contre un token d'accès
    $debugLog .= "Exchanging code for token...\n";
    $tokenData = $googleOAuth->exchangeCodeForToken($code);
    $debugLog .= "Token response: " . json_encode($tokenData) . "\n";

    if (!isset($tokenData['access_token'])) {
        throw new Exception('Failed to obtain access token: ' . json_encode($tokenData));
    }

    // Récupérer les informations utilisateur
    $debugLog .= "Getting user info...\n";
    $userInfo = $googleOAuth->getUserInfo($tokenData['access_token']);
    $debugLog .= "User info: " . json_encode($userInfo) . "\n";

    if (!isset($userInfo['id']) || !isset($userInfo['email'])) {
        throw new Exception('Failed to obtain user information: ' . json_encode($userInfo));
    }

    // Connexion à la base de données
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception('Database connection failed');
    }

    // Vérifier si l'utilisateur existe déjà (par google_id ou email)
    $query = "SELECT * FROM users WHERE google_id = :google_id OR email = :email LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':google_id', $userInfo['id']);
    $stmt->bindParam(':email', $userInfo['email']);
    $stmt->execute();

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Utilisateur existant - mettre à jour le google_id si nécessaire
        if ($user['google_id'] !== $userInfo['id']) {
            $updateQuery = "UPDATE users SET google_id = :google_id, auth_provider = 'google', updated_at = CURRENT_TIMESTAMP WHERE id = :id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bindParam(':google_id', $userInfo['id']);
            $updateStmt->bindParam(':id', $user['id']);
            $updateStmt->execute();
        }

        // Récupérer les données utilisateur à jour
        $query = "SELECT id, nom, prenom, email, entreprise, telephone, photo_profil, role, created_at, updated_at FROM users WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $user['id']);
        $stmt->execute();
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);

    } else {
        // Nouvel utilisateur - créer un compte
        $insertQuery = "INSERT INTO users (nom, prenom, email, google_id, auth_provider, role, created_at, updated_at)
                        VALUES (:nom, :prenom, :email, :google_id, 'google', 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";

        $insertStmt = $db->prepare($insertQuery);

        // Extraire le prénom et nom depuis les données Google
        $prenom = $userInfo['given_name'] ?? '';
        $nom = $userInfo['family_name'] ?? '';

        // Si pas de given_name/family_name, utiliser le name complet
        if (empty($prenom) && empty($nom) && isset($userInfo['name'])) {
            $nameParts = explode(' ', $userInfo['name'], 2);
            $prenom = $nameParts[0] ?? '';
            $nom = $nameParts[1] ?? '';
        }

        $insertStmt->bindParam(':nom', $nom);
        $insertStmt->bindParam(':prenom', $prenom);
        $insertStmt->bindParam(':email', $userInfo['email']);
        $insertStmt->bindParam(':google_id', $userInfo['id']);
        $insertStmt->execute();

        $userId = $db->lastInsertId();

        // Récupérer les données du nouvel utilisateur
        $query = "SELECT id, nom, prenom, email, entreprise, telephone, photo_profil, role, created_at, updated_at FROM users WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Créer la session utilisateur
    $_SESSION['user_id'] = $userData['id'];
    $_SESSION['user_role'] = $userData['role'];

    $debugLog .= "Session created - User ID: " . $userData['id'] . "\n";
    $debugLog .= "SUCCESS\n";

    // Sauvegarder les logs
    @file_put_contents($logFile, $debugLog . "\n", FILE_APPEND);

    // Rediriger vers le frontend avec succès
    $frontendUrl = 'http://localhost:5174';
    header("Location: $frontendUrl?google_login=success");
    exit();

} catch(Exception $e) {
    $debugLog .= "ERROR: " . $e->getMessage() . "\n";
    $debugLog .= "Trace: " . $e->getTraceAsString() . "\n";

    // Sauvegarder les logs
    @file_put_contents($logFile, $debugLog . "\n", FILE_APPEND);

    // Rediriger vers le frontend avec erreur
    $frontendUrl = 'http://localhost:5174';
    $errorMessage = urlencode($e->getMessage());
    header("Location: $frontendUrl?google_login=error&message=$errorMessage");
    exit();
}
