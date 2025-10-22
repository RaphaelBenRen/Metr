<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Méthode non autorisée', 405);
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    jsonError('Fichier CSV manquant ou erreur lors de l\'upload');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $file = $_FILES['file']['tmp_name'];

    // Vérifier l'extension du fichier
    $fileExtension = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
    if ($fileExtension !== 'csv') {
        jsonError('Le fichier doit être au format CSV');
    }

    // Lire le fichier CSV
    $handle = fopen($file, 'r');
    if ($handle === false) {
        jsonError('Impossible de lire le fichier CSV');
    }

    $imported = 0;
    $errors = [];
    $header = null;

    while (($row = fgetcsv($handle, 1000, ',')) !== false) {
        // Première ligne = entêtes
        if ($header === null) {
            $header = array_map('trim', $row);
            continue;
        }

        // Créer un tableau associatif
        $data = array_combine($header, $row);

        // Validation des champs requis
        if (empty($data['nom_projet']) || empty($data['client']) || empty($data['typologie'])) {
            $errors[] = "Ligne ignorée : champs requis manquants (nom_projet, client, typologie)";
            continue;
        }

        // Insérer le projet
        $query = "INSERT INTO projects (user_id, nom_projet, client, reference_interne, typologie, adresse, date_livraison_prevue, statut, surface_totale)
                  VALUES (:user_id, :nom_projet, :client, :reference_interne, :typologie, :adresse, :date_livraison_prevue, :statut, :surface_totale)";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':nom_projet', $data['nom_projet']);
        $stmt->bindParam(':client', $data['client']);
        $stmt->bindValue(':reference_interne', $data['reference_interne'] ?? null);
        $stmt->bindParam(':typologie', $data['typologie']);
        $stmt->bindValue(':adresse', $data['adresse'] ?? null);
        $stmt->bindValue(':date_livraison_prevue', $data['date_livraison_prevue'] ?? null);
        $stmt->bindValue(':statut', $data['statut'] ?? 'Brouillon');
        $stmt->bindValue(':surface_totale', $data['surface_totale'] ?? null);

        if ($stmt->execute()) {
            $imported++;
        } else {
            $errors[] = "Erreur lors de l'import du projet : " . $data['nom_projet'];
        }
    }

    fclose($handle);

    jsonSuccess([
        'imported' => $imported,
        'errors' => $errors
    ], "$imported projets importés avec succès");

} catch(Exception $e) {
    error_log("Project import error: " . $e->getMessage());
    jsonError('Erreur lors de l\'import des projets', 500);
}
