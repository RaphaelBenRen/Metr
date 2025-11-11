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
    $fileName = $_FILES['file']['name'];

    // Vérifier l'extension du fichier
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    if ($fileExtension !== 'csv') {
        jsonError('Le fichier doit être au format CSV');
    }

    // Récupérer le nom de la bibliothèque depuis le POST ou extraire du nom du fichier
    if (!empty($_POST['library_name'])) {
        $libraryName = trim($_POST['library_name']);
    } else {
        // Fallback: extraire le nom depuis le nom du fichier
        $libraryName = pathinfo($fileName, PATHINFO_FILENAME);
        $libraryName = str_replace('_', ' ', $libraryName);
    }

    // Lire le fichier CSV pour compter les articles
    $handle = fopen($file, 'r');
    if ($handle === false) {
        jsonError('Impossible de lire le fichier CSV');
    }

    // Créer la bibliothèque
    $query = "INSERT INTO libraries (user_id, nom, description) VALUES (:user_id, :nom, :description)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':nom', $libraryName);
    $description = "Bibliothèque importée depuis " . $fileName;
    $stmt->bindParam(':description', $description);

    if (!$stmt->execute()) {
        fclose($handle);
        jsonError('Erreur lors de la création de la bibliothèque', 500);
    }

    $libraryId = $db->lastInsertId();

    // Importer les articles
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
        if (empty($data['designation']) || empty($data['lot']) || empty($data['unite']) || empty($data['prix_unitaire'])) {
            $errors[] = "Ligne ignorée : champs requis manquants (designation, lot, unite, prix_unitaire)";
            continue;
        }

        // Insérer l'article
        $query = "INSERT INTO articles (library_id, designation, lot, sous_categorie, unite, prix_unitaire, statut)
                  VALUES (:library_id, :designation, :lot, :sous_categorie, :unite, :prix_unitaire, :statut)";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':library_id', $libraryId);
        $stmt->bindParam(':designation', $data['designation']);
        $stmt->bindParam(':lot', $data['lot']);
        $stmt->bindValue(':sous_categorie', $data['sous_categorie'] ?? null);
        $stmt->bindParam(':unite', $data['unite']);
        $stmt->bindParam(':prix_unitaire', $data['prix_unitaire']);
        $stmt->bindValue(':statut', $data['statut'] ?? 'Nouveau');

        if ($stmt->execute()) {
            $imported++;
        } else {
            $errors[] = "Erreur lors de l'import de l'article : " . $data['designation'];
        }
    }

    fclose($handle);

    // Récupérer la bibliothèque créée
    $query = "SELECT * FROM libraries WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $libraryId);
    $stmt->execute();
    $library = $stmt->fetch();

    jsonSuccess([
        'library' => $library,
        'imported' => $imported,
        'errors' => $errors
    ], "Bibliothèque '$libraryName' créée avec $imported articles importés");

} catch(Exception $e) {
    error_log("Library complete import error: " . $e->getMessage());
    jsonError('Erreur lors de l\'import de la bibliothèque', 500);
}
