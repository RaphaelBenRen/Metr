<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Méthode non autorisée', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['nom'])) {
    jsonError('Nom du dossier manquant');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $nom = $input['nom'];
    $parentFolderId = isset($input['parent_folder_id']) ? $input['parent_folder_id'] : null;
    $couleur = isset($input['couleur']) ? $input['couleur'] : '#6366f1';
    $position = isset($input['position']) ? $input['position'] : 999;

    // Vérifier que le dossier parent appartient bien à l'utilisateur
    if ($parentFolderId) {
        $query = "SELECT id FROM project_folders WHERE id = :id AND user_id = :user_id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $parentFolderId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            jsonError('Dossier parent non trouvé', 404);
        }
    }

    // Créer le dossier
    $query = "INSERT INTO project_folders (user_id, parent_folder_id, nom, couleur, position, is_system)
              VALUES (:user_id, :parent_folder_id, :nom, :couleur, :position, 0)";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':parent_folder_id', $parentFolderId);
    $stmt->bindParam(':nom', $nom);
    $stmt->bindParam(':couleur', $couleur);
    $stmt->bindParam(':position', $position);

    if ($stmt->execute()) {
        $folderId = $db->lastInsertId();

        $query = "SELECT * FROM project_folders WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $folderId);
        $stmt->execute();
        $folder = $stmt->fetch();

        jsonSuccess($folder, 'Dossier créé avec succès');
    } else {
        jsonError('Erreur lors de la création du dossier', 500);
    }
} catch(PDOException $e) {
    error_log("Folder create error: " . $e->getMessage());
    jsonError('Erreur lors de la création du dossier', 500);
}
