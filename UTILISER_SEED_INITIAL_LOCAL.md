# Guide : Utiliser `seed_initial` en Local

Ce guide explique comment utiliser la commande `seed_initial` pour créer un superadmin en local.

## ⚠️ Problème Courant

Si vous obtenez l'erreur :
```
psycopg2.OperationalError: could not translate host name "postgres.railway.internal" to address
```

Cela signifie que Django essaie de se connecter à la base de données Railway depuis votre machine locale, ce qui n'est pas possible car `postgres.railway.internal` n'est accessible que depuis l'environnement Railway.

## 🔧 Solutions

### Solution 1 : Utiliser SQLite (Recommandé pour le développement local)

SQLite est plus simple pour le développement local car il ne nécessite pas de serveur de base de données.

1. **Créer ou modifier votre fichier `.env`** dans le dossier `backend/` :

```env
# Utiliser SQLite pour le développement local
USE_SQLITE=True
DEBUG=True

# Admin credentials
ADMIN_USERNAME=Alidorsabue
ADMIN_EMAIL=alidorsabue@africait.com
ADMIN_PASSWORD=VotreMotDePasseSecurise123!

# Optionnel : créer une école
CREATE_SCHOOL=true
SCHOOL_NAME=COLLEGE VITAL MAURICE
SCHOOL_CODE=CVMA
```

2. **Assurez-vous que `DATABASE_URL` n'est PAS défini** dans votre `.env` local (ou commentez-le)

3. **Exécutez la commande** :
```bash
cd backend
python manage.py seed_initial
```

### Solution 2 : Utiliser PostgreSQL Local

Si vous préférez utiliser PostgreSQL en local :

1. **Installez PostgreSQL** sur votre machine si ce n'est pas déjà fait

2. **Créez une base de données** :
```sql
CREATE DATABASE eschool_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE eschool_db TO postgres;
```

3. **Créez ou modifiez votre fichier `.env`** dans le dossier `backend/` :

```env
# NE PAS définir DATABASE_URL (ou le commenter)
# DATABASE_URL=...

# Utiliser PostgreSQL local
DB_NAME=eschool_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DEBUG=True

# Admin credentials
ADMIN_USERNAME=Alidorsabue
ADMIN_EMAIL=alidorsabue@africait.com
ADMIN_PASSWORD=VotreMotDePasseSecurise123!

# Optionnel : créer une école
CREATE_SCHOOL=true
SCHOOL_NAME=COLLEGE VITAL MAURICE
SCHOOL_CODE=CVMA
```

4. **Exécutez les migrations** :
```bash
cd backend
python manage.py migrate
```

5. **Exécutez la commande** :
```bash
python manage.py seed_initial
```

### Solution 3 : Utiliser Railway CLI (Pour tester avec la base Railway)

Si vous voulez vraiment utiliser la base de données Railway depuis votre machine locale :

1. **Installez Railway CLI** :
```bash
npm i -g @railway/cli
```

2. **Connectez-vous** :
```bash
railway login
```

3. **Lie votre projet** :
```bash
cd backend
railway link
```

4. **Exécutez la commande via Railway** :
```bash
railway run python manage.py seed_initial
```

Cette méthode utilise le tunnel Railway pour se connecter à la base de données.

## 📝 Variables d'Environnement

### Variables Requises

- `ADMIN_PASSWORD` : **Obligatoire** - Mot de passe pour le superadmin

### Variables Optionnelles

- `ADMIN_USERNAME` : Nom d'utilisateur (défaut: `Alidorsabue`)
- `ADMIN_EMAIL` : Email (défaut: `alidorsabue@africait.com`)
- `CREATE_SCHOOL` : Créer une école ? (défaut: `true`)
- `SCHOOL_NAME` : Nom de l'école (défaut: `COLLEGE VITAL MAURICE`)
- `SCHOOL_CODE` : Code de l'école (défaut: `CVMA`)

### Exemple de `.env` Complet pour le Développement Local

```env
# Base de données - SQLite (simple pour le dev)
USE_SQLITE=True
DEBUG=True

# Django
SECRET_KEY=django-insecure-dev-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# Admin
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@localhost
ADMIN_PASSWORD=admin123!

# Optionnel : créer une école
CREATE_SCHOOL=true
SCHOOL_NAME=École de Développement
SCHOOL_CODE=DEV

# CORS pour le frontend local
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

## 🚀 Utilisation

### En Local (Développement)

```bash
cd backend

# 1. Créer le fichier .env avec les variables ci-dessus
# 2. Exécuter les migrations (si première fois)
python manage.py migrate

# 3. Créer le superadmin
python manage.py seed_initial
```

### En Production (Railway)

```bash
# Via Railway CLI
railway run python manage.py seed_initial

# Ou via le shell Railway dans le dashboard
```

## ✅ Vérification

Après avoir exécuté la commande, vous devriez voir :

```
✓ SUPERADMIN 'Alidorsabue' créé avec succès !
  Ce superadmin peut :
    - Créer et gérer toutes les écoles
    - Créer et gérer les admins d'école
    - Voir toutes les données de toutes les écoles
  Connexion: Alidorsabue / (mot de passe défini dans ADMIN_PASSWORD)
```

Vous pouvez maintenant vous connecter à l'admin Django :
- **Local** : http://127.0.0.1:8000/admin/
- **Production** : https://votre-backend.up.railway.app/admin/

## 🐛 Dépannage

### Erreur : "could not translate host name"

**Cause** : `DATABASE_URL` pointe vers Railway mais vous êtes en local.

**Solution** :
1. Supprimez ou commentez `DATABASE_URL` dans votre `.env` local
2. Utilisez `USE_SQLITE=True` ou configurez PostgreSQL local
3. Relancez la commande

### Erreur : "No such table: schools_school"

**Cause** : Les migrations n'ont pas été exécutées.

**Solution** :
```bash
python manage.py migrate
```

### Erreur : "ADMIN_PASSWORD non défini"

**Cause** : La variable `ADMIN_PASSWORD` n'est pas définie.

**Solution** :
1. Ajoutez `ADMIN_PASSWORD=votre_mot_de_passe` dans votre `.env`
2. Relancez la commande

### La commande fonctionne mais l'école n'est pas créée

**Cause** : `CREATE_SCHOOL=false` ou erreur lors de la création.

**Solution** :
- C'est normal si `CREATE_SCHOOL=false`
- Le superadmin est créé même si l'école n'est pas créée
- Vous pouvez créer l'école manuellement via Django Admin après connexion

## 📚 Voir Aussi

- `GUIDE_SUPERADMIN_VS_ADMIN_ECOLE.md` : Distinction entre superadmin et admin d'école
- `ACCES_ADMIN_DJANGO_PRODUCTION.md` : Accéder à l'admin Django en production
- `RAILWAY_DEPLOYMENT.md` : Guide de déploiement sur Railway
