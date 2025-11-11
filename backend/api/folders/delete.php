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
    jsonError('ID du dossier manquant');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $folderId = $_GET['id'];

    // Vérifier que le dossier appartient à l'utilisateur
    $query = "SELECT * FROM project_folders WHERE id = :id AND user_id = :user_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $folderId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $folder = $stmt->fetch();

    if (!$folder) {
        jsonError('Dossier non trouvé', 404);
    }

    // Ne pas permettre de supprimer les dossiers système
    if ($folder['is_system']) {
        jsonError('Impossible de supprimer un dossier système', 403);
    }

    // Get "Mes projets" folder ID
    $query = "SELECT id FROM project_folders WHERE user_id = :user_id AND nom = 'Mes projets' AND is_system = 1 LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $mesProjetsFolderId = $stmt->fetchColumn();

    // Helper function to get all sub-folders recursively
    function getAllSubFolderIds($db, $parentId) {
        $ids = [$parentId];
        $query = "SELECT id FROM project_folders WHERE parent_folder_id = :parent_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':parent_id', $parentId);
        $stmt->execute();
        $subFolders = $stmt->fetchAll();

        foreach ($subFolders as $subFolder) {
            $ids = array_merge($ids, getAllSubFolderIds($db, $subFolder['id']));
        }

        return $ids;
    }

    // Get all folder IDs to delete (including sub-folders)
    $folderIdsToDelete = getAllSubFolderIds($db, $folderId);

    // Move all projects from these folders to "Mes projets"
    $placeholders = implode(',', array_fill(0, count($folderIdsToDelete), '?'));
    $query = "UPDATE projects SET folder_id = ? WHERE folder_id IN ($placeholders)";
    $stmt = $db->prepare($query);
    $params = array_merge([$mesProjetsFolderId], $folderIdsToDelete);
    $stmt->execute($params);

    // Delete all folders (parent and sub-folders)
    $query = "DELETE FROM project_folders WHERE id IN ($placeholders)";
    $stmt = $db->prepare($query);

    if ($stmt->execute($folderIdsToDelete)) {
        jsonSuccess(null, 'Dossier supprimé avec succès');
    } else {
        jsonError('Erreur lors de la suppression du dossier', 500);
    }
} catch(PDOException $e) {
    error_log("Folder delete error: " . $e->getMessage());
    jsonError('Erreur lors de la suppression du dossier', 500);
}
