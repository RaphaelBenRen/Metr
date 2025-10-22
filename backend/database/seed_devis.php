<?php
/**
 * Création de devis factices pour les projets existants
 */

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die("❌ Database connection failed\n");
}

try {
    echo "🌱 Création de devis factices...\n\n";

    // Récupérer les projets existants
    $stmt = $db->query("SELECT id, nom_projet FROM projects LIMIT 10");
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($projects) === 0) {
        die("❌ Aucun projet trouvé. Créez d'abord des projets.\n");
    }

    echo "✓ " . count($projects) . " projet(s) trouvé(s)\n\n";

    // Définir des lots types pour les devis
    $lotsTypes = [
        ['lot' => 'CARRELAGES REVÊTEMENTS SOLS', 'total' => 1728.21],
        ['lot' => 'COUVERTURE ZINGUERIE', 'total' => 22.24],
        ['lot' => 'Divers', 'total' => 0.00],
        ['lot' => 'GROS ŒUVRE - MAÇONNERIE', 'total' => 66910.47],
        ['lot' => 'MENUISERIES INTÉRIEURES', 'total' => 296.70],
        ['lot' => 'PEINTURES', 'total' => 14414.09],
        ['lot' => 'PLÂTRERIE', 'total' => 75717.96]
    ];

    $lotsTypes2 = [
        ['lot' => 'TERRASSEMENTS', 'total' => 5420.00],
        ['lot' => 'FONDATIONS', 'total' => 12350.50],
        ['lot' => 'ÉLECTRICITÉ', 'total' => 8750.25],
        ['lot' => 'PLOMBERIE', 'total' => 9240.80],
        ['lot' => 'CHAUFFAGE', 'total' => 11200.00],
        ['lot' => 'ISOLATION', 'total' => 6890.45]
    ];

    $lotsTypes3 = [
        ['lot' => 'CHARPENTE', 'total' => 18500.00],
        ['lot' => 'COUVERTURE', 'total' => 9850.00],
        ['lot' => 'MENUISERIES EXTÉRIEURES', 'total' => 15640.00],
        ['lot' => 'RAVALEMENT FAÇADES', 'total' => 12300.00],
        ['lot' => 'AMÉNAGEMENTS EXTÉRIEURS', 'total' => 7450.00]
    ];

    $allLots = [$lotsTypes, $lotsTypes2, $lotsTypes3];

    $devisCreated = 0;

    foreach ($projects as $index => $project) {
        // Vérifier si un devis existe déjà pour ce projet
        $checkStmt = $db->prepare("SELECT id FROM devis WHERE project_id = :project_id LIMIT 1");
        $checkStmt->bindParam(':project_id', $project['id']);
        $checkStmt->execute();

        if ($checkStmt->rowCount() > 0) {
            echo "⚠ Devis déjà existant pour le projet #{$project['id']} - {$project['nom_projet']}\n";
            continue;
        }

        // Choisir un set de lots
        $lots = $allLots[$index % count($allLots)];

        // Calculer le total
        $totalHT = array_sum(array_column($lots, 'total'));

        // Générer un numéro de devis unique
        $numeroDevis = 'DEV-2025-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT);

        // Créer le devis
        $insertDevis = "INSERT INTO devis (project_id, numero_devis, date_creation, date_validite, statut, total_ht, notes)
                        VALUES (:project_id, :numero_devis, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'valide', :total_ht, :notes)";

        $stmtDevis = $db->prepare($insertDevis);
        $stmtDevis->bindParam(':project_id', $project['id']);
        $stmtDevis->bindParam(':numero_devis', $numeroDevis);
        $stmtDevis->bindParam(':total_ht', $totalHT);
        $notes = "Devis pour le projet: " . $project['nom_projet'];
        $stmtDevis->bindParam(':notes', $notes);
        $stmtDevis->execute();

        $devisId = $db->lastInsertId();

        // Ajouter les lignes de devis
        $insertLigne = "INSERT INTO devis_lignes (devis_id, lot, total, ordre) VALUES (:devis_id, :lot, :total, :ordre)";
        $stmtLigne = $db->prepare($insertLigne);

        foreach ($lots as $ordre => $ligne) {
            $stmtLigne->bindParam(':devis_id', $devisId);
            $stmtLigne->bindParam(':lot', $ligne['lot']);
            $stmtLigne->bindParam(':total', $ligne['total']);
            $stmtLigne->bindParam(':ordre', $ordre);
            $stmtLigne->execute();
        }

        $devisCreated++;
        echo "✓ Devis #{$numeroDevis} créé pour le projet #{$project['id']} - {$project['nom_projet']} (Total HT: €" . number_format($totalHT, 2, ',', ' ') . ")\n";
        echo "  └─ " . count($lots) . " lot(s) ajouté(s)\n\n";
    }

    echo "\n✅ Migration terminée !\n";
    echo "📊 Résumé: {$devisCreated} devis créé(s)\n";

} catch(PDOException $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}
