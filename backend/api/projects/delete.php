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
    jsonError('ID du projet manquant');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $projectId = $_GET['id'];

    // Vérifier que le projet appartient à l'utilisateur
    $query = "SELECT * FROM projects WHERE id = :id AND user_id = :user_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $projectId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonError('Projet non trouvé ou accès non autorisé', 404);
    }

    // Supprimer le projet
    $query = "DELETE FROM projects WHERE id = :id AND user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $projectId);
    $stmt->bindParam(':user_id', $userId);

    if ($stmt->execute()) {
        jsonSuccess(null, 'Projet supprimé avec succès');
    } else {
        jsonError('Erreur lors de la suppression du projet', 500);
    }
} catch(PDOException $e) {
    error_log("Project delete error: " . $e->getMessage());
    jsonError('Erreur lors de la suppression du projet', 500);
}
