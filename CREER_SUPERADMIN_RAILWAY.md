# Guide : Créer un Superadmin sur Railway

## ⚠️ Problème : Mot de Passe Non Hashé

Si vous avez créé un utilisateur directement dans PostgreSQL avec un mot de passe en texte brut, **cela ne fonctionnera pas**. Django stocke les mots de passe sous forme de hash cryptographique, pas en texte brut.

## ✅ Solution : Créer le Superadmin via Django

### Méthode 1 : Via la Commande `seed_initial` (Recommandé)

1. **Allez dans Railway Dashboard** → **Backend** → **Variables**

2. **Ajoutez les variables suivantes** :
   - `ADMIN_USERNAME` = `Alidorsabue` (ou votre choix)
   - `ADMIN_EMAIL` = `alidorsabue@africait.com` (ou votre email)
   - `ADMIN_PASSWORD` = `VotreMotDePasseSecurise123!` (obligatoire)

3. **Installez Railway CLI** (si pas déjà fait) :
   ```bash
   npm i -g @railway/cli
   ```

4. **Connectez-vous** :
   ```bash
   railway login
   ```

5. **Lie votre projet** :
   ```bash
   cd backend
   railway link
   ```

6. **Exécutez la commande** :
   ```bash
   railway run python manage.py seed_initial
   ```

7. **Vérifiez le résultat** - vous devriez voir :
   ```
   ✓ SUPERADMIN 'Alidorsabue' créé avec succès !
   ```

8. **Supprimez `ADMIN_PASSWORD`** des variables Railway (pour la sécurité)

### Méthode 2 : Via `createsuperuser` (Alternative)

1. **Ajoutez les variables** dans Railway (comme ci-dessus)

2. **Exécutez** :
   ```bash
   railway run python manage.py createsuperuser
   ```

3. **Répondez aux questions** :
   - Username: `Alidorsabue`
   - Email: `alidorsabue@africait.com`
   - Password: (entrez votre mot de passe)
   - Role: `ADMIN`

### Méthode 3 : Via le Shell Django

1. **Ouvrez le shell Django** :
   ```bash
   railway run python manage.py shell
   ```

2. **Exécutez ce code** :
   ```python
   from apps.accounts.models import User
   
   # Créer le superadmin
   User.objects.create_superuser(
       username='Alidorsabue',
       email='alidorsabue@africait.com',
       password='VotreMotDePasseSecurise123!',
       role='ADMIN'
   )
   
   print("Superadmin créé avec succès !")
   ```

## 🔧 Si vous avez Déjà Créé l'Utilisateur dans PostgreSQL

### Option A : Supprimer et Recréer (Recommandé)

1. **Supprimez l'utilisateur** directement dans PostgreSQL :
   ```sql
   DELETE FROM accounts_user WHERE username = 'Alidorsabue';
   ```

2. **Créez-le correctement** via Django (Méthode 1 ci-dessus)

### Option B : Hasher le Mot de Passe Manuellement

Si vous voulez garder l'utilisateur existant, vous devez hasher le mot de passe :

1. **Ouvrez le shell Django** :
   ```bash
   railway run python manage.py shell
   ```

2. **Exécutez ce code** :
   ```python
   from apps.accounts.models import User
   from django.contrib.auth.hashers import make_password
   
   # Récupérer l'utilisateur
   user = User.objects.get(username='Alidorsabue')
   
   # Hasher le mot de passe
   user.password = make_password('Virgi@1996Ali@')  # Votre mot de passe
   
   # S'assurer qu'il est superuser
   user.is_superuser = True
   user.is_staff = True
   
   # Sauvegarder
   user.save()
   
   print("Mot de passe hashé et superuser activé !")
   ```

## 🔐 Connexion à l'Admin Django

Après avoir créé le superadmin correctement :

1. **Allez sur** : `https://backend-production-195ed.up.railway.app/admin/`

2. **Connectez-vous avec** :
   - **Username** : `Alidorsabue`
   - **Password** : Le mot de passe que vous avez défini dans `ADMIN_PASSWORD` ou lors de la création

3. **Si vous obtenez une erreur CSRF** :
   - Vérifiez que `DEBUG=False` en production (déjà configuré)
   - Assurez-vous d'utiliser HTTPS (Railway le fait automatiquement)
   - Videz le cache de votre navigateur
   - Essayez en navigation privée

## ⚠️ Erreur CSRF 403

L'erreur CSRF peut apparaître si :
- Les cookies ne sont pas correctement configurés
- Vous utilisez HTTP au lieu de HTTPS
- Le domaine n'est pas dans `ALLOWED_HOSTS`

**Solution** :
1. Vérifiez que `ALLOWED_HOSTS=*` ou contient votre domaine dans Railway Variables
2. Utilisez HTTPS (Railway le fait automatiquement)
3. Videz le cache du navigateur
4. Essayez en navigation privée

## 📋 Checklist

- [ ] Le superadmin est créé via Django (pas directement dans PostgreSQL)
- [ ] Le mot de passe est hashé (automatique avec Django)
- [ ] `is_superuser=True` et `is_staff=True`
- [ ] `ALLOWED_HOSTS` contient `*` ou votre domaine
- [ ] Vous utilisez HTTPS pour accéder à l'admin
- [ ] Vous avez vidé le cache du navigateur

## 🚀 Commandes Rapides

```bash
# Créer le superadmin
railway run python manage.py seed_initial

# Ou créer manuellement
railway run python manage.py createsuperuser

# Vérifier que l'utilisateur existe et est superuser
railway run python manage.py shell
# Puis dans le shell :
# from apps.accounts.models import User
# user = User.objects.get(username='Alidorsabue')
# print(f"Superuser: {user.is_superuser}, Staff: {user.is_staff}")
```

## ✅ Vérification

Pour vérifier que le superadmin est correctement configuré :

```bash
railway run python manage.py shell
```

Puis :
```python
from apps.accounts.models import User

user = User.objects.get(username='Alidorsabue')
print(f"Username: {user.username}")
print(f"Email: {user.email}")
print(f"Superuser: {user.is_superuser}")
print(f"Staff: {user.is_staff}")
print(f"Password hashé: {user.password[:50]}...")  # Devrait commencer par pbkdf2_sha256$
```

Le mot de passe devrait commencer par `pbkdf2_sha256$` (hash Django), pas être en texte brut.
