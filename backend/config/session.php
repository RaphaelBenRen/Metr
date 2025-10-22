<?php
/**
 * Session configuration
 * This file MUST be included BEFORE session_start()
 */

// Configure session cookie parameters for cross-origin requests
ini_set('session.cookie_samesite', 'Lax'); // 'None' requires HTTPS with Secure flag
ini_set('session.cookie_httponly', '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_lifetime', '0'); // Session cookie (expires when browser closes)

// For localhost development, we can't use SameSite=None without HTTPS
// So we use SameSite=Lax which works for same-site and some cross-site scenarios
