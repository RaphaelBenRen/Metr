<?php
/**
 * Récupérer le devis d'un projet avec ses lignes
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
    $queryLignes = "SELECT lot, total, ordre FROM devis_lignes WHERE devis_id = :devis_id ORDER BY ordre ASC";
    $stmtLignes = $db->prepare($queryLignes);
    $stmtLignes->bindParam(':devis_id', $devis['id']);
    $stmtLignes->execute();
    $lignes = $stmtLignes->fetchAll(PDO::FETCH_ASSOC);

    // Calculer le total
    $totalHT = 0;
    foreach($lignes as &$ligne) {
        $ligne['total'] = floatval($ligne['total']);
        $totalHT += $ligne['total'];
    }

    // Préparer la réponse
    $response = [
        'success' => true,
        'data' => [
            'devis' => [
                'id' => $devis['id'],
                'numero_devis' => $devis['numero_devis'],
                'date_creation' => $devis['date_creation'],
                'date_validite' => $devis['date_validite'],
                'statut' => $devis['statut'],
                'notes' => $devis['notes'],
                'total_ht' => floatval($devis['total_ht'])
            ],
            'project' => [
                'id' => $project['id'],
                'nom_projet' => $project['nom_projet'],
                'client' => $project['client'],
                'reference_interne' => $project['reference_interne'],
                'adresse' => $project['adresse']
            ],
            'lignes' => $lignes,
            'total_ht' => $totalHT
        ]
    ];

    http_response_code(200);
    echo json_encode($response);

} catch(Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
