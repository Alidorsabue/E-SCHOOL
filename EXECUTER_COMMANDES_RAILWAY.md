# Guide : Exécuter des Commandes Django sur Railway

## ⚠️ Problème : ModuleNotFoundError avec `railway run`

Si vous obtenez `ModuleNotFoundError: No module named 'dj_database_url'` avec `railway run`, cela signifie que Railway CLI essaie d'utiliser votre environnement Python local au lieu de l'environnement Railway.

## ✅ Solutions

### Solution 1 : Via le Dashboard Railway (Recommandé - Plus Simple)

1. **Allez sur [railway.app](https://railway.app)**
2. **Sélectionnez votre projet**
3. **Cliquez sur le service "Backend"**
4. **Allez dans l'onglet "Deployments"** ou **"Settings"**
5. **Cherchez "Shell" ou "Console"** ou **"One-off Commands"**
6. **Ouvrez le shell Railway**
7. **Exécutez directement** :
   ```bash
   python manage.py seed_initial
   ```

### Solution 2 : Vérifier Railway CLI

Assurez-vous que Railway CLI est correctement configuré :

```bash
# Vérifier que vous êtes connecté
railway whoami

# Vérifier que le projet est lié
railway status

# Si pas lié, lier le projet
railway link
```

### Solution 3 : Utiliser Railway CLI avec le Bon Contexte

Essayez depuis la racine du projet (pas depuis `backend/`) :

```bash
# Depuis la racine du projet
cd "c:\Users\Helpdesk\OneDrive - AITS\Bureau\MASTER IA DATA SCIENCE DIT\RECHERCHES\E-SCHOOL MANAGEMENT"

# Lier le projet si nécessaire
railway link

# Exécuter la commande en spécifiant le service
railway run --service backend python manage.py seed_initial
```

### Solution 4 : Créer le Superadmin via le Shell Django (Dashboard Railway)

1. **Ouvrez le shell Railway** depuis le Dashboard
2. **Exécutez** :
   ```bash
   python manage.py shell
   ```
3. **Dans le shell Python, exécutez** :
   ```python
   from apps.accounts.models import User
   from django.contrib.auth.hashers import make_password
   
   # Vérifier si l'utilisateur existe
   if User.objects.filter(username='Alidorsabue').exists():
       user = User.objects.get(username='Alidorsabue')
       # Hasher le mot de passe
       user.password = make_password('Virgi@1996Ali@')
       user.is_superuser = True
       user.is_staff = True
       user.save()
       print("✓ Mot de passe hashé et superuser activé !")
   else:
       # Créer le superadmin
       User.objects.create_superuser(
           username='Alidorsabue',
           email='alidorsabue@africait.com',
           password='Virgi@1996Ali@',
           role='ADMIN'
       )
       print("✓ Superadmin créé avec succès !")
   ```

### Solution 5 : Utiliser `createsuperuser` (Plus Simple)

1. **Ouvrez le shell Railway** depuis le Dashboard
2. **Exécutez** :
   ```bash
   python manage.py createsuperuser
   ```
3. **Répondez aux questions** :
   - Username: `Alidorsabue`
   - Email: `alidorsabue@africait.com`
   - Password: `VotreMotDePasseSecurise123!`
   - Role: `ADMIN` (si demandé)

## 🔧 Configuration Railway CLI

Si Railway CLI ne fonctionne pas correctement :

### Réinstaller Railway CLI

```bash
# Désinstaller
npm uninstall -g @railway/cli

# Réinstaller
npm install -g @railway/cli

# Se reconnecter
railway login
```

### Vérifier la Configuration

```bash
# Voir la configuration actuelle
railway status

# Voir les services disponibles
railway service

# Lier manuellement au service backend
railway service backend
```

## 📋 Méthode Alternative : Via les Variables d'Environnement

Si vous ne pouvez pas exécuter de commandes, vous pouvez créer le superadmin en modifiant directement la base de données via le shell Python :

1. **Ouvrez le shell Railway** depuis le Dashboard
2. **Exécutez le code Python** (Solution 4 ci-dessus)

## ✅ Vérification

Après avoir créé le superadmin, vérifiez qu'il est correctement configuré :

```python
from apps.accounts.models import User

user = User.objects.get(username='Alidorsabue')
print(f"Username: {user.username}")
print(f"Superuser: {user.is_superuser}")
print(f"Staff: {user.is_staff}")
print(f"Password hashé: {user.password[:50]}...")  # Devrait commencer par pbkdf2_sha256$
```

Le mot de passe devrait commencer par `pbkdf2_sha256$` (hash Django), pas être en texte brut.

## 🚀 Recommandation

**Utilisez la Solution 1 (Dashboard Railway)** - C'est la plus simple et la plus fiable :

1. Dashboard Railway → Backend → Shell/Console
2. Exécutez : `python manage.py createsuperuser`
3. Répondez aux questions

Cela créera le superadmin directement dans l'environnement Railway avec toutes les dépendances correctement installées.
