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
    $projectId = $_GET['id'];

    $query = "DELETE FROM projects WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $projectId);

    if ($stmt->execute()) {
        jsonSuccess(null, 'Projet supprimé avec succès');
    } else {
        jsonError('Erreur lors de la suppression', 500);
    }
} catch(PDOException $e) {
    error_log("Admin delete project error: " . $e->getMessage());
    jsonError('Erreur lors de la suppression', 500);
}
