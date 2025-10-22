# 🧪 GUIDE DE TEST RAPIDE - Maîtré

## 📋 Checklist pour tester toutes les fonctionnalités

### 🔗 URL : http://localhost:5176

---

## 1. 🔐 TEST DE CONNEXION

### Étapes
1. Ouvrir http://localhost:5176
2. Entrer les identifiants :
   - Email : `admin@metr.fr`
   - Mot de passe : `Admin123!`
3. Cliquer sur "Se connecter"

### ✅ Résultat attendu
- Redirection vers le dashboard
- Message de bienvenue avec le nom de l'utilisateur

---

## 2. 📋 TEST DE GESTION DES PROJETS

### A. Créer un projet manuellement

#### Étapes
1. Aller dans "Mes projets" (menu latéral)
2. Cliquer sur "Créer un projet"
3. Remplir le formulaire :
   - Nom du projet : `Test Villa Moderne`
   - Client : `M. Dupont`
   - Typologie : Sélectionner `Maison individuelle`
   - Référence interne : `TEST-001`
   - Adresse : `123 rue de la Paix, 75001 Paris`
   - Date de livraison : Choisir une date future
   - Statut : `En cours`
   - Surface : `150`
4. Cliquer sur "Créer le projet"

#### ✅ Résultat attendu
- Modal se ferme
- Nouveau projet apparaît dans la liste
- Badge "En cours" est vert
- Statistiques mises à jour

### B. Modifier un projet

#### Étapes
1. Sur le projet créé, cliquer sur les 3 points verticaux
2. Cliquer sur "Modifier"
3. Changer le statut en `Terminé`
4. Cliquer sur "Mettre à jour"

#### ✅ Résultat attendu
- Modal se ferme
- Badge du projet passe à "Terminé" (bleu)
- Statistiques mises à jour

### C. Rechercher un projet

#### Étapes
1. Dans la barre de recherche, taper `Villa`

#### ✅ Résultat attendu
- Seuls les projets contenant "Villa" s'affichent
- Filtrage en temps réel

### D. Supprimer un projet

#### Étapes
1. Sur le projet de test, cliquer sur les 3 points
2. Cliquer sur "Supprimer"
3. Confirmer la suppression

#### ✅ Résultat attendu
- Confirmation demandée
- Projet disparaît de la liste
- Statistiques mises à jour

### E. Importer des projets via CSV

#### Étapes
1. Cliquer sur "Importer CSV"
2. Cliquer sur "Télécharger" pour récupérer le modèle
3. Ouvrir le fichier téléchargé dans Excel/Notepad
4. Ajouter une ligne de test :
   ```csv
   nom_projet,client,typologie,reference_interne,adresse,date_livraison_prevue,statut,surface_totale
   Import Test,Client Test,Bureau,IMP-001,456 avenue Test,2025-12-31,Brouillon,200.00
   ```
5. Sauvegarder le fichier
6. Sélectionner le fichier dans le modal
7. Cliquer sur "Importer"

#### ✅ Résultat attendu
- Message de succès avec nombre de projets importés
- Nouveau projet visible dans la liste
- Modal se ferme après 2 secondes

---

## 3. 📚 TEST DE GESTION DES BIBLIOTHÈQUES

### A. Créer une bibliothèque

#### Étapes
1. Aller dans "Ma bibliothèque" (menu latéral)
2. Si aucune bibliothèque n'existe, cliquer sur "Créer ma première bibliothèque"
3. Sinon, cliquer sur "Nouvelle bibliothèque"
4. Remplir :
   - Nom : `Bibliothèque Test`
   - Description : `Bibliothèque de test pour validation`
5. Cliquer sur "Créer la bibliothèque"

#### ✅ Résultat attendu
- Modal se ferme
- Bibliothèque apparaît dans le sélecteur
- Message "0 article(s)" affiché

### B. Gérer les bibliothèques

#### Étapes
1. Cliquer sur "Gérer les bibliothèques"
2. Observer l'affichage en grille
3. Sur une bibliothèque, cliquer sur l'icône de crayon
4. Modifier la description
5. Cliquer sur "Mettre à jour"
6. Cliquer sur "Mode normal" pour revenir

#### ✅ Résultat attendu
- Mode gestion affiche les cartes
- Modification enregistrée
- Retour à l'affichage normal

### C. Importer des articles

#### Étapes
1. Sélectionner "Bibliothèque Test" dans le sélecteur
2. Cliquer sur "Importer CSV"
3. Cliquer sur "Télécharger" pour le modèle
4. Créer un fichier CSV avec :
   ```csv
   designation,lot,sous_categorie,unite,prix_unitaire,statut
   Béton C25/30,1- TERRASSEMENTS GÉNÉRAUX,Fondations,M3,120.50,Nouveau
   Brique 20x20x40,2- GROS ŒUVRE - MAÇONNERIE,Murs,M2,35.00,Validé
   ```
5. Sélectionner le fichier
6. Cliquer sur "Importer"

#### ✅ Résultat attendu
- Message "2 article(s) importé(s) avec succès"
- Articles visibles dans la table
- Badge "Nouveau" sur le premier article
- Prix formatés en euros

### D. Marquer un article en favori

#### Étapes
1. Cliquer sur l'étoile à côté d'un article

#### ✅ Résultat attendu
- Étoile devient jaune (remplie)
- Re-cliquer la vide à nouveau

### E. Rechercher un article

#### Étapes
1. Dans la barre de recherche, taper `Béton`

#### ✅ Résultat attendu
- Seuls les articles contenant "Béton" s'affichent
- Compteur mis à jour

### F. Supprimer une bibliothèque

#### Étapes
1. Cliquer sur "Gérer les bibliothèques"
2. Sur "Bibliothèque Test", cliquer sur l'icône poubelle
3. Confirmer la suppression

#### ✅ Résultat attendu
- Confirmation demandée
- Bibliothèque disparaît
- Si c'était la seule, message "Aucune bibliothèque trouvée"

---

## 4. ❓ TEST DE LA PAGE D'AIDE

### A. Affichage de l'aide

#### Étapes
1. Aller dans "Aide" (menu latéral)

#### ✅ Résultat attendu
- 4 catégories affichées
- Questions visibles dans chaque catégorie
- Carte de support en bas

### B. Recherche dans l'aide

#### Étapes
1. Dans la barre de recherche, taper `CSV`

#### ✅ Résultat attendu
- Seules les questions/réponses contenant "CSV" s'affichent
- Compteur de résultats affiché
- Les catégories sans résultat sont cachées

#### Étapes
2. Taper `azertyuiop` (mot inexistant)

#### ✅ Résultat attendu
- Message "Aucun résultat trouvé"
- Icône de recherche grisée
- Message "Essayez avec d'autres mots-clés"

#### Étapes
3. Effacer la recherche

#### ✅ Résultat attendu
- Toutes les catégories réapparaissent

---

## 5. 👤 TEST DE MON COMPTE

### A. Modifier le profil

#### Étapes
1. Aller dans "Mon Compte" (menu latéral)
2. Dans la section "Mon profil", modifier :
   - Entreprise : `Test Corporation`
   - Téléphone : `0123456789`
3. Cliquer sur "Enregistrer les modifications"

#### ✅ Résultat attendu
- Message de succès vert "Profil mis à jour avec succès !"
- Page se recharge
- Modifications visibles dans le formulaire

### B. Changer le mot de passe

#### Étapes
1. Dans la section "Sécurité" :
   - Mot de passe actuel : `Admin123!`
   - Nouveau mot de passe : `NewPass123!`
   - Confirmer : `NewPass123!`
2. Cliquer sur "Changer le mot de passe"

#### ✅ Résultat attendu
- Message de succès vert "Mot de passe modifié avec succès !"
- Formulaire se vide
- Peut se reconnecter avec le nouveau mot de passe

#### Étapes de validation
3. Se déconnecter
4. Se reconnecter avec :
   - Email : `admin@metr.fr`
   - Mot de passe : `NewPass123!`

#### ✅ Résultat attendu
- Connexion réussie

### C. Validation du formulaire mot de passe

#### Étapes
1. Essayer de soumettre avec :
   - Nouveau mot de passe : `test`
   - Confirmation : `test`
2. Cliquer sur "Changer le mot de passe"

#### ✅ Résultat attendu
- Message d'erreur "Le nouveau mot de passe doit contenir au moins 8 caractères"
- Formulaire non soumis

#### Étapes
3. Essayer avec :
   - Nouveau mot de passe : `Password123!`
   - Confirmation : `DifferentPass123!`
4. Cliquer sur "Changer le mot de passe"

#### ✅ Résultat attendu
- Message d'erreur "Les mots de passe ne correspondent pas"
- Formulaire non soumis

### D. Vérifier les informations du compte

#### Étapes
1. Descendre jusqu'à la carte "Informations du compte"

#### ✅ Résultat attendu
- Rôle affiché : "Administrateur"
- Date de création visible
- Date de dernière mise à jour visible

---

## 6. 🎯 TEST GLOBAL DU DASHBOARD

### Étapes
1. Aller sur le Dashboard (menu latéral, première option)

#### ✅ Résultat attendu
- Message de bienvenue personnalisé
- 4 KPIs affichés (projets, articles, bibliothèques, utilisateurs si admin)
- Derniers projets affichés (jusqu'à 4)
- Bouton "Voir tous les projets" fonctionnel

---

## 7. 🔄 TEST DES SESSIONS

### Étapes
1. Se déconnecter (bouton dans le menu latéral)
2. Essayer d'accéder à http://localhost:5176/dashboard directement

#### ✅ Résultat attendu
- Redirection vers la page de connexion
- Impossible d'accéder aux pages protégées sans être connecté

---

## ✅ CHECKLIST FINALE

### Backend
- [ ] Toutes les APIs répondent (testées via les actions frontend)
- [ ] Les données sont bien sauvegardées en base
- [ ] Les modifications sont persistées
- [ ] Les suppressions fonctionnent
- [ ] Les imports CSV sont fonctionnels
- [ ] Les sessions PHP fonctionnent
- [ ] Le CORS est configuré

### Frontend
- [ ] Toutes les pages sont accessibles
- [ ] Tous les boutons fonctionnent
- [ ] Tous les formulaires fonctionnent
- [ ] Toutes les recherches fonctionnent
- [ ] Tous les modals s'ouvrent et se ferment
- [ ] Les messages d'erreur s'affichent
- [ ] Les messages de succès s'affichent
- [ ] Le loading state est visible
- [ ] Le design est cohérent
- [ ] Pas d'erreur dans la console

### Fonctionnalités
- [ ] Création de projets (manuel + CSV)
- [ ] Modification de projets
- [ ] Suppression de projets
- [ ] Recherche de projets
- [ ] Création de bibliothèques
- [ ] Modification de bibliothèques
- [ ] Suppression de bibliothèques
- [ ] Import d'articles via CSV
- [ ] Toggle favoris sur articles
- [ ] Recherche d'articles
- [ ] Recherche dans l'aide
- [ ] Modification du profil
- [ ] Changement de mot de passe

---

## 🎉 SI TOUS LES TESTS PASSENT

**L'application est 100% fonctionnelle et prête à l'emploi !**

Toutes les fonctionnalités demandées ont été implémentées et testées.

---

## 🐛 EN CAS DE PROBLÈME

### Vérifications de base
1. WAMP est démarré (icône verte)
2. Le serveur Vite tourne sur http://localhost:5176
3. La base de données `metr_db` existe dans phpMyAdmin
4. Le CORS est configuré pour le port 5176

### Console du navigateur
1. Appuyer sur F12
2. Aller dans l'onglet "Console"
3. Vérifier s'il y a des erreurs en rouge
4. Noter le message d'erreur pour diagnostic

### Logs backend
1. Vérifier les logs PHP dans WAMP
2. Fichier d'erreur PHP : `C:\wamp64\logs\php_error.log`

---

*Guide créé le 14 octobre 2025*
*Pour l'application Maîtré v1.0.0*
