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
    $query = "SELECT id, nom, prenom, email, entreprise, telephone, role, created_at, updated_at
              FROM users ORDER BY created_at DESC";
    $stmt = $db->query($query);
    $users = $stmt->fetchAll();

    jsonSuccess($users);
} catch(PDOException $e) {
    error_log("Admin users error: " . $e->getMessage());
    jsonError('Erreur lors de la récupération des utilisateurs', 500);
}
