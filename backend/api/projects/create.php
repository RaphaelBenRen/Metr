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

if (!$input || !isset($input['nom_projet']) || !isset($input['client']) || !isset($input['typologie'])) {
    jsonError('Données manquantes');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();

    // Prepare all variables for bindParam (bindParam requires variables, not expressions)
    $nom_projet = $input['nom_projet'];
    $client = $input['client'];
    $reference_interne = $input['reference_interne'] ?? null;
    $typologie = $input['typologie'];
    $phase = $input['phase'] ?? 'Esquisse';
    $adresse = $input['adresse'] ?? null;
    $date_livraison_prevue = (!empty($input['date_livraison_prevue']) && $input['date_livraison_prevue'] !== '') ? $input['date_livraison_prevue'] : null;
    $statut = $input['statut'] ?? 'Brouillon';

    // Auto-assign folder based on status or use provided folder_id
    $folder_id = $input['folder_id'] ?? null;

    if ($folder_id === null) {
        // If no folder_id provided, auto-assign based on status
        if ($statut === 'Archivé') {
            // Get "Archivés" folder
            $folderQuery = "SELECT id FROM project_folders WHERE user_id = :user_id AND nom = 'Archivés' AND is_system = 1 LIMIT 1";
            $folderStmt = $db->prepare($folderQuery);
            $folderStmt->bindParam(':user_id', $userId);
            $folderStmt->execute();
            $folder_id = $folderStmt->fetchColumn();
        } else {
            // Get "Mes projets" folder
            $folderQuery = "SELECT id FROM project_folders WHERE user_id = :user_id AND nom = 'Mes projets' AND is_system = 1 LIMIT 1";
            $folderStmt = $db->prepare($folderQuery);
            $folderStmt->bindParam(':user_id', $userId);
            $folderStmt->execute();
            $folder_id = $folderStmt->fetchColumn();
        }
    }

    $query = "INSERT INTO projects (user_id, folder_id, nom_projet, client, reference_interne, typologie, phase, adresse, date_livraison_prevue, statut)
              VALUES (:user_id, :folder_id, :nom_projet, :client, :reference_interne, :typologie, :phase, :adresse, :date_livraison_prevue, :statut)";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':folder_id', $folder_id);
    $stmt->bindParam(':nom_projet', $nom_projet);
    $stmt->bindParam(':client', $client);
    $stmt->bindParam(':reference_interne', $reference_interne);
    $stmt->bindParam(':typologie', $typologie);
    $stmt->bindParam(':phase', $phase);
    $stmt->bindParam(':adresse', $adresse);
    $stmt->bindParam(':date_livraison_prevue', $date_livraison_prevue);
    $stmt->bindParam(':statut', $statut);

    if ($stmt->execute()) {
        $projectId = $db->lastInsertId();

        $query = "SELECT * FROM projects WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $projectId);
        $stmt->execute();
        $project = $stmt->fetch();

        jsonSuccess($project, 'Projet créé avec succès');
    } else {
        jsonError('Erreur lors de la création du projet', 500);
    }
} catch(PDOException $e) {
    error_log("Project create error: " . $e->getMessage());
    jsonError('Erreur lors de la création du projet', 500);
}
