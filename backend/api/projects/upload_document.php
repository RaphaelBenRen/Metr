<?php
session_start();
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/helpers.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Méthode non autorisée', 405);
}

if (!isset($_POST['project_id']) || !isset($_POST['type'])) {
    jsonError('Données manquantes');
}

if (!isset($_FILES['file'])) {
    jsonError('Aucun fichier fourni');
}

$projectId = $_POST['project_id'];
$type = $_POST['type']; // 'plan' or 'document'
$file = $_FILES['file'];

// Validate type
if (!in_array($type, ['plan', 'document'])) {
    jsonError('Type invalide');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    jsonError('Erreur de connexion à la base de données', 500);
}

try {
    $userId = getCurrentUserId();

    // Verify project ownership OR shared access with editor role
    $query = "SELECT p.id,
              CASE WHEN p.user_id = :user_id THEN 1 ELSE 0 END as is_owner,
              ps.role as shared_role
              FROM projects p
              LEFT JOIN project_shares ps ON p.id = ps.project_id AND ps.shared_with_user_id = :user_id
              WHERE p.id = :id AND (p.user_id = :user_id OR ps.shared_with_user_id = :user_id)
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $projectId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $project = $stmt->fetch();

    if (!$project) {
        jsonError('Projet non trouvé ou accès refusé', 403);
    }

    // Vérifier les droits d'édition
    $canEdit = $project['is_owner'] || ($project['shared_role'] === 'editor');
    if (!$canEdit) {
        jsonError('Vous n\'avez pas les droits pour uploader des documents sur ce projet', 403);
    }

    // Validate file
    if ($file['error'] !== UPLOAD_ERR_OK) {
        jsonError('Erreur lors de l\'upload du fichier');
    }

    // Define allowed extensions based on type
    $allowedExtensions = $type === 'plan'
        ? ['dwg', 'pdf', 'dxf']
        : ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'];

    $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($fileExtension, $allowedExtensions)) {
        jsonError('Type de fichier non autorisé pour ce type de document');
    }

    // Create upload directory if not exists
    $uploadDir = '../../uploads/projects/' . $projectId . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Generate unique filename
    $filename = uniqid() . '_' . time() . '.' . $fileExtension;
    $filePath = $uploadDir . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        jsonError('Erreur lors de l\'enregistrement du fichier');
    }

    // Save to database
    $query = "INSERT INTO project_documents (project_id, type, nom_fichier, nom_original, chemin_fichier, taille_fichier, format)
              VALUES (:project_id, :type, :nom_fichier, :nom_original, :chemin_fichier, :taille_fichier, :format)";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':project_id', $projectId);
    $stmt->bindParam(':type', $type);
    $stmt->bindParam(':nom_fichier', $filename);
    $stmt->bindParam(':nom_original', $file['name']);
    $stmt->bindParam(':chemin_fichier', $filePath);
    $stmt->bindParam(':taille_fichier', $file['size']);
    $stmt->bindParam(':format', $fileExtension);

    if ($stmt->execute()) {
        $docId = $db->lastInsertId();

        jsonSuccess([
            'id' => $docId,
            'filename' => $filename,
            'original_filename' => $file['name'],
            'type' => $type,
            'size' => $file['size']
        ], 'Document uploadé avec succès');
    } else {
        // Delete file if database insert failed
        unlink($filePath);
        jsonError('Erreur lors de l\'enregistrement en base de données');
    }

} catch(PDOException $e) {
    error_log("Upload document error: " . $e->getMessage());
    jsonError('Erreur lors de l\'upload', 500);
}
