<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonError('Méthode non autorisée', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['id'])) {
    jsonError('Données manquantes');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $projectId = $input['id'];

    // Build dynamic update query
    $updates = [];
    $params = [':id' => $projectId];

    $allowedFields = ['nom_projet', 'client', 'reference_interne', 'typologie', 'adresse',
                      'date_livraison_prevue', 'statut', 'surface_totale', 'user_id'];

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = :$field";
            $params[":$field"] = $input[$field];
        }
    }

    if (empty($updates)) {
        jsonError('Aucune donnée à mettre à jour');
    }

    $query = "UPDATE projects SET " . implode(', ', $updates) . " WHERE id = :id";
    $stmt = $db->prepare($query);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }

    if ($stmt->execute()) {
        // Get updated project with user info
        $query = "SELECT p.*, u.nom as user_nom, u.prenom as user_prenom, u.email as user_email
                  FROM projects p
                  LEFT JOIN users u ON p.user_id = u.id
                  WHERE p.id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $projectId);
        $stmt->execute();
        $project = $stmt->fetch();

        jsonSuccess($project, 'Projet mis à jour avec succès');
    } else {
        jsonError('Erreur lors de la mise à jour', 500);
    }
} catch(PDOException $e) {
    error_log("Admin update project error: " . $e->getMessage());
    jsonError('Erreur lors de la mise à jour', 500);
}
