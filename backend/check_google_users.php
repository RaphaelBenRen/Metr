<!DOCTYPE html>
<html>
<head>
    <title>Utilisateurs Google</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        table { background: white; width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #4285f4; color: white; }
        tr:hover { background: #f9f9f9; }
        h1 { color: #333; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .badge.google { background: #4285f4; color: white; }
        .badge.local { background: #999; color: white; }
    </style>
</head>
<body>
    <h1>👥 Utilisateurs avec authentification Google</h1>

    <?php
    require_once 'config/database.php';

    $database = new Database();
    $db = $database->getConnection();

    if ($db) {
        // Tous les utilisateurs
        echo "<h2>Tous les utilisateurs</h2>";
        $stmt = $db->query("SELECT id, nom, prenom, email, google_id, auth_provider, role, created_at FROM users ORDER BY created_at DESC");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($users) > 0) {
            echo "<table>";
            echo "<tr><th>ID</th><th>Nom</th><th>Prénom</th><th>Email</th><th>Google ID</th><th>Provider</th><th>Rôle</th><th>Créé le</th></tr>";
            foreach($users as $user) {
                echo "<tr>";
                echo "<td>" . $user['id'] . "</td>";
                echo "<td>" . htmlspecialchars($user['nom']) . "</td>";
                echo "<td>" . htmlspecialchars($user['prenom']) . "</td>";
                echo "<td>" . htmlspecialchars($user['email']) . "</td>";
                echo "<td>" . ($user['google_id'] ? substr($user['google_id'], 0, 20) . '...' : '-') . "</td>";
                echo "<td><span class='badge " . $user['auth_provider'] . "'>" . $user['auth_provider'] . "</span></td>";
                echo "<td>" . $user['role'] . "</td>";
                echo "<td>" . $user['created_at'] . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p>Aucun utilisateur trouvé.</p>";
        }

        // Utilisateurs Google uniquement
        echo "<h2>Utilisateurs Google uniquement</h2>";
        $stmt = $db->query("SELECT id, nom, prenom, email, google_id, created_at FROM users WHERE auth_provider = 'google' ORDER BY created_at DESC");
        $googleUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($googleUsers) > 0) {
            echo "<table>";
            echo "<tr><th>ID</th><th>Nom</th><th>Prénom</th><th>Email</th><th>Google ID</th><th>Créé le</th></tr>";
            foreach($googleUsers as $user) {
                echo "<tr>";
                echo "<td>" . $user['id'] . "</td>";
                echo "<td>" . htmlspecialchars($user['nom']) . "</td>";
                echo "<td>" . htmlspecialchars($user['prenom']) . "</td>";
                echo "<td>" . htmlspecialchars($user['email']) . "</td>";
                echo "<td>" . htmlspecialchars($user['google_id']) . "</td>";
                echo "<td>" . $user['created_at'] . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p>Aucun utilisateur Google trouvé.</p>";
        }

    } else {
        echo "<p style='color:red;'>Erreur de connexion à la base de données</p>";
    }
    ?>

    <hr>
    <p><a href="javascript:location.reload()">Rafraîchir</a> | <a href="check_google_logs.php">Voir les logs</a> | <a href="/">Retour</a></p>
</body>
</html>
