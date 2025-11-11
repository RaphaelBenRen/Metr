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
    jsonError('ID du projet manquant');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $projectId = $input['id'];

    // Vérifier que l'utilisateur a accès au projet avec droits d'édition (propriétaire ou éditeur)
    $query = "SELECT p.*,
              CASE WHEN p.user_id = :user_id THEN 1 ELSE 0 END as is_owner,
              ps.role as shared_role
              FROM projects p
              LEFT JOIN project_shares ps ON p.id = ps.project_id AND ps.shared_with_user_id = :user_id
              WHERE p.id = :id AND (p.user_id = :user_id OR ps.shared_with_user_id = :user_id)
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $projectId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $project = $stmt->fetch();

    if (!$project) {
        jsonError('Projet non trouvé ou accès non autorisé', 404);
    }

    // Vérifier les droits d'édition (propriétaire ou éditeur)
    $isOwner = $project['is_owner'];
    $canEdit = $isOwner || ($project['shared_role'] === 'editor');

    if (!$canEdit) {
        jsonError('Vous n\'avez pas les droits pour modifier ce projet', 403);
    }

    // Construire la requête de mise à jour dynamiquement
    $fields = [];
    $params = [':id' => $projectId];

    if (isset($input['nom_projet'])) {
        $fields[] = 'nom_projet = :nom_projet';
        $params[':nom_projet'] = $input['nom_projet'];
    }
    if (isset($input['client'])) {
        $fields[] = 'client = :client';
        $params[':client'] = $input['client'];
    }
    if (isset($input['reference_interne'])) {
        $fields[] = 'reference_interne = :reference_interne';
        $params[':reference_interne'] = $input['reference_interne'];
    }
    if (isset($input['typologie'])) {
        $fields[] = 'typologie = :typologie';
        $params[':typologie'] = $input['typologie'];
    }
    if (isset($input['phase'])) {
        $fields[] = 'phase = :phase';
        $params[':phase'] = $input['phase'];
    }
    if (isset($input['adresse'])) {
        $fields[] = 'adresse = :adresse';
        $params[':adresse'] = $input['adresse'];
    }
    if (isset($input['date_livraison_prevue'])) {
        $fields[] = 'date_livraison_prevue = :date_livraison_prevue';
        $params[':date_livraison_prevue'] = (!empty($input['date_livraison_prevue']) && $input['date_livraison_prevue'] !== '') ? $input['date_livraison_prevue'] : null;
    }
    if (isset($input['statut'])) {
        $fields[] = 'statut = :statut';
        $params[':statut'] = $input['statut'];

        // Auto-assign folder based on status change (only if user is owner)
        if ($isOwner) {
            $newStatus = $input['statut'];
            $folder_id = null;

            if ($newStatus === 'Archivé') {
                // Get "Archivés" folder (using LIKE for encoding issues)
                $folderQuery = "SELECT id FROM project_folders WHERE user_id = :user_id AND nom LIKE 'Archiv%' AND is_system = 1 LIMIT 1";
                $folderStmt = $db->prepare($folderQuery);
                $folderStmt->bindParam(':user_id', $userId);
                $folderStmt->execute();
                $folder_id = $folderStmt->fetchColumn();

                // Fallback if not found
                if (!$folder_id) {
                    $folderQuery = "SELECT id FROM project_folders WHERE user_id = :user_id AND (nom = 'Archivés' OR nom = 'ArchivÃ©s') AND is_system = 1 LIMIT 1";
                    $folderStmt = $db->prepare($folderQuery);
                    $folderStmt->bindParam(':user_id', $userId);
                    $folderStmt->execute();
                    $folder_id = $folderStmt->fetchColumn();
                }
            } else if ($project['statut'] === 'Archivé' && $newStatus !== 'Archivé') {
                // Moving out of archived, put back in "Mes projets"
                $folderQuery = "SELECT id FROM project_folders WHERE user_id = :user_id AND nom LIKE 'Mes projet%' AND is_system = 1 LIMIT 1";
                $folderStmt = $db->prepare($folderQuery);
                $folderStmt->bindParam(':user_id', $userId);
                $folderStmt->execute();
                $folder_id = $folderStmt->fetchColumn();
            }

            if ($folder_id !== null) {
                $fields[] = 'folder_id = :folder_id';
                $params[':folder_id'] = $folder_id;
            }
        }
    }

    if (empty($fields)) {
        jsonError('Aucune donnée à mettre à jour');
    }

    $query = "UPDATE projects SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }

    if ($stmt->execute()) {
        // Récupérer le projet mis à jour
        $query = "SELECT * FROM projects WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $projectId);
        $stmt->execute();
        $project = $stmt->fetch();

        jsonSuccess($project, 'Projet mis à jour avec succès');
    } else {
        jsonError('Erreur lors de la mise à jour du projet', 500);
    }
} catch(PDOException $e) {
    error_log("Project update error: " . $e->getMessage());
    jsonError('Erreur lors de la mise à jour du projet', 500);
}
