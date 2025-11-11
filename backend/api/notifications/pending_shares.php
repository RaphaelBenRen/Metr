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

    // Get pending project share requests for this user
    $query = "SELECT
                ps.id,
                ps.project_id,
                ps.role,
                ps.created_at,
                p.nom_projet,
                p.client,
                p.typologie,
                u.nom as owner_name,
                u.email as owner_email
              FROM project_shares ps
              JOIN projects p ON ps.project_id = p.id
              JOIN users u ON ps.owner_id = u.id
              WHERE ps.shared_with_user_id = :user_id
                AND ps.status = 'pending'
              ORDER BY ps.created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $pendingShares = $stmt->fetchAll();

    jsonSuccess($pendingShares);
} catch(PDOException $e) {
    error_log("Pending shares error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des notifications', 500);
}
