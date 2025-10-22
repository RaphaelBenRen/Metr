# Metr. - Documentation Complète du Projet

## 📋 Vue d'ensemble

**Metr.** est une application web de gestion de métrés pour le secteur de la construction. L'objectif est de créer une interface complète et fonctionnelle (une "coque") autour d'une brique "Mesure" existante, permettant aux économistes de la construction, ingénieurs et architectes de gérer leurs projets de métré efficacement.

---

## 🎯 Objectifs du Projet

### Objectif 1 : Stratégique
Faire de Metr. l'outil incontournable du métré en présentant une version fonctionnelle aux clients et investisseurs.

### Objectif 2 : Technique
Construire un environnement numérique complet capable de centraliser :
- Gestion de compte utilisateur
- Création et gestion de projets
- Import/export de fichiers (Excel, DWG, CSV)
- Bibliothèque de données (articles, prix)
- Tableau de bord et statistiques

### Objectif 3 : UX/UI
Offrir une expérience fluide, intuitive et cohérente avec l'identité Metr. :
- Onboarding simple
- Navigation claire
- Interface moderne et épurée
- Design responsive (desktop, tablette, mobile)

---

## 🎨 Design et Identité Visuelle

### Palette de couleurs
- **Bleu foncé (#1E3A8A)** : Couleur principale pour les en-têtes et boutons primaires
- **Blanc (#FFFFFF)** : Arrière-plan principal pour une apparence épurée
- **Gris clair (#F3F4F6)** : Arrière-plan des sections pour délimiter le contenu
- **Orange (#F97316)** : Couleur d'accentuation pour les appels à l'action (CTA)

### Typographies
- **Titres** : 'Montserrat', sans-serif, gras
- **Corps de texte** : 'Roboto', sans-serif, régulier

### Style graphique
- Moderne et minimaliste
- Utilisation judicieuse des espaces blancs
- Illustrations vectorielles personnalisées pour expliquer les fonctionnalités
- Icônes simples et cohérentes (Lucide React)

### Logo et Ressources
**IMPORTANT** : 
- ✅ Les **logos Metr.** sont disponibles dans le dossier **`drive download`**
- ✅ Des **captures d'écran du style visuel souhaité** sont disponibles dans le dossier **`style`**
- 👉 **Consulte ces fichiers pour respecter l'identité visuelle exacte**

Le logo "Metr." utilise un M majuscule en bleu foncé avec un point orange.

---

## 🛠 Stack Technique

### Frontend
**Core Framework**
- React 19.1.0 + TypeScript 5.2.2
- Vite 6.3.5 (build tool et dev server)
- TanStack Router 1.130.2 (routing)

**UI & Styling**
- Tailwind CSS 4.1.8 (styling)
- Shadcn/ui (composants)
- Radix UI (composants accessibles) : Dialog, Dropdown, Select, Tabs, Tooltip, etc.
- Lucide React (icônes)
- Headless UI (composants headless)

### Backend
- **PHP** avec architecture REST API
- **Base de données** : MySQL via phpMyAdmin
- **Serveur local** : WAMP (pour développement)

### Authentification - SIMPLIFIÉE
**IMPORTANT : Authentification simple et rapide**

Pour cette version, nous voulons une **authentification basique et fonctionnelle** sans complexité excessive :

- ✅ **Connexion simple** : Email + Mot de passe
- ✅ **Stockage basique** : Hash des mots de passe avec `password_hash()` PHP (bcrypt par défaut)
- ✅ **Session PHP simple** : Pas besoin de JWT complexe, utiliser `$_SESSION`
- ✅ **Validation minimale** : Email valide + mot de passe minimum 6 caractères
- ❌ **PAS de** : Tokens JWT, refresh tokens, 2FA, OAuth, etc.
- ❌ **PAS de** : Système de reset de mot de passe complexe
- ❌ **PAS de** : Middleware d'authentification avancé

**Objectif** : Que ça fonctionne rapidement sans se perdre dans la sécurité complexe. On pourra améliorer plus tard.

```php
// Exemple simple de connexion
session_start();

// Login
$email = $_POST['email'];
$password = $_POST['password'];

$user = getUserByEmail($email);
if ($user && password_verify($password, $user['password'])) {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role'] = $user['role'];
    echo json_encode(['success' => true, 'user' => $user]);
} else {
    echo json_encode(['success' => false, 'message' => 'Identifiants incorrects']);
}

// Vérification (dans les routes protégées)
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non authentifié']);
    exit;
}
```

---

## 🗄 Structure de la Base de Données

**IMPORTANT** : 
- ✅ La **base de données existe déjà** et est accessible
- ✅ Tu auras **accès direct à la base de données MySQL**
- ✅ Les tables sont déjà créées selon la structure ci-dessous
- 👉 **Tu n'as pas besoin de créer les tables, juste les utiliser**

### Configuration Base de Données

**Informations de Connexion MySQL/MariaDB**

```
Host : 127.0.0.1 (localhost)
Port : 3306
Utilisateur : root
Mot de passe : (vide)
Base de données : metr_db
Jeu de caractères : utf8mb4_unicode_ci
```

### Table : `users`
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    entreprise VARCHAR(255),
    telephone VARCHAR(20),
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Compte admin par défaut** :
- Email : admin@metr.fr
- Mot de passe : Admin123!

### Table : `projects`
```sql
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    nom_projet VARCHAR(255) NOT NULL,
    client VARCHAR(255) NOT NULL,
    reference_interne VARCHAR(100),
    typologie ENUM(
        'Maison individuelle',
        'Immeuble résidentiel',
        'Bureau',
        'Commerce',
        'Industriel',
        'Équipement public',
        'Autre'
    ) NOT NULL,
    adresse TEXT,
    date_livraison_prevue DATE,
    statut ENUM('En cours', 'Brouillon', 'Terminé', 'Archivé') DEFAULT 'Brouillon',
    surface_totale DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table : `libraries`
```sql
CREATE TABLE libraries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    nom VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table : `articles`
```sql
CREATE TABLE articles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    library_id INT NOT NULL,
    designation VARCHAR(255) NOT NULL,
    lot ENUM(
        '1- TERRASSEMENTS GÉNÉRAUX',
        '2- GROS ŒUVRE - MAÇONNERIE',
        '3- MÉTALLERIE, FERRONNERIE',
        '4- PLÂTRERIE',
        '5- ISOLATION',
        '6- CARRELAGES, REVÊTEMENTS',
        '7- SOLS SOUPLES',
        '8- PEINTURES',
        '9- MENUISERIES INTÉRIEURES',
        '10- MENUISERIES EXTÉRIEURES',
        '11- ÉLECTRICITÉ COURANTS FORTS',
        '12- PLOMBERIES SANITAIRES',
        '13- COUVERTURE, ZINGUERIE',
        '14- ÉTANCHÉITÉ',
        '15- STORES ET FERMETURES',
        '16- VRD, ESPACES EXTÉRIEURS'
    ) NOT NULL,
    sous_categorie VARCHAR(100),
    unite ENUM('M2', 'M3', 'L', 'U') NOT NULL,
    prix_unitaire DECIMAL(10,2) NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    statut ENUM('Nouveau', 'En cours', 'Validé') DEFAULT 'Nouveau',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
);
```

### Table : `project_documents`
```sql
CREATE TABLE project_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    type ENUM('plan', 'document') NOT NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier TEXT NOT NULL,
    format VARCHAR(10),
    taille_fichier INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### Table : `statistics`
```sql
CREATE TABLE statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    mois DATE NOT NULL,
    projets_actifs INT DEFAULT 0,
    projets_archives INT DEFAULT 0,
    surface_mesuree DECIMAL(10,2) DEFAULT 0,
    exports_realises INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 📱 Architecture de l'Application

### Structure des dossiers
```
metr-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Composants Shadcn/ui
│   │   │   ├── layout/          # Header, Sidebar, Footer
│   │   │   ├── dashboard/       # Composants du dashboard
│   │   │   ├── projects/        # Composants projets
│   │   │   ├── library/         # Composants bibliothèque
│   │   │   └── admin/           # Composants admin
│   │   ├── pages/
│   │   │   ├── auth/            # Login, Register
│   │   │   ├── dashboard/       # Dashboard principal
│   │   │   ├── projects/        # Gestion projets
│   │   │   ├── library/         # Bibliothèque
│   │   │   ├── admin/           # Panel admin
│   │   │   ├── settings/        # Réglages
│   │   │   └── help/            # Aide
│   │   ├── services/            # API calls
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Fonctions utilitaires
│   │   ├── types/               # TypeScript types
│   │   ├── assets/              # Images, logos
│   │   └── styles/              # CSS global
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── api/
│   │   ├── auth/                # Authentification simple
│   │   ├── users/               # Gestion utilisateurs
│   │   ├── projects/            # Gestion projets
│   │   ├── libraries/           # Gestion bibliothèques
│   │   ├── articles/            # Gestion articles
│   │   ├── statistics/          # Statistiques
│   │   └── admin/               # Routes admin
│   ├── config/                  # Configuration DB
│   └── utils/                   # Fonctions utilitaires
│
├── drive download/              # 📁 LOGOS METR. ICI
├── style/                       # 📁 CAPTURES D'ÉCRAN DU STYLE ICI
└── database/
    └── migrations/              # Scripts SQL (déjà créés)
```

---

## 🎯 INSTRUCTIONS PRINCIPALES POUR CLAUDE CODE

### 🚨 PRIORITÉS ABSOLUES

1. **Visuel professionnel** 
   - ✅ Consulte le dossier **`style/`** pour voir les captures d'écran du design souhaité
   - ✅ Utilise les **logos** du dossier **`drive download/`**
   - ✅ Crée une interface **moderne, propre, professionnelle**
   - ✅ Respecte la charte graphique Metr. (bleu foncé, orange, blanc)

2. **Toutes les fonctionnalités**
   - ✅ Implémente **TOUTES** les fonctionnalités décrites dans ce document
   - ✅ Dashboard complet avec statistiques
   - ✅ Gestion projets (CRUD complet)
   - ✅ Bibliothèque avec import CSV/Excel
   - ✅ Panel d'administration
   - ✅ Page paramètres et aide

3. **Base de données existante**
   - ✅ La base de données **existe déjà** (metr_db)
   - ✅ Tu as **accès direct** à la base
   - ✅ Ne crée pas les tables, **utilise-les directement**
   - ✅ Connexion : localhost, root, pas de mot de passe

4. **Authentification simple**
   - ✅ Connexion basique avec sessions PHP (`$_SESSION`)
   - ✅ Pas de JWT, pas de tokens complexes
   - ✅ Hash password avec `password_hash()` PHP
   - ✅ Validation minimale (email + mdp 6 caractères)

---

## 👥 Utilisateurs Cibles

### 1. Économistes de la construction
**Profil** : Spécialistes de l'estimation des coûts pour conseiller l'architecte et le maître d'ouvrage

**Besoins** :
- Import rapide de plans (PDF, DWG)
- Mesure semi-automatique fiable (surfaces, longueurs, comptages)
- Organisation par lots et sous-lots
- Export Excel et PDF propres et exploitables
- Versioning clair pour gérer les modifications

### 2. Ingénieurs prix / Chargés d'études (BTP)
**Profil** : Interviennent en phase d'appel d'offre pour produire des devis précis

**Besoins** :
- Exploiter les plans définitifs pour chiffrer rapidement
- Collaborer avec d'autres éditeurs
- Gestion efficace des bibliothèques d'articles
- Suivi historique et traçabilité des données

### 3. Formateurs (écoles/centres)
**Profil** : Enseignent le métré aux étudiants ou apprenants

**Besoins** :
- Interface simple et intuitive pour l'apprentissage
- Gestion de projets multiples
- Possibilité de partager des projets en lecture seule
- Créer des exercices pédagogiques et guider les apprenants

### 4. Clients finaux / Partenaires (en lecture seule)
**Profil** : Architectes, maîtres d'ouvrage ou autres parties prenantes qui valident les métrés

**Besoins** :
- Accès sécurisé en lecture seule
- Visualisation claire des mesures et repérages sur plans
- Téléchargement des exports autorisés

---

## 📄 Pages et Fonctionnalités

### 1. Dashboard (Page d'accueil après connexion)

**Header** :
- Logo Metr. (lien vers dashboard)
- Navigation : Tableau de bord | Projets | Bibliothèque | Aide | Paramètres
- Avatar utilisateur avec dropdown (Profil, Déconnexion)
- (Admin uniquement) : Lien "Administration"

**Contenu principal** :
- Message de bienvenue : "Bienvenue John 👋"
- Date du jour : "Lundi 13 octobre 2025"

**Section "MES PROJETS"** :
- Bouton "Créer un projet" (orange, en haut à droite)
- Liste des projets récents (3-4 cartes) avec :
  - Nom du projet
  - Client
  - Date de création
  - Statut (badge coloré)
  - Boutons "Ouvrir" et "Exporter"

**Section "STATISTIQUES"** (en bas) :
- **Projets actifs** : Nombre + variation par rapport au mois précédent
- **m² mesurés ce mois** : Total + variation par rapport au mois dernier
- **Exports récents** : Nombre + date du dernier export
- **Projets archivés** : Nombre total
- Graphiques optionnels (courbes d'évolution)

---

### 2. Page "Mes Projets"

**Header** :
- Titre : "Mes projets"
- Barre de recherche : "Rechercher un projet"
- Filtres (dropdowns) :
  - Tous les statuts / En cours / Brouillon / Terminé / Archivé
  - Tous (client)
  - Tous (autre filtre pertinent)
  - Dernière modification (tri)
- Toggle : "Afficher aussi les projets archivés"

**Liste des projets** :
- Cards avec :
  - Nom du projet (titre)
  - Client
  - Date de création
  - Statut (badge)
  - Boutons "Ouvrir" et "Exporter"
  - Menu 3 points : Modifier | Dupliquer | Archiver | Supprimer

**Footer statistiques** :
- Nombre total de projets
- Projets actifs
- Projets archivés

**Bouton "Créer un projet"** (fixed, en bas à droite, orange)

---

### 3. Modal "Créer un nouveau projet"

**Section "Informations du projet"** :
- Nom du projet* (Ex: Villa Méditerranée)
- Client* (Ex: Dupont Immobilier)
- Référence interne (Ex: PRJ-2025-042)
- Typologie projet* (dropdown) :
  - Maison individuelle
  - Immeuble résidentiel
  - Bureau
  - Commerce
  - Industriel
  - Équipement public
  - Autre
- Adresse du projet (Ex: 12 Avenue des Plans, 75001 Paris)
- Date prévisionnelle de livraison (date picker)

**Section "Documents du projet"** :
- Onglets : **Plans** | Documents
- Zone de drag & drop : "Déposer vos plans ici"
  - Formats recommandés : DWG, PDF
  - Bouton "Parcourir les plans"
- Bouton "+ Ajouter un autre plan"
- Note : "Vous pourrez ajouter d'autres documents après la création du projet"

**Boutons** :
- Annuler (gris)
- Créer le projet (orange)

---

### 4. Page "Bibliothèque"

**Header** :
- Titre : "Ma bibliothèque"
- Bouton "Gérer les bibliothèques" (icône engrenage)
- Bouton "Importer une bibliothèque" (icône upload, orange)

**Dropdown bibliothèque** :
- "Tous les articles (5 articles)" (sélectionné par défaut)
- Autres bibliothèques créées par l'utilisateur

**Filtres** :
- Barre de recherche
- Tous les lot (dropdown avec 16 lots)
- Toutes les sous-catégorie (dropdown) :
  - Carrelage
  - Peinture
  - Fondation
  - Porte
  - Fenêtre
  - etc.
- Toutes les unité (dropdown) :
  - M2
  - L
  - M3
  - U

**Table des articles** :
Colonnes :
- Checkbox (sélection multiple)
- Étoile (favoris)
- Désignation
- Lot
- Sous-catégorie
- Unité
- Prix unitaire
- Dernière mise à jour

**Actions** :
- Bouton "Sélectionner" (permet de sélectionner plusieurs articles)
- Bouton "+ Ajouter un article" (orange)

---

### 5. Modal "Gérer les bibliothèques"

**Titre** : "Gérer les bibliothèques"
**Sous-titre** : "Vous pouvez supprimer les bibliothèques dont vous n'avez plus besoin."

**Table** :
Colonnes :
- Nom
- Date de création
- Articles (nombre)
- Actions (icône poubelle)

**Exemples de bibliothèques** :
- Tous les articles
- ATTIC+
- BatiMat 2023
- Bibliothèque par défaut
- Favoris

**Bouton** : Fermer

---

### 6. Modal "Importer une bibliothèque"

**Titre** : "Importer une bibliothèque"
**Sous-titre** : "Sélectionnez un format d'import et entrez un nom pour votre bibliothèque"

**Onglets** :
- Fichier Excel (sélectionné)
- Autre format

**Champs** :
- Nom de la bibliothèque (Ex: ATTIC+ 2025)
- Zone de drag & drop : "Glissez-déposez votre fichier ici ou cliquez pour sélectionner"
  - Supports : .xlsx, .xls, .csv

**Note importante** :
"Le fichier doit contenir les colonnes : designation, lot, subCategory, unite, prix_unitaire"

**Structure CSV attendue** :
```csv
designation,lot,subCategory,unite,prix_unitaire
"Carrelage grès cérame","6- CARRELAGES, REVÊTEMENTS","Carrelage","M2",45.20
"Peinture mate blanche","8- PEINTURES","Peinture","L",28.75
```

**Boutons** :
- Annuler
- Confirmer (orange)

---

### 7. Page "Administration" (Admin uniquement)

**Sections** :

**Gestion des utilisateurs** :
- Liste de tous les utilisateurs
- Colonnes : Nom, Prénom, Email, Entreprise, Rôle, Date d'inscription, Actions
- Actions : Voir projets | Modifier | Supprimer
- Filtre par rôle (Admin / User)

**Gestion des projets** :
- Liste de TOUS les projets (tous utilisateurs)
- Colonnes : Nom projet, Propriétaire, Client, Statut, Date création, Actions
- Filtres : Par utilisateur, par statut, par date
- Actions : Voir | Modifier | Supprimer

**Gestion des bibliothèques** :
- Vue de toutes les bibliothèques
- Possibilité de créer des bibliothèques globales
- Suppression de bibliothèques

**Statistiques globales** :
- Nombre total d'utilisateurs
- Nombre total de projets
- Nombre total d'articles
- Graphiques d'utilisation

---

### 8. Page "Paramètres"

**Sections** :

**Mon profil** :
- Photo de profil (upload)
- Nom, Prénom
- Email
- Entreprise
- Téléphone
- Bouton "Sauvegarder"

**Sécurité** :
- Modifier le mot de passe (simple)

**Préférences** :
- Langue (Français par défaut)
- Format de date (DD/MM/YYYY ou MM/DD/YYYY)
- Notifications par email (toggle)

**Gestion du compte** :
- Exporter mes données
- Supprimer mon compte (avec confirmation)

---

### 9. Page "Aide"

**Sections** :

**Centre d'aide** :
- Barre de recherche : "Rechercher dans l'aide..."

**FAQ** :
Questions fréquentes organisées par catégories :
- Premiers pas
- Gestion des projets
- Import/Export
- Bibliothèque d'articles
- Mesure et plans
- Facturation et compte

**Tutoriels** :
- "Comment créer mon premier projet ?"
- "Importer mes plans"
- "Créer et gérer ma bibliothèque"
- "Exporter mes métrés"
- [Vidéos tutorielles si disponibles]

**Documentation** :
- Lien vers documentation complète (PDF téléchargeable)
- Guide utilisateur

**Support** :
- Formulaire de contact
- Email : support@metr.fr
- Temps de réponse moyen : 24h

**Ressources** :
- Modèles de bibliothèques à télécharger
- Exemples de projets
- Astuces et bonnes pratiques

---

## 🔄 Fonctionnalités Import/Export

### Import

**Formats supportés** :
- **Plans** : PDF, DWG
- **Bibliothèques** : Excel (.xlsx, .xls), CSV (.csv)

**Processus d'import de bibliothèque** :
1. Clic sur "Importer une bibliothèque"
2. Choix du format (Excel/CSV)
3. Nom de la bibliothèque
4. Upload du fichier (drag & drop ou sélection)
5. Validation de la structure des colonnes
6. Import et feedback utilisateur (nombre d'articles importés)

**Validation des données** :
- Vérification des colonnes requises
- Vérification des types de données (prix = nombre, unité = enum)
- Alerte en cas d'erreur avec détails

### Export

**Formats d'export** :
- CSV (pour les articles et projets)
- PDF (pour les rapports)
- Excel (pour les tableaux de métré)

**Processus d'export** :
1. Sélection du projet ou des articles à exporter
2. Choix du format
3. Génération du fichier
4. Téléchargement automatique
5. **Pas de sauvegarde dans la base de données** (seulement comptabilisé dans les stats)

---

## 📊 Statistiques et Métriques

### Statistiques utilisateur (Dashboard)

**Projets** :
- Nombre total de projets
- Projets actifs
- Projets archivés
- Variation par rapport au mois précédent

**Surfaces** :
- m² mesurés ce mois
- m² total sur tous les projets
- Variation mensuelle

**Activité** :
- Nombre d'exports récents
- Date du dernier export
- Fréquence d'utilisation

**Graphiques (optionnels)** :
- Évolution du nombre de projets par mois
- Répartition des projets par statut (camembert)
- m² mesurés par mois (courbe)

### Statistiques admin

**Vue globale** :
- Nombre total d'utilisateurs
- Utilisateurs actifs (derniers 30 jours)
- Nombre total de projets
- Nombre total d'articles dans toutes les bibliothèques

**Activité** :
- Nouveaux utilisateurs par mois
- Projets créés par mois
- Exports réalisés par mois

---

## 🌐 Endpoints API (Exemples simplifiés)

### Auth (Simple)
- `POST /api/auth/login.php` : Connexion (retourne user data + session)
- `POST /api/auth/register.php` : Inscription
- `POST /api/auth/logout.php` : Déconnexion (détruit session)
- `GET /api/auth/check.php` : Vérifier si connecté

### Users
- `GET /api/users/me.php` : Profil utilisateur connecté
- `PUT /api/users/me.php` : Mise à jour profil
- `PUT /api/users/password.php` : Changement mot de passe

### Projects
- `GET /api/projects/list.php` : Liste des projets
- `GET /api/projects/get.php?id=X` : Détail projet
- `POST /api/projects/create.php` : Créer projet
- `PUT /api/projects/update.php` : Modifier projet
- `DELETE /api/projects/delete.php?id=X` : Supprimer projet

### Libraries
- `GET /api/libraries/list.php` : Liste bibliothèques
- `POST /api/libraries/create.php` : Créer bibliothèque
- `POST /api/libraries/import.php` : Importer CSV/Excel
- `DELETE /api/libraries/delete.php?id=X` : Supprimer

### Articles
- `GET /api/articles/list.php?library_id=X` : Liste articles
- `POST /api/articles/create.php` : Créer article
- `PUT /api/articles/update.php` : Modifier article
- `DELETE /api/articles/delete.php?id=X` : Supprimer

### Statistics
- `GET /api/statistics/user.php` : Stats utilisateur
- `GET /api/statistics/admin.php` : Stats globales (admin)

### Admin
- `GET /api/admin/users.php` : Liste utilisateurs
- `GET /api/admin/projects.php` : Liste tous projets
- `DELETE /api/admin/user.php?id=X` : Supprimer utilisateur

---

## 📱 Responsive Design

### Breakpoints Tailwind
- **sm** : 640px (mobile)
- **md** : 768px (tablette)
- **lg** : 1024px (laptop)
- **xl** : 1280px (desktop)
- **2xl** : 1536px (large desktop)

### Adaptations mobile

**Navigation** :
- Menu hamburger sur mobile
- Sidebar collapsible

**Dashboard** :
- Cards en colonne unique sur mobile
- Statistiques en stack vertical

**Tableaux** :
- Scroll horizontal ou cards adaptatives
- Filtres dans un drawer

**Modals** :
- Plein écran sur mobile
- Overlay sur desktop

---

## 📝 Notes Importantes pour le Développement

### Brique "Mesure" existante
- **NE PAS développer** la fonctionnalité de mesure sur plans
- Cette brique sera intégrée ultérieurement
- Prévoir l'espace et l'architecture pour l'intégration future
- Dans le projet, prévoir un bouton "Ouvrir dans l'outil de mesure" qui sera fonctionnel plus tard

### Exports
- **NE PAS sauvegarder** les fichiers exportés dans la base de données
- Seulement incrémenter le compteur d'exports dans les statistiques
- Génération à la volée des fichiers

### Performance
- Pagination des listes (projets, articles) : 20 items par page
- Lazy loading des images et documents
- Optimisation des requêtes SQL (indexes sur user_id, project_id)

---

## 🧪 Checklist de Développement

### Setup & Configuration
- [ ] Configuration Vite + React + TypeScript + Tailwind
- [ ] Connexion à la base de données existante (metr_db)
- [ ] Test de connexion DB
- [ ] Import des logos depuis `drive download/`
- [ ] Consultation des captures d'écran dans `style/`

### Authentification Simple
- [ ] Page login/register avec design Metr.
- [ ] API auth PHP simple (login.php, register.php, logout.php)
- [ ] Sessions PHP ($_SESSION)
- [ ] Hash password avec password_hash()
- [ ] Validation basique (email + mdp 6 car.)
- [ ] Gestion des rôles (user/admin)

### Layout & Navigation
- [ ] Header avec logo Metr.
- [ ] Navigation principale
- [ ] Avatar utilisateur avec dropdown
- [ ] Sidebar (optionnel)
- [ ] Responsive mobile

### Dashboard
- [ ] Message de bienvenue personnalisé
- [ ] Section "Mes projets" (3-4 derniers)
- [ ] Section "Statistiques" avec KPIs
- [ ] Graphiques (optionnels)
- [ ] Bouton "Créer un projet"

### Projets
- [ ] Page "Mes projets" avec filtres
- [ ] Modal "Créer un nouveau projet"
- [ ] Upload de documents (plans)
- [ ] Liste des projets (cards)
- [ ] Actions : ouvrir, exporter, modifier, supprimer, archiver
- [ ] API CRUD projets

### Bibliothèque
- [ ] Page "Bibliothèque" avec filtres
- [ ] Table des articles
- [ ] Modal "Ajouter un article"
- [ ] Modal "Gérer les bibliothèques"
- [ ] Modal "Importer une bibliothèque"
- [ ] Parsing CSV/Excel
- [ ] API CRUD bibliothèques et articles

### Administration
- [ ] Page admin dédiée
- [ ] Gestion des utilisateurs (liste, modifier, supprimer)
- [ ] Gestion des projets (liste tous utilisateurs)
- [ ] Statistiques globales
- [ ] Protection des routes admin

### Paramètres
- [ ] Page paramètres
- [ ] Modification du profil
- [ ] Changement de mot de passe (simple)
- [ ] Upload photo de profil
- [ ] Préférences utilisateur

### Aide
- [ ] Page aide avec FAQ
- [ ] Centre de documentation
- [ ] Formulaire de contact
- [ ] Ressources téléchargeables

### Export
- [ ] Export CSV (articles)
- [ ] Export PDF (projet)
- [ ] Export Excel (métré)
- [ ] Génération à la volée
- [ ] Compteur d'exports dans stats

### Tests
- [ ] Tests responsive (mobile, tablette, desktop)
- [ ] Test de toutes les fonctionnalités
- [ ] Vérification du design vs captures `style/`

---

## 🎨 Composants Principaux à Créer

### Layout Components
- `<Header />` : Logo, navigation, avatar
- `<Sidebar />` : Navigation latérale (optionnel)

### Dashboard Components
- `<StatCard />` : Card de statistique avec icône, valeur, variation
- `<ProjectCard />` : Card d'un projet avec infos et actions
- `<RecentProjects />` : Section des projets récents

### Project Components
- `<ProjectList />` : Liste des projets avec filtres
- `<ProjectFilters />` : Barre de filtres
- `<CreateProjectModal />` : Modal de création de projet
- `<FileUpload />` : Zone de drag & drop pour upload

### Library Components
- `<ArticleTable />` : Table des articles avec tri et filtres
- `<ArticleFilters />` : Filtres (lot, catégorie, unité)
- `<AddArticleModal />` : Modal d'ajout d'article
- `<ManageLibrariesModal />` : Modal de gestion des bibliothèques
- `<ImportLibraryModal />` : Modal d'import avec parsing CSV/Excel

### Admin Components
- `<UserList />` : Liste des utilisateurs
- `<ProjectListAdmin />` : Liste de tous les projets
- `<GlobalStats />` : Statistiques globales

### Common Components
- `<Button />` : Bouton personnalisé avec variantes
- `<Input />` : Champ de formulaire
- `<Select />` : Dropdown sélecteur
- `<Modal />` : Modal générique
- `<Badge />` : Badge de statut
- `<SearchBar />` : Barre de recherche
- `<DatePicker />` : Sélecteur de date
- `<LoadingSpinner />` : Indicateur de chargement
- `<Toast />` : Notifications

---

## ✅ Critères de Réussite

Le projet sera considéré comme réussi si :

1. ✅ **L'authentification simple fonctionne** (login/register, sessions PHP)
2. ✅ **Le dashboard affiche correctement** les projets et statistiques
3. ✅ **CRUD complet des projets** fonctionne
4. ✅ **Import de bibliothèques CSV/Excel** fonctionne
5. ✅ **Filtres et recherche** fonctionnent sur projets et articles
6. ✅ **Export CSV/PDF** fonctionne
7. ✅ **Panel admin** permet de gérer users et projets
8. ✅ **Design responsive** sur mobile, tablette, desktop
9. ✅ **Identité visuelle Metr. respectée** (couleurs, typo, logo du dossier `drive download/`)
10. ✅ **Interface professionnelle** correspondant aux captures du dossier `style/`
11. ✅ **Toutes les fonctionnalités implémentées**
12. ✅ **Code propre, commenté, maintenable**

---

## 🎯 MVP Focus

Pour cette première version, **se concentrer sur** :
- ✅ Authentification simple et fonctionnelle
- ✅ Gestion de projets fluide et complète
- ✅ Import/export de données
- ✅ Interface claire, intuitive et professionnelle
- ✅ Responsive design
- ✅ Respect du design (logos + captures d'écran)

**Reporter à plus tard** :
- Brique "Mesure" (déjà existante, à intégrer ultérieurement)
- Collaboration multi-utilisateurs
- Notifications temps réel
- Mode hors ligne
- Application mobile

---

## 💡 INSTRUCTIONS FINALES POUR CLAUDE CODE

### Tu as accès à :

1. **📁 Dossier `drive download/`** : Contient les **logos Metr.** officiels
2. **📁 Dossier `style/`** : Contient les **captures d'écran du design** que je veux
3. **🗄️ Base de données `metr_db`** : Déjà créée avec toutes les tables

### Ce que tu dois faire :

1. **Consulte d'abord** les captures d'écran dans `style/` pour comprendre le design
2. **Utilise les logos** du dossier `drive download/`
3. **Connecte-toi à la base de données** existante (localhost, root, pas de mdp)
4. **Crée une interface professionnelle** avec toutes les fonctionnalités listées
5. **Authentification simple** : Sessions PHP, pas de JWT complexe
6. **Implémente TOUTES les pages** décrites dans ce document
7. **Design responsive** et moderne
8. **Code propre** et maintenable

### Objectif final :

Une application Metr. **complète, fonctionnelle et professionnelle** prête à être présentée aux clients et investisseurs, avec un visuel correspondant exactement aux captures d'écran du dossier `style/`.

---

**Bonne chance pour le développement ! 🚀**

Si des questions ou clarifications sont nécessaires, n'hésite pas à demander.