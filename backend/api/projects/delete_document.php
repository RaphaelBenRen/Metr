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

    // Get document and verify ownership OR shared access with editor role
    $query = "SELECT pd.*,
              CASE WHEN p.user_id = :user_id THEN 1 ELSE 0 END as is_owner,
              ps.role as shared_role
              FROM project_documents pd
              JOIN projects p ON pd.project_id = p.id
              LEFT JOIN project_shares ps ON p.id = ps.project_id AND ps.shared_with_user_id = :user_id
              WHERE pd.id = :id AND (p.user_id = :user_id OR ps.shared_with_user_id = :user_id)";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $docId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $document = $stmt->fetch();

    if (!$document) {
        jsonError('Document non trouvé', 404);
    }

    // Vérifier les droits d'édition
    $canEdit = $document['is_owner'] || ($document['shared_role'] === 'editor');
    if (!$canEdit) {
        jsonError('Vous n\'avez pas les droits pour supprimer ce document', 403);
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
