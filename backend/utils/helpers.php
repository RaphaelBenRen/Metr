<?php
/**
 * Fonctions utilitaires pour l'application
 */

/**
 * Valider une adresse email
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

/**
 * Valider un mot de passe (minimum 6 caractères)
 */
function validatePassword($password) {
    return strlen($password) >= 6;
}

/**
 * Retourner une réponse JSON
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

/**
 * Retourner une erreur JSON
 */
function jsonError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'error' => $message
    ]);
    exit();
}

/**
 * Retourner un succès JSON
 */
function jsonSuccess($data, $message = null) {
    echo json_encode([
        'success' => true,
        'data' => $data,
        'message' => $message
    ]);
    exit();
}

/**
 * Vérifier si l'utilisateur est authentifié
 */
function isAuthenticated() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Vérifier si l'utilisateur est admin
 */
function isAdmin() {
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
}

/**
 * Obtenir l'ID de l'utilisateur connecté
 */
function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

/**
 * Protéger une route (nécessite authentification)
 */
function requireAuth() {
    if (!isAuthenticated()) {
        jsonError('Non authentifié', 401);
    }
}

/**
 * Protéger une route admin (nécessite rôle admin)
 */
function requireAdmin() {
    requireAuth();
    if (!isAdmin()) {
        jsonError('Accès refusé - Droits administrateur requis', 403);
    }
}

/**
 * Sanitize input
 */
function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

/**
 * Uploader un fichier
 */
function uploadFile($file, $uploadDir, $allowedTypes = []) {
    // Vérifier si le fichier existe
    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'error' => 'Erreur lors de l\'upload du fichier'];
    }

    // Vérifier le type de fichier
    $fileType = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!empty($allowedTypes) && !in_array($fileType, $allowedTypes)) {
        return ['success' => false, 'error' => 'Type de fichier non autorisé'];
    }

    // Générer un nom de fichier unique
    $fileName = uniqid() . '_' . basename($file['name']);
    $targetPath = $uploadDir . $fileName;

    // Créer le dossier si nécessaire
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Déplacer le fichier
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        return [
            'success' => true,
            'fileName' => $fileName,
            'filePath' => $targetPath,
            'originalName' => $file['name'],
            'fileSize' => $file['size'],
            'fileType' => $fileType
        ];
    }

    return ['success' => false, 'error' => 'Erreur lors du déplacement du fichier'];
}
