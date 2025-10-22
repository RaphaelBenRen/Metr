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

    // Vérifier que le projet appartient à l'utilisateur
    $query = "SELECT * FROM projects WHERE id = :id AND user_id = :user_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $projectId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonError('Projet non trouvé ou accès non autorisé', 404);
    }

    // Construire la requête de mise à jour dynamiquement
    $fields = [];
    $params = [':id' => $projectId, ':user_id' => $userId];

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
    if (isset($input['adresse'])) {
        $fields[] = 'adresse = :adresse';
        $params[':adresse'] = $input['adresse'];
    }
    if (isset($input['date_livraison_prevue'])) {
        $fields[] = 'date_livraison_prevue = :date_livraison_prevue';
        $params[':date_livraison_prevue'] = $input['date_livraison_prevue'];
    }
    if (isset($input['statut'])) {
        $fields[] = 'statut = :statut';
        $params[':statut'] = $input['statut'];
    }
    if (isset($input['surface_totale'])) {
        $fields[] = 'surface_totale = :surface_totale';
        $params[':surface_totale'] = $input['surface_totale'];
    }

    if (empty($fields)) {
        jsonError('Aucune donnée à mettre à jour');
    }

    $query = "UPDATE projects SET " . implode(', ', $fields) . " WHERE id = :id AND user_id = :user_id";
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
