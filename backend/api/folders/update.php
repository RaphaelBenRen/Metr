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

if (!$input || !isset($input['id'])) {
    jsonError('ID du dossier manquant');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $folderId = $input['id'];

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

    // Ne pas permettre de modifier les dossiers système
    if ($folder['is_system']) {
        jsonError('Impossible de modifier un dossier système', 403);
    }

    // Construire la requête de mise à jour
    $fields = [];
    $params = [':id' => $folderId];

    if (isset($input['nom'])) {
        $fields[] = 'nom = :nom';
        $params[':nom'] = $input['nom'];
    }
    if (isset($input['couleur'])) {
        $fields[] = 'couleur = :couleur';
        $params[':couleur'] = $input['couleur'];
    }
    if (isset($input['parent_folder_id'])) {
        // Vérifier que le nouveau parent existe et n'est pas un sous-dossier
        if ($input['parent_folder_id'] !== null) {
            $query = "SELECT id FROM project_folders WHERE id = :id AND user_id = :user_id LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $input['parent_folder_id']);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                jsonError('Dossier parent non trouvé', 404);
            }
        }
        $fields[] = 'parent_folder_id = :parent_folder_id';
        $params[':parent_folder_id'] = $input['parent_folder_id'];
    }
    if (isset($input['position'])) {
        $fields[] = 'position = :position';
        $params[':position'] = $input['position'];
    }

    if (empty($fields)) {
        jsonError('Aucune donnée à mettre à jour');
    }

    $query = "UPDATE project_folders SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }

    if ($stmt->execute()) {
        $query = "SELECT * FROM project_folders WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $folderId);
        $stmt->execute();
        $folder = $stmt->fetch();

        jsonSuccess($folder, 'Dossier mis à jour avec succès');
    } else {
        jsonError('Erreur lors de la mise à jour du dossier', 500);
    }
} catch(PDOException $e) {
    error_log("Folder update error: " . $e->getMessage());
    jsonError('Erreur lors de la mise à jour du dossier', 500);
}
