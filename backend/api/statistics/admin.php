<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAdmin();

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    // Get global stats
    $query = "SELECT COUNT(*) as total_users FROM users";
    $stmt = $db->query($query);
    $userStats = $stmt->fetch();

    $query = "SELECT COUNT(*) as total_projects FROM projects";
    $stmt = $db->query($query);
    $projectStats = $stmt->fetch();

    $query = "SELECT COUNT(*) as total_articles FROM articles";
    $stmt = $db->query($query);
    $articleStats = $stmt->fetch();

    // Active users in last 30 days
    $query = "SELECT COUNT(DISTINCT user_id) as active_users FROM projects
              WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    $stmt = $db->query($query);
    $activeStats = $stmt->fetch();

    $stats = [
        'total_users' => $userStats['total_users'],
        'total_projects' => $projectStats['total_projects'],
        'total_articles' => $articleStats['total_articles'],
        'active_users' => $activeStats['active_users']
    ];

    jsonSuccess($stats);
} catch(PDOException $e) {
    error_log("Admin stats error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des statistiques', 500);
}
