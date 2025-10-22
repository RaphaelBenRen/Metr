<?php
/**
 * Configuration CORS pour permettre les requêtes depuis le frontend
 */

// Autoriser l'origine du frontend
header("Access-Control-Allow-Origin: http://localhost:5174");

// Autoriser les credentials (cookies, sessions)
header("Access-Control-Allow-Credentials: true");

// Autoriser les méthodes HTTP
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Autoriser les headers
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Type de contenu JSON
header("Content-Type: application/json; charset=UTF-8");

// Répondre aux requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
