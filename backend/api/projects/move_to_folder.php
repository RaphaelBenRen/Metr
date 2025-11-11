<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonError('Méthode non autorisée', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['project_id']) || !array_key_exists('folder_id', $input)) {
    jsonError('project_id et folder_id requis');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $projectId = $input['project_id'];
    $folderId = $input['folder_id'];

    // Vérifier que le projet appartient à l'utilisateur
    $query = "SELECT * FROM projects WHERE id = :id AND user_id = :user_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $projectId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonError('Projet non trouvé ou accès non autorisé', 404);
    }

    // Vérifier que le dossier existe et appartient à l'utilisateur
    if ($folderId !== null) {
        $query = "SELECT id FROM project_folders WHERE id = :id AND user_id = :user_id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $folderId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            jsonError('Dossier non trouvé', 404);
        }
    }

    // Déplacer le projet
    $query = "UPDATE projects SET folder_id = :folder_id WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':folder_id', $folderId);
    $stmt->bindParam(':id', $projectId);

    if ($stmt->execute()) {
        jsonSuccess(null, 'Projet déplacé avec succès');
    } else {
        jsonError('Erreur lors du déplacement du projet', 500);
    }
} catch(PDOException $e) {
    error_log("Move project error: " . $e->getMessage());
    jsonError('Erreur lors du déplacement du projet', 500);
}
