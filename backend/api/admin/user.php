<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    jsonError('Méthode non autorisée', 405);
}

if (!isset($_GET['id'])) {
    jsonError('ID manquant');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = $_GET['id'];

    // Don't allow deleting yourself
    if ($userId == getCurrentUserId()) {
        jsonError('Vous ne pouvez pas supprimer votre propre compte');
    }

    // Delete user's projects first
    $query = "DELETE FROM projects WHERE user_id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $userId);
    $stmt->execute();

    // Delete user's libraries and associated articles
    $query = "SELECT id FROM libraries WHERE user_id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $userId);
    $stmt->execute();
    $libraries = $stmt->fetchAll();

    foreach ($libraries as $library) {
        // Delete articles in this library
        $query = "DELETE FROM articles WHERE library_id = :lib_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':lib_id', $library['id']);
        $stmt->execute();
    }

    // Delete libraries
    $query = "DELETE FROM libraries WHERE user_id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $userId);
    $stmt->execute();

    // Finally, delete the user
    $query = "DELETE FROM users WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $userId);

    if ($stmt->execute()) {
        jsonSuccess(null, 'Utilisateur supprimé avec succès');
    } else {
        jsonError('Erreur lors de la suppression', 500);
    }
} catch(PDOException $e) {
    error_log("Admin delete user error: " . $e->getMessage());
    jsonError('Erreur lors de la suppression', 500);
}
