# Configuration Google SSO - Metr.

## ✅ Implémentation terminée !

L'authentification Google SSO a été complètement implémentée dans l'application Metr.

---

## 🎯 Fonctionnalités

- ✅ Connexion avec Google sur la page de login
- ✅ Inscription avec Google sur la page de registration
- ✅ Création automatique de compte lors de la première connexion Google
- ✅ Liaison de compte Google existant si l'email correspond
- ✅ Base de données mise à jour avec support Google OAuth
- ✅ Interface utilisateur avec bouton "Se connecter avec Google"

---

## 🔑 Identifiants configurés

**Client ID:** `713722571485-k7k3useosvfukc608ueff5b4q967nler.apps.googleusercontent.com`
**Client Secret:** `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`

**⚠️ IMPORTANT:** Ces identifiants sont actuellement en mode TEST. Pour la production, vous devrez :
1. Publier votre application dans Google Cloud Console
2. Mettre à jour les URLs autorisées avec votre domaine de production
3. Ne JAMAIS commiter le fichier `backend/config/google_oauth.php` dans un repository public

---

## 📁 Fichiers créés/modifiés

### Backend
- `backend/config/google_oauth.php` - Configuration OAuth Google
- `backend/api/auth/google-login.php` - Endpoint pour initier la connexion Google
- `backend/api/auth/google-callback.php` - Callback après authentification Google
- `backend/database/add_google_sso.sql` - Migration SQL pour ajouter les colonnes Google
- `backend/config/cors.php` - Mis à jour pour autoriser http://localhost:5174

### Frontend
- `frontend/src/components/auth/GoogleLoginButton.tsx` - Composant bouton Google
- `frontend/src/pages/auth/LoginPage.tsx` - Ajout du bouton Google
- `frontend/src/pages/auth/RegisterPage.tsx` - Ajout du bouton Google
- `frontend/src/services/api.ts` - Ajout de la méthode googleLogin()

### Base de données
Nouvelles colonnes ajoutées à la table `users`:
- `google_id` (VARCHAR 255, UNIQUE) - Identifiant Google de l'utilisateur
- `auth_provider` (ENUM: 'local', 'google') - Méthode d'authentification
- `password` (VARCHAR 255, NULL) - Maintenant optionnel pour les utilisateurs Google

---

## 🚀 Utilisation

### Pour l'utilisateur

1. Allez sur http://localhost:5174
2. Sur la page de connexion ou d'inscription, cliquez sur **"Se connecter avec Google"**
3. Sélectionnez votre compte Google
4. Autorisez l'accès à votre profil
5. Vous serez automatiquement connecté et redirigé vers le dashboard

### Flux technique

1. **Frontend** → Clique sur "Se connecter avec Google"
2. **Backend** → Génère l'URL d'autorisation Google (avec state CSRF)
3. **Google** → Utilisateur s'authentifie et autorise l'application
4. **Google** → Redirige vers `http://localhost/metr2/backend/api/auth/google-callback.php?code=...`
5. **Backend** → Échange le code contre un token d'accès
6. **Backend** → Récupère les infos utilisateur (email, nom, prénom, ID Google)
7. **Backend** → Crée ou met à jour l'utilisateur dans la BDD
8. **Backend** → Crée la session PHP
9. **Backend** → Redirige vers le frontend avec `?google_login=success`
10. **Frontend** → Détecte le succès et redirige vers le dashboard

---

## 🔧 Configuration Google Cloud Console

Les URLs suivantes ont été configurées dans Google Cloud Console :

**JavaScript origins:**
```
http://localhost:5174
http://localhost
```

**Redirect URIs:**
```
http://localhost:5174
http://localhost:5174/auth/callback
http://localhost/metr2/backend/api/auth/google-callback.php
```

---

## 🧪 Tests

Pour tester l'endpoint backend manuellement :
```bash
curl http://localhost/metr2/backend/api/auth/google-login.php
```

Réponse attendue :
```json
{
  "success": true,
  "data": {
    "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
    "client_id": "713722571485-k7k3useosvfukc608ueff5b4q967nler.apps.googleusercontent.com"
  }
}
```

---

## 📊 Structure de la base de données

```sql
DESCRIBE users;

+---------------+------------------------+------+-----+-------------------+
| Field         | Type                   | Null | Key | Default           |
+---------------+------------------------+------+-----+-------------------+
| id            | int(11)                | NO   | PRI | NULL              |
| nom           | varchar(100)           | NO   |     | NULL              |
| prenom        | varchar(100)           | NO   |     | NULL              |
| email         | varchar(255)           | NO   | UNI | NULL              |
| google_id     | varchar(255)           | YES  | UNI | NULL              |
| auth_provider | enum('local','google') | YES  |     | local             |
| password      | varchar(255)           | YES  |     | NULL              |
| entreprise    | varchar(255)           | YES  |     | NULL              |
| telephone     | varchar(20)            | YES  |     | NULL              |
| photo_profil  | varchar(255)           | YES  |     | NULL              |
| role          | enum('user','admin')   | YES  |     | user              |
| created_at    | timestamp              | YES  |     | CURRENT_TIMESTAMP |
| updated_at    | timestamp              | YES  |     | CURRENT_TIMESTAMP |
+---------------+------------------------+------+-----+-------------------+
```

---

## 🔒 Sécurité

- ✅ Protection CSRF avec state token
- ✅ Validation du state lors du callback
- ✅ Sessions PHP sécurisées
- ✅ Credentials HTTPS uniquement en production
- ✅ Contraintes UNIQUE sur google_id et email
- ✅ Pas de stockage de tokens côté frontend

---

## 💡 Notes importantes

1. **Coût:** Google OAuth 2.0 est **100% gratuit**, sans limite d'utilisateurs
2. **Email unique:** Si un utilisateur s'inscrit avec email classique puis tente Google avec le même email, le compte sera lié automatiquement
3. **Mot de passe:** Les utilisateurs Google n'ont pas de mot de passe stocké (NULL dans la BDD)
4. **Photo de profil:** Peut être ajoutée ultérieurement en utilisant `$userInfo['picture']` de Google

---

## 🚨 Pour passer en production

1. **Mise à jour des URLs** dans Google Cloud Console :
   - Remplacer `http://localhost` par votre domaine HTTPS
   - Exemple: `https://votre-domaine.com`

2. **Mise à jour du fichier** `backend/config/google_oauth.php` :
   - Modifier `$redirect_uri` avec l'URL de production

3. **Mise à jour du fichier** `backend/config/cors.php` :
   - Remplacer `http://localhost:5174` par votre domaine frontend

4. **Publication de l'application** dans Google Cloud Console :
   - Passer du mode "Test" au mode "Production"
   - Remplir les informations de vérification si nécessaire

---

## 📞 Support

Pour toute question ou problème :
- Vérifier que WAMP est démarré
- Vérifier que les URLs de redirection sont correctes dans Google Cloud Console
- Vérifier les logs dans la console du navigateur (F12)
- Vérifier les logs PHP dans WAMP

---

**🎉 Google SSO est maintenant pleinement opérationnel dans l'application Metr. !**
