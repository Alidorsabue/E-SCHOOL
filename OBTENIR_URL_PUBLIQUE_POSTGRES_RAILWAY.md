# Guide : Obtenir l'URL Publique PostgreSQL sur Railway

Ce guide explique comment obtenir l'URL publique de PostgreSQL sur Railway pour se connecter depuis votre machine locale.

## 🔍 Pourquoi utiliser l'URL publique ?

Railway fournit deux types d'URLs pour PostgreSQL :
- **URL Interne** (`postgres.railway.internal`) : Accessible uniquement depuis les services Railway
- **URL Publique** : Accessible depuis Internet (votre machine locale)

Pour se connecter depuis votre machine locale, vous devez utiliser l'URL publique.

## 📋 Méthode 1 : Via le Dashboard Railway (Recommandé)

1. **Allez sur [railway.app](https://railway.app)** et connectez-vous

2. **Sélectionnez votre projet**

3. **Cliquez sur le service PostgreSQL** (dans la liste des services)

4. **Allez dans l'onglet "Variables"** ou **"Connect"**

5. **Cherchez `DATABASE_URL`** ou **`POSTGRES_URL`**

6. **Cliquez sur "Public Network"** ou **"Public URL"** pour obtenir l'URL publique

   L'URL publique ressemble à :
   ```
   postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
   ```

7. **Copiez cette URL** et utilisez-la dans votre `.env` local

## 📋 Méthode 2 : Via Railway CLI

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

4. **Affichez les variables** :
   ```bash
   railway variables
   ```

5. **Cherchez `DATABASE_URL`** et notez l'URL publique

## 📋 Méthode 3 : Transformer l'URL Interne en URL Publique

Si vous avez l'URL interne, vous pouvez la transformer manuellement :

**URL Interne** :
```
postgresql://postgres:password@postgres.railway.internal:5432/railway
```

**URL Publique** (à obtenir depuis Railway) :
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

La différence est le hostname :
- Interne : `postgres.railway.internal`
- Publique : `containers-us-west-xxx.railway.app` (ou similaire)

## 🔧 Configuration dans votre `.env` Local

Une fois que vous avez l'URL publique, ajoutez-la dans votre fichier `backend/.env` :

```env
# URL publique PostgreSQL Railway (pour connexion depuis local)
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway

# IMPORTANT : Ne pas utiliser USE_SQLITE=True si vous utilisez DATABASE_URL
# USE_SQLITE=True
DEBUG=True
```

## ⚠️ Sécurité

**Important** : L'URL publique expose votre base de données sur Internet. Assurez-vous de :

1. **Utiliser un mot de passe fort** pour PostgreSQL
2. **Ne pas commiter** votre fichier `.env` (déjà dans `.gitignore`)
3. **Limiter l'accès** si possible via les paramètres Railway
4. **Utiliser l'URL interne** en production (automatique sur Railway)

## 🚀 Utilisation

Après avoir configuré `DATABASE_URL` avec l'URL publique :

```bash
cd backend
python manage.py migrate
python manage.py seed_initial
```

## 🔄 Conversion Automatique

Le code Django peut automatiquement convertir l'URL interne en URL publique si nécessaire. Voir `config/settings.py` pour la fonction de conversion automatique.
