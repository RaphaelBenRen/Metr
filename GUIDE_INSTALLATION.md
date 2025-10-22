# Guide d'installation - Application Metr.

## 🚀 Installation rapide

### Prérequis

- **WAMP/XAMPP** installé et fonctionnel
- **Node.js** (version 18 ou supérieure)
- **NPM** ou **Yarn**
- **PHP** 8.x
- **MySQL/MariaDB**

### Étape 1 : Base de données

1. Démarrez WAMP
2. Ouvrez phpMyAdmin : `http://localhost/phpmyadmin`
3. La base de données `metr_db` existe déjà avec les tables et données de test
4. **Compte admin par défaut** :
   - Email : `admin@metr.fr`
   - Mot de passe : `Admin123!`

### Étape 2 : Installation du Frontend

```bash
# Se placer dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le frontend sera accessible sur : **http://localhost:3000**

### Étape 3 : Configuration du Backend

Le backend PHP est déjà configuré pour fonctionner avec WAMP.

**Configuration par défaut** :
- Host : `127.0.0.1`
- Port : `3306`
- Base de données : `metr_db`
- Utilisateur : `root`
- Mot de passe : (vide)

Si vous avez besoin de modifier ces paramètres, éditez :
```
backend/config/database.php
```

### Étape 4 : Accéder à l'application

1. Ouvrez votre navigateur
2. Allez sur `http://localhost:3000`
3. Connectez-vous avec :
   - Email : `admin@metr.fr`
   - Mot de passe : `Admin123!`

---

## 📁 Structure du projet

```
metr2/
├── frontend/                # Application React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # Composants UI
│   │   │   ├── ui/         # Composants de base (Button, Input, Card...)
│   │   │   └── layout/     # Layout (Sidebar, Header)
│   │   ├── pages/          # Pages de l'application
│   │   │   ├── auth/       # Login, Register
│   │   │   ├── dashboard/  # Dashboard
│   │   │   ├── projects/   # Gestion des projets
│   │   │   ├── library/    # Bibliothèque d'articles
│   │   │   ├── admin/      # Panel admin
│   │   │   ├── settings/   # Paramètres
│   │   │   └── help/       # Aide
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utilitaires
│   │   └── assets/         # Images, logos
│   └── package.json
│
├── backend/                 # API PHP
│   ├── api/
│   │   ├── auth/           # Authentification
│   │   ├── projects/       # CRUD projets
│   │   ├── libraries/      # CRUD bibliothèques
│   │   ├── articles/       # CRUD articles
│   │   ├── statistics/     # Statistiques
│   │   └── admin/          # Routes admin
│   ├── config/             # Configuration DB et CORS
│   └── utils/              # Fonctions utilitaires
│
├── drive-download.../       # Logos Metr.
├── Style/                   # Captures d'écran du design
└── metr_db.sql             # Script SQL de la base de données
```

---

## 🎨 Design et Charte graphique

### Couleurs

- **Bleu foncé** `#1E3A8A` : Couleur principale (sidebar, boutons)
- **Orange** `#F97316` : Couleur d'accentuation (CTA)
- **Blanc** `#FFFFFF` : Arrière-plan principal
- **Gris clair** `#F3F4F6` : Arrière-plan secondaire

### Typographies

- **Titres** : Montserrat (gras)
- **Corps** : Roboto (régulier)

### Logos

Les logos Metr. sont disponibles dans le dossier `drive-download-20251013T091623Z-1-001/` :
- `Metr. LOGO.png` : Logo complet avec point orange
- `Metr LOGO White.png` : Logo blanc pour fond bleu
- `M_LOGO.png` : Logo M simple

---

## 🔧 Commandes utiles

### Frontend

```bash
# Installation des dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Build de production
npm run build

# Prévisualiser le build
npm run preview

# Linter
npm run lint
```

### Base de données

```sql
-- Voir tous les utilisateurs
SELECT * FROM users;

-- Voir tous les projets
SELECT * FROM projects;

-- Voir toutes les bibliothèques
SELECT * FROM libraries;

-- Voir tous les articles
SELECT * FROM articles;
```

---

## 📊 Fonctionnalités implémentées

### ✅ Authentification
- [x] Connexion simple (email + mot de passe)
- [x] Inscription
- [x] Sessions PHP
- [x] Déconnexion
- [x] Protection des routes
- [x] Gestion des rôles (user/admin)

### ✅ Dashboard
- [x] Message de bienvenue personnalisé
- [x] Affichage des projets récents (4 derniers)
- [x] Statistiques (projets actifs, m² mesurés, exports, projets archivés)
- [x] Bouton "Créer un projet"

### ✅ Gestion des Projets
- [x] Liste des projets avec filtres
- [x] Recherche par nom ou client
- [x] Affichage sous forme de cards
- [x] Statuts colorés (En cours, Brouillon, Terminé, Archivé)
- [x] Création de projet (formulaire complet)

### ✅ Bibliothèque
- [x] Affichage des articles en tableau
- [x] Filtres par lot, sous-catégorie, unité
- [x] Recherche d'articles
- [x] Système de favoris (étoiles)
- [x] Badges "Nouveau"
- [x] Sélection multiple

### ✅ Administration (Admin uniquement)
- [x] Statistiques globales (utilisateurs, projets, articles)
- [x] Liste de tous les utilisateurs
- [x] Affichage des rôles
- [x] Protection admin

### ✅ Paramètres
- [x] Modification du profil
- [x] Changement de mot de passe
- [x] Informations personnelles

### ✅ Aide
- [x] FAQ par catégories
- [x] Barre de recherche
- [x] Contact support

---

## 🔐 Sécurité

L'authentification est **simple et fonctionnelle** comme demandé :

- ✅ Hash des mots de passe avec `password_hash()` PHP (bcrypt)
- ✅ Sessions PHP (`$_SESSION`)
- ✅ Validation basique (email + mdp 6 caractères min)
- ✅ Protection des routes côté backend
- ✅ CORS configuré
- ❌ Pas de JWT (volontairement simplifié)
- ❌ Pas de tokens complexes

---

## 🐛 Dépannage

### Erreur "Cannot connect to database"

Vérifiez que :
1. WAMP est démarré
2. MySQL tourne (icône WAMP verte)
3. La base `metr_db` existe dans phpMyAdmin
4. Les identifiants dans `backend/config/database.php` sont corrects

### Erreur CORS

Si vous avez des erreurs CORS, vérifiez que l'URL du frontend dans `backend/config/cors.php` correspond bien à `http://localhost:3000`

### Page blanche sur le frontend

```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📝 Comptes de test

### Admin
- Email : `admin@metr.fr`
- Mot de passe : `Admin123!`

### Utilisateur
- Email : `test@test.com`
- Mot de passe : `test123`

(ou créez votre propre compte via l'inscription)

---

## 🚀 Prochaines étapes (hors MVP)

- [ ] Intégration de la brique "Mesure" sur plans
- [ ] Export PDF/CSV/Excel fonctionnel
- [ ] Import de bibliothèques CSV/Excel avec parsing
- [ ] Upload de documents (plans DWG, PDF)
- [ ] Modals de création/édition de projets
- [ ] Gestion complète des articles (ajout, modification, suppression)
- [ ] Graphiques de statistiques (Recharts)
- [ ] Notifications temps réel
- [ ] Mode responsive mobile optimisé

---

## 📞 Support

Pour toute question :
- Email : support@metr.fr
- Documentation complète : `ReadMe.txt`

---

**Bon développement ! 🎉**
