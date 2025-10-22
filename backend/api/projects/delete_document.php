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
    jsonError('ID manquant');
}

$docId = $_GET['id'];

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();

    // Get document and verify ownership
    $query = "SELECT pd.*, p.user_id
              FROM project_documents pd
              JOIN projects p ON pd.project_id = p.id
              WHERE pd.id = :id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $docId);
    $stmt->execute();

    $document = $stmt->fetch();

    if (!$document) {
        jsonError('Document non trouvé', 404);
    }

    if ($document['user_id'] != $userId) {
        jsonError('Accès refusé', 403);
    }

    // Delete file from filesystem
    if (file_exists($document['chemin_fichier'])) {
        unlink($document['chemin_fichier']);
    }

    // Delete from database
    $query = "DELETE FROM project_documents WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $docId);

    if ($stmt->execute()) {
        jsonSuccess(null, 'Document supprimé avec succès');
    } else {
        jsonError('Erreur lors de la suppression');
    }

} catch(PDOException $e) {
    error_log("Delete document error: " . $e->getMessage());
    jsonError('Erreur lors de la suppression', 500);
}
