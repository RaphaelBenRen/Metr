<?php
/**
 * Exporter le chiffrage en format Excel (.xlsx)
 * Note: Nécessite la bibliothèque PhpSpreadsheet
 * Installation: composer require phpoffice/phpspreadsheet
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
    echo "ID projet invalide";
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
        echo "Projet non trouvé";
        exit();
    }

    // Vérifier que l'utilisateur a accès au projet
    $userId = $_SESSION['user_id'];
    $userRole = $_SESSION['user_role'] ?? 'user';

    if ($userRole !== 'admin' && $project['user_id'] != $userId) {
        http_response_code(403);
        echo "Accès refusé";
        exit();
    }

    // Récupérer le chiffrage
    $queryChiffrage = "SELECT * FROM devis WHERE project_id = :project_id ORDER BY created_at DESC LIMIT 1";
    $stmtChiffrage = $db->prepare($queryChiffrage);
    $stmtChiffrage->bindParam(':project_id', $projectId);
    $stmtChiffrage->execute();
    $chiffrage = $stmtChiffrage->fetch(PDO::FETCH_ASSOC);

    if (!$chiffrage) {
        http_response_code(404);
        echo "Aucun chiffrage trouvé pour ce projet";
        exit();
    }

    // Récupérer les lignes du chiffrage
    $queryLignes = "SELECT lot, total, ordre FROM devis_lignes WHERE devis_id = :chiffrage_id ORDER BY ordre ASC";
    $stmtLignes = $db->prepare($queryLignes);
    $stmtLignes->bindParam(':chiffrage_id', $chiffrage['id']);
    $stmtLignes->execute();
    $lignes = $stmtLignes->fetchAll(PDO::FETCH_ASSOC);

    // Vérifier si PhpSpreadsheet est installé
    $vendorPath = __DIR__ . '/../../vendor/autoload.php';
    if (file_exists($vendorPath)) {
        require_once $vendorPath;

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // En-tête du document
        $sheet->setCellValue('A1', 'CHIFFRAGE');
        $sheet->mergeCells('A1:B1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        // Informations du chiffrage
        $sheet->setCellValue('A3', 'N° Chiffrage:');
        $sheet->setCellValue('B3', $chiffrage['numero_devis']);
        $sheet->setCellValue('A4', 'Date:');
        $sheet->setCellValue('B4', date('d/m/Y', strtotime($chiffrage['date_creation'])));

        // Informations du projet
        $sheet->setCellValue('A6', 'Projet:');
        $sheet->setCellValue('B6', $project['nom_projet']);
        $sheet->setCellValue('A7', 'Client:');
        $sheet->setCellValue('B7', $project['client']);

        if ($project['reference_interne']) {
            $sheet->setCellValue('A8', 'Référence:');
            $sheet->setCellValue('B8', $project['reference_interne']);
        }

        // En-têtes du tableau
        $row = 10;
        $sheet->setCellValue('A' . $row, 'Lot');
        $sheet->setCellValue('B' . $row, 'Total (EUR)');

        // Style des en-têtes
        $sheet->getStyle('A' . $row . ':B' . $row)->getFont()->setBold(true);
        $sheet->getStyle('A' . $row . ':B' . $row)->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('4F46E5');
        $sheet->getStyle('A' . $row . ':B' . $row)->getFont()->getColor()->setRGB('FFFFFF');

        // Lignes du chiffrage
        $row++;
        $totalHT = 0;
        foreach ($lignes as $ligne) {
            $sheet->setCellValue('A' . $row, $ligne['lot']);
            $sheet->setCellValue('B' . $row, floatval($ligne['total']));
            $sheet->getStyle('B' . $row)->getNumberFormat()
                ->setFormatCode(\PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1);
            $totalHT += floatval($ligne['total']);
            $row++;
        }

        // Total
        $sheet->setCellValue('A' . $row, 'TOTAL HT');
        $sheet->setCellValue('B' . $row, $totalHT);
        $sheet->getStyle('A' . $row . ':B' . $row)->getFont()->setBold(true);
        $sheet->getStyle('B' . $row)->getNumberFormat()
            ->setFormatCode(\PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1);

        // Bordures du tableau
        $tableRange = 'A10:B' . $row;
        $sheet->getStyle($tableRange)->getBorders()->getAllBorders()
            ->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);

        // Largeur des colonnes
        $sheet->getColumnDimension('A')->setWidth(40);
        $sheet->getColumnDimension('B')->setWidth(20);

        // Nom du fichier
        $filename = 'Chiffrage_' . $chiffrage['numero_devis'] . '_' . date('Y-m-d') . '.xlsx';

        // En-têtes HTTP pour le téléchargement
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $writer->save('php://output');
        exit();

    } else {
        // Fallback: Générer un CSV si PhpSpreadsheet n'est pas installé
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="Chiffrage_' . $chiffrage['numero_devis'] . '.csv"');

        $output = fopen('php://output', 'w');

        // BOM UTF-8 pour Excel
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

        // En-tête du CSV
        fputcsv($output, ['CHIFFRAGE'], ';');
        fputcsv($output, [], ';');
        fputcsv($output, ['N° Chiffrage', $chiffrage['numero_devis']], ';');
        fputcsv($output, ['Date', date('d/m/Y', strtotime($chiffrage['date_creation']))], ';');
        fputcsv($output, [], ';');
        fputcsv($output, ['Projet', $project['nom_projet']], ';');
        fputcsv($output, ['Client', $project['client']], ';');
        fputcsv($output, [], ';');

        // En-têtes du tableau
        fputcsv($output, ['Lot', 'Total (EUR)'], ';');

        // Lignes
        $totalHT = 0;
        foreach ($lignes as $ligne) {
            fputcsv($output, [$ligne['lot'], number_format($ligne['total'], 2, ',', ' ')], ';');
            $totalHT += floatval($ligne['total']);
        }

        // Total
        fputcsv($output, ['TOTAL HT', number_format($totalHT, 2, ',', ' ')], ';');

        fclose($output);
        exit();
    }

} catch(Exception $e) {
    http_response_code(500);
    echo "Erreur serveur: " . $e->getMessage();
}
