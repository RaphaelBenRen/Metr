<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->share_id)) {
        jsonError('ID de partage manquant', 400);
    }

    $shareId = $data->share_id;

    // Verify that this share belongs to the current user
    $verifyQuery = "SELECT id FROM project_shares WHERE id = :share_id AND shared_with_user_id = :user_id AND status = 'pending'";
    $stmt = $db->prepare($verifyQuery);
    $stmt->bindParam(':share_id', $shareId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonError('Partage non trouvé ou déjà traité', 404);
    }

    // Delete the share (user rejected it)
    $deleteQuery = "DELETE FROM project_shares WHERE id = :share_id";
    $stmt = $db->prepare($deleteQuery);
    $stmt->bindParam(':share_id', $shareId);
    $stmt->execute();

    jsonSuccess(['message' => 'Partage refusé avec succès']);
} catch(PDOException $e) {
    error_log("Reject share error: " . $e->getMessage());
    jsonError('Erreur lors du refus du partage', 500);
}
