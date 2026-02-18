# Déploiement E-School Management sur Railway

Ce guide décrit comment déployer l'application E-School Management (backend Django + frontend React) sur [Railway](https://railway.app).

## Architecture du déploiement

- **Service 1 – Backend** : API Django (dossier `backend/`)
- **Service 2 – Frontend** : Application React/Vite (dossier `frontend/`)
- **Base de données** : PostgreSQL (ajouté via Railway)
- **Optionnel** : Redis (pour Celery, si vous utilisez les tâches asynchrones)

---

## Étape 1 : Préparer le dépôt

1. Poussez votre code sur GitHub (si pas déjà fait).
2. Vérifiez que les fichiers suivants sont présents :
   - `backend/Procfile`
   - `backend/requirements.txt` (avec gunicorn, whitenoise, dj-database-url)
   - `backend/runtime.txt`
   - `frontend/package.json` (avec les scripts `build` et `start`)

---

## Étape 2 : Créer le projet Railway

1. Allez sur [railway.app](https://railway.app) et connectez-vous.
2. Cliquez sur **New Project**.
3. Choisissez **Deploy from GitHub repo** et sélectionnez votre dépôt.

---

## Étape 3 : Ajouter PostgreSQL

1. Dans le projet, cliquez sur **+ New**.
2. Choisissez **Database** → **Add PostgreSQL**.
3. Railway créera une base PostgreSQL et exposera `DATABASE_URL` automatiquement.

---

## Étape 4 : Configurer le service Backend

1. Cliquez sur **+ New** → **GitHub Repo** (ou **Empty Service** puis liez le repo).
2. Sélectionnez le même dépôt.
3. Dans **Settings** du service :
   - **Root Directory** : `backend`
   - **Watch Paths** : `backend/**` (optionnel, pour limiter les redéploiements)
4. Dans **Variables**, ajoutez :

   | Variable | Valeur |
   |----------|--------|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (référence au service Postgres) |
   | `SECRET_KEY` | Une clé secrète forte (ex: générée avec `python -c "import secrets; print(secrets.token_urlsafe(50))"`) |
   | `DEBUG` | `False` |
   | `ALLOWED_HOSTS` | `*` (ou votre domaine après configuration) |
   | `CORS_ALLOWED_ORIGINS` | URL du frontend, ex: `https://votre-frontend.up.railway.app` |
   | `CELERY_BROKER_URL` | Optionnel : `${{Redis.REDIS_URL}}` si vous ajoutez Redis |

5. **Generate Domain** : dans **Networking** → **Settings** → **Generate Domain** pour obtenir une URL publique (ex: `backend-xxx.up.railway.app`).

---

## Étape 5 : Configurer le service Frontend

1. Cliquez sur **+ New** → **GitHub Repo**.
2. Sélectionnez le même dépôt.
3. Dans **Settings** du service :
   - **Root Directory** : `frontend`
   - **Build Command** : `npm run build` (ou laisser par défaut)
   - **Start Command** : `npm run start` (ou laisser par défaut)
4. Dans **Variables**, ajoutez **avant le build** :

   | Variable | Valeur |
   |----------|--------|
   | `VITE_API_URL` | URL de votre backend (ex: `https://backend-xxx.up.railway.app/api`) |

   ⚠️ **Important** : `VITE_API_URL` est injectée au moment du build. Si vous changez l’URL du backend, il faut redéployer le frontend.

5. **Generate Domain** pour obtenir l’URL publique du frontend.

---

## Étape 6 : Mise à jour des CORS et URLs

Une fois les domaines générés :

1. Dans le service **Backend** → **Variables** :
   - Mettez à jour `CORS_ALLOWED_ORIGINS` avec l’URL exacte du frontend (ex: `https://frontend-xxx.up.railway.app`).
2. Redéployez le backend si nécessaire.

---

## Étape 7 : Créer le premier administrateur (base vide)

Après le premier déploiement, la base est vide. Il faut créer un admin et une école :

### Option A : Via les variables d'environnement (recommandé)

1. Dans le service **Backend** → **Variables**, ajoutez temporairement :
   - `ADMIN_USERNAME` : `admin` (ou autre)
   - `ADMIN_EMAIL` : `admin@eschool.rdc` (ou votre email)
   - `ADMIN_PASSWORD` : **votre mot de passe** (obligatoire)
   - `SCHOOL_NAME` : (optionnel) nom de l'école
   - `SCHOOL_CODE` : (optionnel) code, ex: `DEFAULT`

2. Installez le CLI Railway et lancez :
   ```bash
   railway link   # lier au projet
   railway run python manage.py seed_initial
   ```
   Ou depuis le dossier backend du projet :
   ```bash
   cd backend
   railway run python manage.py seed_initial
   ```

3. Une fois l'admin créé, vous pouvez supprimer `ADMIN_PASSWORD` des variables (recommandé pour la sécurité).

### Option B : Sans CLI, via le dashboard Railway

1. Allez dans le service **Backend**.
2. Onglet **Settings** → section **Deploy**.
3. Cherchez « Custom Start Command » ou « One-off command » (selon l’interface).
4. Ou utilisez l’onglet **Shell/Console** s’il existe, et exécutez :
   ```bash
   python manage.py seed_initial
   ```
   (après avoir défini `ADMIN_PASSWORD` dans les variables)

### Option C : En local avec DATABASE_URL Railway

1. Copiez la `DATABASE_URL` depuis les variables Railway.
2. En local : `cd backend`, puis `set DATABASE_URL=...` (Windows) ou `export DATABASE_URL=...` (Mac/Linux).
3. Définissez aussi `ADMIN_PASSWORD`.
4. Exécutez : `python manage.py seed_initial`

**Identifiants par défaut** (si vous gardez les valeurs par défaut) :
- Utilisateur : `admin`
- Mot de passe : celui défini dans `ADMIN_PASSWORD`

---

## Étape 8 : (Optionnel) Redis et Celery

Si vous utilisez Celery (tâches asynchrones, envoi de mails, etc.) :

1. **+ New** → **Database** → **Add Redis**.
2. Dans le service **Backend** → **Variables** :
   - `CELERY_BROKER_URL` = `${{Redis.REDIS_URL}}`
   - `CELERY_RESULT_BACKEND` = `${{Redis.REDIS_URL}}`
3. Créez un service **Worker** pour Celery :
   - **+ New** → **Empty Service**
   - **Root Directory** : `backend`
   - **Start Command** : `celery -A config worker -l info`
4. Pour Celery Beat (tâches planifiées), créez un autre service :
   - **Start Command** : `celery -A config beat -l info`

---

## Commandes utiles (CLI Railway)

```bash
# Installer le CLI
npm i -g @railway/cli

# Se connecter
railway login

# Lier le projet
railway link

# Déployer
railway up
```

---

## Variables d’environnement de référence

### Backend

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
SECRET_KEY=<clé-secrète-forte>
DEBUG=False
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=https://votre-frontend.up.railway.app
```

### Frontend

```
VITE_API_URL=https://votre-backend.up.railway.app/api
```

---

## Dépannage

- **Erreur 502** : Vérifier que Gunicorn écoute sur `0.0.0.0:$PORT` (déjà configuré dans le Procfile).
- **Erreurs CORS** : Vérifier que `CORS_ALLOWED_ORIGINS` contient l’URL exacte du frontend (protocole et domaine, sans slash final).
- **Migration échouée** : Les migrations sont exécutées automatiquement au démarrage via le Procfile.
- **Static files** : WhiteNoise sert les fichiers statiques Django. Vérifier que `collectstatic` s’exécute bien (intégré au Procfile).
- **Connexion impossible / base vide** : Créer un admin avec `python manage.py seed_initial` (voir Étape 7).
