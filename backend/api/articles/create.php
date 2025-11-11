<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Méthode non autorisée', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['library_id']) || !isset($input['designation']) || !isset($input['lot']) || !isset($input['unite']) || !isset($input['prix_unitaire'])) {
    jsonError('Données manquantes (library_id, designation, lot, unite, prix_unitaire requis)');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();
    $libraryId = $input['library_id'];

    // Vérifier que la bibliothèque appartient à l'utilisateur
    $query = "SELECT * FROM libraries WHERE id = :id AND user_id = :user_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $libraryId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonError('Bibliothèque non trouvée ou accès non autorisé', 404);
    }

    // Insérer l'article
    $query = "INSERT INTO articles (library_id, designation, lot, sous_categorie, unite, prix_unitaire, statut)
              VALUES (:library_id, :designation, :lot, :sous_categorie, :unite, :prix_unitaire, :statut)";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':library_id', $libraryId);
    $stmt->bindParam(':designation', $input['designation']);
    $stmt->bindParam(':lot', $input['lot']);
    $stmt->bindValue(':sous_categorie', $input['sous_categorie'] ?? null);
    $stmt->bindParam(':unite', $input['unite']);
    $stmt->bindParam(':prix_unitaire', $input['prix_unitaire']);
    $stmt->bindValue(':statut', $input['statut'] ?? 'Nouveau');

    if ($stmt->execute()) {
        $articleId = $db->lastInsertId();

        $query = "SELECT * FROM articles WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $articleId);
        $stmt->execute();
        $article = $stmt->fetch();

        jsonSuccess($article, 'Article créé avec succès');
    } else {
        jsonError('Erreur lors de la création de l\'article', 500);
    }
} catch(PDOException $e) {
    error_log("Article create error: " . $e->getMessage());
    jsonError('Erreur lors de la création de l\'article', 500);
}
