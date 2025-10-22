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

    // Get project stats
    $query = "SELECT
                COUNT(*) as total_projects,
                SUM(CASE WHEN statut IN ('En cours', 'Brouillon') THEN 1 ELSE 0 END) as projets_actifs,
                SUM(CASE WHEN statut = 'Archivé' THEN 1 ELSE 0 END) as projets_archives,
                SUM(surface_totale) as surface_mesuree
              FROM projects WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $stats = $stmt->fetch();

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
