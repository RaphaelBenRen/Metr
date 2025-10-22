<!DOCTYPE html>
<html>
<head>
    <title>Token Exchange Logs</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #f5f5f5; }
        pre { background: white; padding: 20px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap; }
        h1 { color: #333; }
        .no-logs { color: #999; font-style: italic; }
    </style>
</head>
<body>
    <h1>🔑 Logs d'échange de token Google</h1>
    <?php
    $logFile = __DIR__ . '/logs/google_token_exchange.log';

    if (file_exists($logFile)) {
        $logs = file_get_contents($logFile);
        if (!empty($logs)) {
            echo "<pre>" . htmlspecialchars($logs) . "</pre>";
        } else {
            echo "<p class='no-logs'>Le fichier de logs existe mais est vide.</p>";
        }
    } else {
        echo "<p class='no-logs'>Aucun log trouvé.</p>";
    }
    ?>

    <hr>
    <p>
        <a href="javascript:location.reload()">Rafraîchir</a> |
        <a href="check_google_logs.php">Logs callback</a> |
        <a href="check_google_users.php">Utilisateurs</a> |
        <a href="/">Retour</a>
    </p>
</body>
</html>
