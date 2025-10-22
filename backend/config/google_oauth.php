<?php
/**
 * Configuration Google OAuth 2.0
 *
 * IMPORTANT: Ne jamais commiter ce fichier avec les vraies valeurs dans un repository public
 */

class GoogleOAuthConfig {
    // Identifiants OAuth Google
    private $client_id = "713722571485-k7k3useosvfukc608ueff5b4q967nler.apps.googleusercontent.com";
    private $client_secret = "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";

    // URLs de redirection
    private $redirect_uri = "http://localhost/metr2/backend/api/auth/google-callback.php";

    // Scopes nécessaires
    private $scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ];

    public function getClientId() {
        return $this->client_id;
    }

    public function getClientSecret() {
        return $this->client_secret;
    }

    public function getRedirectUri() {
        return $this->redirect_uri;
    }

    public function getScopes() {
        return $this->scopes;
    }

    /**
     * Générer l'URL d'autorisation Google
     */
    public function getAuthUrl($state = null) {
        $params = [
            'client_id' => $this->client_id,
            'redirect_uri' => $this->redirect_uri,
            'response_type' => 'code',
            'scope' => implode(' ', $this->scopes),
            'access_type' => 'online',
            'prompt' => 'select_account'
        ];

        if ($state) {
            $params['state'] = $state;
        }

        return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
    }

    /**
     * Échanger le code d'autorisation contre un token d'accès
     */
    public function exchangeCodeForToken($code) {
        $tokenUrl = 'https://oauth2.googleapis.com/token';

        $data = [
            'code' => $code,
            'client_id' => $this->client_id,
            'client_secret' => $this->client_secret,
            'redirect_uri' => $this->redirect_uri,
            'grant_type' => 'authorization_code'
        ];

        $ch = curl_init($tokenUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Pour Windows/WAMP
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false); // Pour Windows/WAMP
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        // Logger pour debug
        $logData = [
            'http_code' => $httpCode,
            'curl_error' => $error,
            'response' => $response
        ];
        @file_put_contents(__DIR__ . '/../logs/google_token_exchange.log',
            date('Y-m-d H:i:s') . ' - ' . json_encode($logData) . "\n", FILE_APPEND);

        if ($response === false) {
            return ['error' => 'cURL error: ' . $error];
        }

        return json_decode($response, true);
    }

    /**
     * Récupérer les informations utilisateur depuis Google
     */
    public function getUserInfo($accessToken) {
        $userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';

        $ch = curl_init($userInfoUrl);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Pour Windows/WAMP
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false); // Pour Windows/WAMP
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            return ['error' => 'cURL error: ' . $error];
        }

        return json_decode($response, true);
    }
}
