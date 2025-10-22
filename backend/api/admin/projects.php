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
    $query = "SELECT p.*, u.nom as user_nom, u.prenom as user_prenom, u.email as user_email
              FROM projects p
              LEFT JOIN users u ON p.user_id = u.id
              ORDER BY p.created_at DESC";
    $stmt = $db->query($query);
    $projects = $stmt->fetchAll();

    jsonSuccess($projects);
} catch(PDOException $e) {
    error_log("Admin projects error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des projets', 500);
}
