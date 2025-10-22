<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    jsonError('Méthode non autorisée', 405);
}

if (!isset($_GET['id'])) {
    jsonError('ID de la bibliothèque manquant');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $libraryId = $_GET['id'];

    // Vérifier que la bibliothèque appartient à l'utilisateur
    $query = "SELECT * FROM libraries WHERE id = :id AND user_id = :user_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $libraryId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonError('Bibliothèque non trouvée ou accès non autorisé', 404);
    }

    // Supprimer les articles associés
    $query = "DELETE FROM articles WHERE library_id = :library_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':library_id', $libraryId);
    $stmt->execute();

    // Supprimer la bibliothèque
    $query = "DELETE FROM libraries WHERE id = :id AND user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $libraryId);
    $stmt->bindParam(':user_id', $userId);

    if ($stmt->execute()) {
        jsonSuccess(null, 'Bibliothèque supprimée avec succès');
    } else {
        jsonError('Erreur lors de la suppression de la bibliothèque', 500);
    }
} catch(PDOException $e) {
    error_log("Library delete error: " . $e->getMessage());
    jsonError('Erreur lors de la suppression de la bibliothèque', 500);
}
