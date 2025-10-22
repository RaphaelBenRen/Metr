<?php
/**
 * Version debug du callback Google OAuth
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/google_oauth.php';

// Activer l'affichage des erreurs
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();

// Logger pour debug
$log = [];
$log[] = "=== DEBUG GOOGLE CALLBACK ===";
$log[] = "Time: " . date('Y-m-d H:i:s');
$log[] = "GET params: " . json_encode($_GET);
$log[] = "Session ID: " . session_id();
$log[] = "Session data: " . json_encode($_SESSION);

try {
    // Vérifier le state
    $log[] = "Checking state...";
    $log[] = "GET state: " . ($_GET['state'] ?? 'NOT SET');
    $log[] = "SESSION state: " . ($_SESSION['google_oauth_state'] ?? 'NOT SET');

    if (!isset($_GET['state']) || !isset($_SESSION['google_oauth_state'])) {
        throw new Exception('State not set in GET or SESSION');
    }

    if ($_GET['state'] !== $_SESSION['google_oauth_state']) {
        throw new Exception('Invalid state parameter - CSRF protection');
    }
    $log[] = "State OK";

    // Vérifier le code
    if (!isset($_GET['code'])) {
        throw new Exception('No authorization code received');
    }
    $log[] = "Code received: " . substr($_GET['code'], 0, 20) . "...";

    $code = $_GET['code'];
    $googleOAuth = new GoogleOAuthConfig();

    // Échanger le code
    $log[] = "Exchanging code for token...";
    $tokenData = $googleOAuth->exchangeCodeForToken($code);
    $log[] = "Token data: " . json_encode($tokenData);

    if (!isset($tokenData['access_token'])) {
        throw new Exception('Failed to obtain access token');
    }
    $log[] = "Access token OK";

    // Récupérer les infos utilisateur
    $log[] = "Getting user info...";
    $userInfo = $googleOAuth->getUserInfo($tokenData['access_token']);
    $log[] = "User info: " . json_encode($userInfo);

    if (!isset($userInfo['id']) || !isset($userInfo['email'])) {
        throw new Exception('Failed to obtain user information');
    }
    $log[] = "User info OK - Email: " . $userInfo['email'];

    // Connexion BDD
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception('Database connection failed');
    }
    $log[] = "Database connected";

    // Chercher utilisateur
    $query = "SELECT * FROM users WHERE google_id = :google_id OR email = :email LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':google_id', $userInfo['id']);
    $stmt->bindParam(':email', $userInfo['email']);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $log[] = "Existing user found: ID " . $user['id'];

        if ($user['google_id'] !== $userInfo['id']) {
            $log[] = "Updating google_id...";
            $updateQuery = "UPDATE users SET google_id = :google_id, auth_provider = 'google', updated_at = CURRENT_TIMESTAMP WHERE id = :id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bindParam(':google_id', $userInfo['id']);
            $updateStmt->bindParam(':id', $user['id']);
            $updateStmt->execute();
            $log[] = "User updated";
        }

        $query = "SELECT id, nom, prenom, email, entreprise, telephone, photo_profil, role, created_at, updated_at FROM users WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $user['id']);
        $stmt->execute();
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);

    } else {
        $log[] = "New user - creating account...";

        $prenom = $userInfo['given_name'] ?? '';
        $nom = $userInfo['family_name'] ?? '';

        if (empty($prenom) && empty($nom) && isset($userInfo['name'])) {
            $nameParts = explode(' ', $userInfo['name'], 2);
            $prenom = $nameParts[0] ?? '';
            $nom = $nameParts[1] ?? '';
        }

        $log[] = "Name: $prenom $nom";

        $insertQuery = "INSERT INTO users (nom, prenom, email, google_id, auth_provider, role, created_at, updated_at)
                        VALUES (:nom, :prenom, :email, :google_id, 'google', 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";

        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->bindParam(':nom', $nom);
        $insertStmt->bindParam(':prenom', $prenom);
        $insertStmt->bindParam(':email', $userInfo['email']);
        $insertStmt->bindParam(':google_id', $userInfo['id']);
        $insertStmt->execute();

        $userId = $db->lastInsertId();
        $log[] = "User created with ID: " . $userId;

        $query = "SELECT id, nom, prenom, email, entreprise, telephone, photo_profil, role, created_at, updated_at FROM users WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Créer session
    $_SESSION['user_id'] = $userData['id'];
    $_SESSION['user_role'] = $userData['role'];
    $log[] = "Session created - user_id: " . $userData['id'];

    // Sauvegarder les logs
    file_put_contents(__DIR__ . '/../../logs/google_callback.log', implode("\n", $log) . "\n\n", FILE_APPEND);

    // Redirection
    $frontendUrl = 'http://localhost:5174';
    $log[] = "Redirecting to: $frontendUrl?google_login=success";

    // Afficher les logs pour debug
    echo "<pre>" . implode("\n", $log) . "</pre>";
    echo "<p>Redirection dans 5 secondes...</p>";
    echo "<meta http-equiv='refresh' content='5;url=$frontendUrl?google_login=success'>";

} catch(Exception $e) {
    $log[] = "ERROR: " . $e->getMessage();
    $log[] = "Trace: " . $e->getTraceAsString();

    // Sauvegarder les logs
    @file_put_contents(__DIR__ . '/../../logs/google_callback.log', implode("\n", $log) . "\n\n", FILE_APPEND);

    echo "<pre>" . implode("\n", $log) . "</pre>";

    $frontendUrl = 'http://localhost:5174';
    $errorMessage = urlencode($e->getMessage());
    echo "<p>Erreur détectée. Redirection dans 5 secondes...</p>";
    echo "<meta http-equiv='refresh' content='5;url=$frontendUrl?google_login=error&message=$errorMessage'>";
}
