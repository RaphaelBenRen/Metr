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

    // Get project stats (owned + shared with status accepted)
    $query = "SELECT
                COUNT(*) as total_projects,
                COALESCE(SUM(CASE WHEN p.statut IN ('En cours', 'Brouillon') THEN 1 ELSE 0 END), 0) as projets_actifs,
                COALESCE(SUM(CASE WHEN p.statut = 'Archivé' THEN 1 ELSE 0 END), 0) as projets_archives
              FROM projects p
              WHERE p.user_id = :user_id
                 OR EXISTS (SELECT 1 FROM project_shares WHERE project_id = p.id AND shared_with_user_id = :user_id2 AND status = 'accepted')";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':user_id2', $userId);
    $stmt->execute();
    $stats = $stmt->fetch();

    // Ensure all values are integers
    $stats['total_projects'] = (int)$stats['total_projects'];
    $stats['projets_actifs'] = (int)$stats['projets_actifs'];
    $stats['projets_archives'] = (int)$stats['projets_archives'];

    // Get current month stats
    $currentMonth = date('Y-m-01');
    $query = "SELECT exports_realises FROM statistics
              WHERE user_id = :user_id AND mois = :mois LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':mois', $currentMonth);
    $stmt->execute();
    $monthStats = $stmt->fetch();

    $stats['exports_realises'] = $monthStats ? $monthStats['exports_realises'] : 0;

    jsonSuccess($stats);
} catch(PDOException $e) {
    error_log("User stats error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des statistiques', 500);
}
