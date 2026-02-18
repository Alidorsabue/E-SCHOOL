# Guide : Accéder à l'Admin Django en Production (Railway)

## 📍 URL de l'Admin Django

Une fois votre backend déployé sur Railway, l'URL de l'admin Django est :

```
https://[VOTRE-DOMAINE-BACKEND-RAILWAY]/admin/
```

**Exemple** : Si votre backend Railway est accessible à `https://backend-abc123.up.railway.app`, alors l'admin sera à :
```
https://backend-abc123.up.railway.app/admin/
```

## 🔑 Identifiants de connexion

### Si vous avez utilisé `seed_initial`

D'après votre fichier `seed_initial.py`, les identifiants par défaut sont :

- **Nom d'utilisateur** : `Alidorsabue` (ou celui défini dans `ADMIN_USERNAME`)
- **Email** : `alidorsabue@africait.com` (ou celui défini dans `ADMIN_EMAIL`)
- **Mot de passe** : Celui défini dans la variable d'environnement `ADMIN_PASSWORD` sur Railway

**⚠️ Important** : La commande `seed_initial` crée un **SUPERADMIN** (`is_superuser=True`) qui peut :
- Créer et gérer toutes les écoles
- Créer et gérer les admins d'école
- Voir toutes les données de toutes les écoles

Pour plus d'informations sur la distinction entre Superadmin et Admin d'École, consultez `GUIDE_SUPERADMIN_VS_ADMIN_ECOLE.md`.

### Vérifier vos identifiants sur Railway

1. Allez sur [railway.app](https://railway.app) et connectez-vous
2. Sélectionnez votre projet
3. Cliquez sur le service **Backend**
4. Allez dans l'onglet **Variables**
5. Vérifiez les valeurs de :
   - `ADMIN_USERNAME` (par défaut : `Alidorsabue`)
   - `ADMIN_EMAIL` (par défaut : `alidorsabue@africait.com`)
   - `ADMIN_PASSWORD` (celui que vous avez défini)

## 🚀 Étapes pour accéder à l'Admin

### 1. Trouver l'URL de votre backend Railway

1. Allez sur [railway.app](https://railway.app)
2. Sélectionnez votre projet
3. Cliquez sur le service **Backend**
4. Allez dans l'onglet **Networking** ou **Settings**
5. Vous verrez votre domaine Railway (ex: `backend-abc123.up.railway.app`)

### 2. Accéder à l'interface Admin

1. Ouvrez votre navigateur
2. Allez à l'adresse : `https://[VOTRE-DOMAINE]/admin/`
3. Vous verrez la page de connexion Django Admin

### 3. Se connecter

1. Entrez votre **nom d'utilisateur** (ex: `Alidorsabue`)
2. Entrez votre **mot de passe** (celui défini dans `ADMIN_PASSWORD`)
3. Cliquez sur **"Se connecter"** ou **"Log in"**

## ⚠️ Si vous n'avez pas encore créé d'admin

Si vous n'avez pas encore exécuté la commande `seed_initial`, suivez ces étapes :

### Option A : Via Railway CLI (recommandé)

1. Installez le CLI Railway :
   ```bash
   npm i -g @railway/cli
   ```

2. Connectez-vous :
   ```bash
   railway login
   ```

3. Liez votre projet :
   ```bash
   railway link
   ```

4. Ajoutez les variables d'environnement dans Railway (via le dashboard) :
   - `ADMIN_USERNAME` : `Alidorsabue` (ou votre choix)
   - `ADMIN_EMAIL` : `alidorsabue@africait.com` (ou votre email)
   - `ADMIN_PASSWORD` : **Votre mot de passe sécurisé**

5. Exécutez la commande de création :
   ```bash
   cd backend
   railway run python manage.py seed_initial
   ```

### Option B : Via le shell Railway

1. Dans le dashboard Railway, allez dans votre service **Backend**
2. Cliquez sur l'onglet **Shell** ou **Console**
3. Ajoutez d'abord les variables d'environnement dans **Variables** :
   - `ADMIN_USERNAME` : `Alidorsabue`
   - `ADMIN_EMAIL` : `alidorsabue@africait.com`
   - `ADMIN_PASSWORD` : **Votre mot de passe**
4. Dans le shell, exécutez :
   ```bash
   python manage.py seed_initial
   ```

## 🔒 Sécurité après création de l'admin

**Important** : Une fois l'admin créé, il est recommandé de supprimer la variable `ADMIN_PASSWORD` des variables d'environnement Railway pour des raisons de sécurité.

## 🎯 Fonctionnalités disponibles dans l'Admin

Une fois connecté, vous pouvez :

- ✅ Gérer les **utilisateurs** (enseignants, parents, élèves, admins)
- ✅ Gérer les **écoles** (si vous êtes superutilisateur)
- ✅ Gérer les **classes** et **sections**
- ✅ Gérer les **matières**
- ✅ Gérer les **inscriptions**
- ✅ Gérer les **notes** et **bulletins**
- ✅ Gérer les **cours en ligne** (e-learning)
- ✅ Gérer les **paiements**
- ✅ Gérer les **communications**
- ✅ Et bien plus...

## 🐛 Dépannage

### Erreur "Page non trouvée" (404)

- Vérifiez que l'URL se termine bien par `/admin/`
- Vérifiez que votre backend est bien déployé et accessible

### Erreur "Identifiants incorrects"

- Vérifiez que vous avez bien créé l'admin avec `seed_initial`
- Vérifiez les variables d'environnement `ADMIN_USERNAME` et `ADMIN_PASSWORD` sur Railway
- Essayez de réinitialiser le mot de passe (voir ci-dessous)

### Réinitialiser le mot de passe d'un admin

Si vous avez besoin de réinitialiser le mot de passe :

1. Via Railway CLI :
   ```bash
   railway run python manage.py changepassword Alidorsabue
   ```

2. Ou via le shell Railway dans le dashboard

### Vérifier qu'un admin existe

1. Via Railway CLI :
   ```bash
   railway run python manage.py shell
   ```
   
2. Dans le shell Python :
   ```python
   from apps.accounts.models import User
   admin = User.objects.filter(username='Alidorsabue').first()
   if admin:
       print(f"Admin trouvé : {admin.username}, Email : {admin.email}, École : {admin.school}")
   else:
       print("Aucun admin trouvé avec ce nom d'utilisateur")
   ```

## 📝 Notes importantes

- L'URL de l'admin Django est toujours `/admin/` après l'URL de base de votre backend
- Seuls les utilisateurs avec `is_staff=True` peuvent accéder à l'admin Django
- Les administrateurs d'école (`role='ADMIN'`) voient uniquement les données de leur école
- Les superutilisateurs voient toutes les données de toutes les écoles
