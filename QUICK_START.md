# 🚀 QUICK START - Metr.

## Installation ultra-rapide (3 minutes)

### 1. Base de données ✅
La base `metr_db` existe déjà ! Rien à faire.

### 2. Installation Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. C'est prêt !

Ouvrez : **http://localhost:5174**

Connectez-vous avec :
- Email : `admin@metr.fr`
- Mot de passe : `Admin123!`

---

## ✅ Ce qui fonctionne (MVP)

- ✅ **Authentification** : Login/Register/Logout avec sessions PHP
- ✅ **Dashboard** : Projets récents + Statistiques
- ✅ **Sidebar bleue** avec navigation Metr.
- ✅ **Page Projets** : Liste avec filtres et recherche
- ✅ **Page Bibliothèque** : Table d'articles avec filtres
- ✅ **Page Admin** : Stats globales + liste utilisateurs
- ✅ **Pages Paramètres & Aide**
- ✅ **Design professionnel** : Couleurs Metr. (#1E3A8A bleu, #F97316 orange)
- ✅ **Responsive** de base

## 🔄 À développer ensuite

- Modal création de projet
- Import CSV/Excel bibliothèques
- Export PDF/CSV
- Upload de documents
- Modals d'édition
- Suppression avec confirmation
- Graphiques stats (Recharts)
- Intégration brique "Mesure"

---

## 📂 Fichiers clés

### Frontend
- `src/App.tsx` : Router principal
- `src/hooks/useAuth.tsx` : Context d'authentification
- `src/services/api.ts` : Toutes les requêtes API
- `src/components/layout/` : Sidebar + Header
- `src/pages/` : Toutes les pages

### Backend
- `backend/config/database.php` : Config DB
- `backend/api/auth/` : Login, Register, Logout
- `backend/api/projects/` : CRUD projets
- `backend/api/libraries/` : CRUD bibliothèques
- `backend/api/articles/` : CRUD articles
- `backend/api/statistics/` : Stats user + admin
- `backend/api/admin/` : Routes admin

---

## 🎨 Design System

### Couleurs
```css
Primary: #1E3A8A (bleu foncé)
Accent: #F97316 (orange)
Background: #FFFFFF
Secondary: #F3F4F6 (gris clair)
```

### Composants UI disponibles
- `<Button />` avec variants (default, accent, outline, ghost)
- `<Card />` pour les conteneurs
- `<Input />` pour les formulaires
- `<Label />` pour les labels

---

## 🐛 Problèmes courants

**Erreur de connexion DB ?**
→ Vérifiez que WAMP tourne (icône verte)

**CORS error ?**

cd c:\wamp64\www\metr2\frontend
>> npm install
>> npm run dev

→ Le backend attend le frontend sur `http://localhost:5174`

**Page blanche ?**
→ `cd frontend && rm -rf node_modules && npm install`

---

**🎉 Bon codage !**
