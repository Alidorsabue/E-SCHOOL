# Guide : Superadmin vs Admin d'École

Ce document explique la distinction entre le **Superadmin** et l'**Admin d'École** dans le système E-School Management.

## 🔑 Deux Types d'Administrateurs

### 1. Superadmin (Superutilisateur)

**Caractéristiques** :
- `is_superuser = True`
- `is_staff = True`
- `role = 'ADMIN'`
- **Pas d'école assignée** (ou peut avoir une école mais gère toutes les écoles)

**Permissions** :
- ✅ **Créer et gérer toutes les écoles**
- ✅ **Créer et gérer les admins d'école**
- ✅ **Voir toutes les données de toutes les écoles**
- ✅ **Modifier et supprimer n'importe quelle école**
- ✅ **Créer des utilisateurs pour n'importe quelle école**

**Utilisation** :
- Gestion globale de la plateforme
- Création de nouvelles écoles
- Attribution d'admins d'école aux écoles
- Supervision de toutes les écoles

### 2. Admin d'École

**Caractéristiques** :
- `is_superuser = False`
- `is_staff = True`
- `role = 'ADMIN'`
- **École assignée** (`school` défini)

**Permissions** :
- ✅ **Gérer uniquement son école**
- ✅ **Créer des enseignants, parents, élèves pour son école**
- ✅ **Gérer les classes, matières, notes de son école**
- ❌ **Ne peut PAS créer d'autres écoles**
- ❌ **Ne peut PAS créer d'autres admins d'école**
- ❌ **Ne peut PAS modifier/supprimer d'autres écoles**
- ❌ **Ne peut PAS voir les données d'autres écoles**

**Utilisation** :
- Gestion quotidienne d'une école spécifique
- Création et gestion des utilisateurs de son école
- Gestion scolaire (classes, matières, notes)
- Gestion des inscriptions

## 📋 Tableau Comparatif

| Fonctionnalité | Superadmin | Admin d'École |
|----------------|------------|---------------|
| Créer des écoles | ✅ Oui | ❌ Non |
| Modifier toutes les écoles | ✅ Oui | ❌ Non |
| Créer des admins d'école | ✅ Oui | ❌ Non |
| Voir toutes les écoles | ✅ Oui | ❌ Non |
| Gérer son école | ✅ Oui | ✅ Oui |
| Créer des enseignants | ✅ Oui (toutes écoles) | ✅ Oui (son école) |
| Créer des élèves | ✅ Oui (toutes écoles) | ✅ Oui (son école) |
| Modifier d'autres admins | ✅ Oui | ❌ Non |

## 🚀 Créer un Superadmin

### Via la commande `seed_initial`

```bash
# Définir les variables d'environnement
export ADMIN_USERNAME="superadmin"
export ADMIN_EMAIL="superadmin@eschool.rdc"
export ADMIN_PASSWORD="MotDePasseSecurise123!"

# Exécuter la commande
python manage.py seed_initial
```

Cette commande crée un **superadmin** (`is_superuser=True`) qui peut gérer toutes les écoles.

### Via Django Admin (si vous avez déjà un superadmin)

1. Connectez-vous à l'admin Django avec un superadmin existant
2. Allez dans **ACCOUNTS** → **Users**
3. Cliquez sur **Add User**
4. Remplissez les informations :
   - **Username** : nom d'utilisateur
   - **Email** : email
   - **Password** : mot de passe
   - **Role** : ADMIN
   - **École** : Laisser vide (ou choisir une école, mais le superadmin gère toutes les écoles)
5. Dans la section **Permissions** :
   - ✅ Cocher **Staff status** (`is_staff`)
   - ✅ Cocher **Superuser status** (`is_superuser`)
6. Cliquez sur **Save**

## 🏫 Créer un Admin d'École

### Via Django Admin (par un superadmin)

1. Connectez-vous à l'admin Django avec un **superadmin**
2. Allez dans **ACCOUNTS** → **Users**
3. Cliquez sur **Add User**
4. Remplissez les informations :
   - **Username** : nom d'utilisateur
   - **Email** : email
   - **Password** : mot de passe
   - **Role** : ADMIN
   - **École** : **Sélectionner l'école** pour laquelle cet admin sera responsable
5. Dans la section **Permissions** :
   - ✅ Cocher **Staff status** (`is_staff`)
   - ❌ **NE PAS** cocher **Superuser status** (`is_superuser`)
6. Cliquez sur **Save**

### Important

- Seuls les **superadmins** peuvent créer des admins d'école
- Un admin d'école **doit** avoir une école assignée
- Un admin d'école **ne peut pas** créer d'autres admins d'école

## 🔍 Vérifier le Type d'Admin

### Via Django Admin

1. Allez dans **ACCOUNTS** → **Users**
2. Cliquez sur un utilisateur
3. Regardez la section **Permissions** :
   - Si **Superuser status** est coché → C'est un superadmin
   - Si **Superuser status** n'est pas coché mais **Staff status** est coché et **Role** = ADMIN → C'est un admin d'école

### Via le Shell Django

```python
from apps.accounts.models import User

# Trouver un utilisateur
user = User.objects.get(username='nom_utilisateur')

# Vérifier le type
if user.is_superuser:
    print("C'est un SUPERADMIN")
elif user.is_admin and user.school:
    print(f"C'est un ADMIN D'ÉCOLE pour {user.school.name}")
else:
    print("Ce n'est pas un admin")
```

## 🛡️ Sécurité

### Bonnes Pratiques

1. **Limiter le nombre de superadmins** : Seulement quelques personnes devraient avoir ce rôle
2. **Utiliser des mots de passe forts** : Pour les superadmins et les admins d'école
3. **Auditer régulièrement** : Vérifier qui a accès à quoi
4. **Désactiver les comptes inactifs** : Mettre `is_active=False` pour les comptes non utilisés

### Permissions Automatiques

- Les admins d'école voient **automatiquement** uniquement les données de leur école dans Django Admin
- Les superadmins voient **automatiquement** toutes les données de toutes les écoles
- Les admins d'école **ne peuvent pas** créer d'autres admins (bloqué au niveau du code)

## 📝 Exemples d'Utilisation

### Scénario 1 : Créer une nouvelle école

1. **Superadmin** se connecte à Django Admin
2. Va dans **SCHOOLS** → **Schools**
3. Clique sur **Add School**
4. Remplit les informations de l'école
5. Crée un **admin d'école** pour cette nouvelle école (voir section "Créer un Admin d'École")

### Scénario 2 : Admin d'école gère son école

1. **Admin d'école** se connecte à Django Admin
2. Voit uniquement les données de son école
3. Peut créer des enseignants, parents, élèves pour son école
4. Peut gérer les classes, matières, notes de son école
5. **Ne peut pas** créer d'autres écoles ou admins

## 🔧 Dépannage

### Un admin d'école ne voit rien dans l'admin

Vérifiez que :
- `is_staff = True`
- `is_superuser = False`
- `role = 'ADMIN'`
- `school` est défini et non vide

### Un superadmin voit les données de toutes les écoles

C'est normal ! Les superadmins sont conçus pour voir toutes les données.

### Un admin d'école peut créer d'autres admins

C'est un bug ! Vérifiez que :
- `is_superuser = False` pour cet admin
- Les permissions dans `UserAdmin.has_add_permission()` sont correctes

## 📚 Fichiers Concernés

- `backend/apps/accounts/models.py` : Modèle User
- `backend/apps/accounts/admin.py` : Permissions dans Django Admin
- `backend/apps/schools/admin.py` : Permissions pour les écoles
- `backend/apps/schools/admin_base.py` : Mixin pour le filtrage par école
- `backend/apps/accounts/management/commands/seed_initial.py` : Commande pour créer un superadmin
