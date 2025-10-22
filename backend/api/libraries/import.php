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

if (!isset($_POST['library_id'])) {
    jsonError('ID de la bibliothèque manquant');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $libraryId = $_POST['library_id'];
    $file = $_FILES['file']['tmp_name'];

    // Vérifier que la bibliothèque appartient à l'utilisateur
    $query = "SELECT * FROM libraries WHERE id = :id AND user_id = :user_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $libraryId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonError('Bibliothèque non trouvée ou accès non autorisé', 404);
    }

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

    jsonSuccess([
        'imported' => $imported,
        'errors' => $errors
    ], "$imported articles importés avec succès");

} catch(Exception $e) {
    error_log("Library import error: " . $e->getMessage());
    jsonError('Erreur lors de l\'import des articles', 500);
}
