<?php
/**
 * Export d'un devis au format CSV
 * Format: Lot | Total (selon l'image fournie)
 */

session_start();

require_once '../../config/database.php';
require_once '../../config/cors.php';

// Vérifier l'authentification
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non authentifié']);
    exit();
}

// Récupérer l'ID du projet
$projectId = isset($_GET['project_id']) ? intval($_GET['project_id']) : 0;

if ($projectId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID projet invalide']);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception('Erreur de connexion à la base de données');
    }

    // Récupérer le projet
    $queryProject = "SELECT * FROM projects WHERE id = :project_id";
    $stmtProject = $db->prepare($queryProject);
    $stmtProject->bindParam(':project_id', $projectId);
    $stmtProject->execute();
    $project = $stmtProject->fetch(PDO::FETCH_ASSOC);

    if (!$project) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Projet non trouvé']);
        exit();
    }

    // Vérifier que l'utilisateur a accès au projet
    $userId = $_SESSION['user_id'];
    $userRole = $_SESSION['user_role'] ?? 'user';

    if ($userRole !== 'admin' && $project['user_id'] != $userId) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Accès refusé']);
        exit();
    }

    // Récupérer le devis du projet
    $queryDevis = "SELECT * FROM devis WHERE project_id = :project_id ORDER BY created_at DESC LIMIT 1";
    $stmtDevis = $db->prepare($queryDevis);
    $stmtDevis->bindParam(':project_id', $projectId);
    $stmtDevis->execute();
    $devis = $stmtDevis->fetch(PDO::FETCH_ASSOC);

    if (!$devis) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Aucun devis trouvé pour ce projet']);
        exit();
    }

    // Récupérer les lignes du devis
    $queryLignes = "SELECT lot, total FROM devis_lignes WHERE devis_id = :devis_id ORDER BY ordre ASC";
    $stmtLignes = $db->prepare($queryLignes);
    $stmtLignes->bindParam(':devis_id', $devis['id']);
    $stmtLignes->execute();
    $lignes = $stmtLignes->fetchAll(PDO::FETCH_ASSOC);

    // Générer le CSV
    // Nettoyer le nom du projet pour le fichier
    $projectName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $project['nom_projet']);
    $filename = "Devis_{$projectName}_{$devis['numero_devis']}.csv";

    // Headers pour le téléchargement
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');

    // Ajouter le BOM UTF-8 pour Excel
    echo "\xEF\xBB\xBF";

    // Créer l'output stream
    $output = fopen('php://output', 'w');

    // Ligne d'en-tête (comme dans l'image)
    fputcsv($output, ['Lot', 'Total'], ';');

    // Ajouter les lignes de devis
    $totalGeneral = 0;
    foreach ($lignes as $ligne) {
        // Formater le total comme dans l'image: "€ 1 728,21"
        $totalFormate = '€ ' . number_format($ligne['total'], 2, ',', ' ');
        fputcsv($output, [$ligne['lot'], $totalFormate], ';');
        $totalGeneral += $ligne['total'];
    }

    // Ligne de total (comme dans l'image)
    $totalGeneralFormate = '€ ' . number_format($totalGeneral, 2, ',', ' ');
    fputcsv($output, ['TOTAL', $totalGeneralFormate], ';');

    fclose($output);
    exit();

} catch(Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur lors de l\'export: ' . $e->getMessage()
    ]);
    exit();
}
