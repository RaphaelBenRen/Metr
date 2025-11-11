<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Méthode non autorisée', 405);
}

if (!isset($_GET['library_id'])) {
    jsonError('ID de bibliothèque manquant');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $libraryId = $_GET['library_id'];

    // Vérifier que l'utilisateur a accès à la bibliothèque (propriétaire, partagée, ou globale)
    $query = "SELECT l.*
              FROM libraries l
              LEFT JOIN library_shares ls ON l.id = ls.library_id AND ls.shared_with_user_id = :user_id
              WHERE l.id = :id AND (l.user_id = :user_id OR ls.shared_with_user_id = :user_id OR l.is_global = 1)
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $libraryId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $library = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$library) {
        jsonError('Bibliothèque non trouvée ou accès non autorisé', 404);
    }

    // Récupérer tous les articles de la bibliothèque
    $query = "SELECT designation, lot, sous_categorie, unite, prix_unitaire, statut
              FROM articles
              WHERE library_id = :library_id
              ORDER BY lot, designation";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':library_id', $libraryId);
    $stmt->execute();

    $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($articles) === 0) {
        jsonError('Aucun article à exporter dans cette bibliothèque');
    }

    // Générer le nom du fichier
    $fileName = str_replace(' ', '_', $library['nom']) . '.csv';

    // Headers pour le téléchargement CSV
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $fileName . '"');
    header('Pragma: no-cache');
    header('Expires: 0');

    // Ouvrir le flux de sortie
    $output = fopen('php://output', 'w');

    // Ajouter le BOM UTF-8 pour Excel
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

    // Écrire l'en-tête CSV
    fputcsv($output, ['designation', 'lot', 'sous_categorie', 'unite', 'prix_unitaire', 'statut']);

    // Écrire les données
    foreach ($articles as $article) {
        fputcsv($output, [
            $article['designation'],
            $article['lot'],
            $article['sous_categorie'] ?? '',
            $article['unite'],
            $article['prix_unitaire'],
            $article['statut']
        ]);
    }

    fclose($output);
    exit;

} catch(PDOException $e) {
    error_log("Library export error: " . $e->getMessage());
    jsonError('Erreur lors de l\'export de la bibliothèque', 500);
}
