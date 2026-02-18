# Guide d'utilisation de Django Admin pour les Administrateurs d'École

Ce guide explique comment les administrateurs d'école (comme Vitalmaurice) peuvent se connecter à Django Admin pour configurer les paramètres de leur école.

## Prérequis

1. **L'utilisateur doit avoir le rôle `ADMIN`** dans le système
2. **L'utilisateur doit être associé à une école** (champ `school` non vide)
3. **L'utilisateur doit avoir `is_staff=True`** pour accéder à Django Admin
4. **L'utilisateur doit avoir les permissions nécessaires** assignées

## ⚠️ IMPORTANT : Si vous voyez "Vous n'avez pas la permission de voir ou de modifier quoi que ce soit"

Si vous voyez ce message, cela signifie que l'utilisateur n'a pas les permissions nécessaires. Suivez ces étapes :

1. **Vérifiez et activez l'accès** :
   ```bash
   python check_user_permissions.py BLAISE
   ```
   (Remplacez BLAISE par votre nom d'utilisateur)

2. **Ou utilisez le script d'activation** :
   ```bash
   python activate_admin_access.py BLAISE
   ```

3. **Déconnectez-vous et reconnectez-vous** à Django Admin pour que les changements prennent effet.

Voir aussi le fichier `CREER_ADMIN_ECOLE.md` pour créer un nouvel administrateur d'école.

## Activation de l'accès Django Admin pour un administrateur d'école

### Méthode 1 : Via Django Shell

```python
python manage.py shell
```

```python
from apps.accounts.models import User

# Trouver l'administrateur d'école
admin_user = User.objects.get(username='vitalmaurice')  # Remplacez par le nom d'utilisateur

# Vérifier qu'il est bien un admin d'école
if admin_user.is_admin and admin_user.school:
    # Activer l'accès Django Admin
    admin_user.is_staff = True
    admin_user.save()
    print(f"Accès Django Admin activé pour {admin_user.username}")
else:
    print("L'utilisateur n'est pas un administrateur d'école ou n'a pas d'école associée")
```

### Méthode 2 : Via le script Python

Créez un fichier `activate_admin_access.py` dans le dossier `backend/` :

```python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User

def activate_admin_access(username):
    """Active l'accès Django Admin pour un administrateur d'école"""
    try:
        user = User.objects.get(username=username)
        
        if not user.is_admin:
            print(f"ERREUR: {username} n'est pas un administrateur d'école")
            return False
        
        if not user.school:
            print(f"ERREUR: {username} n'est pas associé à une école")
            return False
        
        user.is_staff = True
        user.save()
        print(f"SUCCÈS: Accès Django Admin activé pour {username}")
        print(f"École: {user.school.name}")
        return True
        
    except User.DoesNotExist:
        print(f"ERREUR: L'utilisateur '{username}' n'existe pas")
        return False

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        activate_admin_access(sys.argv[1])
    else:
        username = input("Nom d'utilisateur de l'administrateur d'école: ")
        activate_admin_access(username)
```

Exécutez le script :

```bash
python activate_admin_access.py vitalmaurice
```

## Accès à Django Admin

1. **URL d'accès** : `http://localhost:8000/admin/` (ou votre URL de production)

2. **Connexion** :
   - Nom d'utilisateur : Le nom d'utilisateur de l'administrateur d'école
   - Mot de passe : Le mot de passe de l'administrateur

## Fonctionnalités disponibles

Une fois connecté, l'administrateur d'école peut :

### ✅ Voir et modifier uniquement les données de son école

- **École** : Voir uniquement les informations de son école (pas de modification)
- **Sections** : Gérer les sections de son école
- **Classes** : Gérer les classes de son école
- **Matières** : Gérer les matières de son école
- **Utilisateurs** : Gérer les utilisateurs de son école (enseignants, parents, élèves)
- **Enseignants** : Gérer les profils enseignants de son école
- **Parents** : Voir les profils parents de son école
- **Élèves** : Gérer les profils élèves de son école
- **Inscriptions** : Gérer les demandes d'inscription et réinscriptions
- **Notes** : Voir et gérer les notes des élèves de son école
- **Présences** : Voir et gérer les présences des élèves de son école
- **Paiements** : Gérer les paiements et types de frais de son école
- **Bibliothèque** : Gérer les livres de son école
- **E-learning** : Gérer les cours, devoirs et quiz de son école
- **Réunions** : Voir les réunions de son école
- **Encadrement** : Voir les messages et rapports d'encadrement de son école
- **Communication** : Gérer les notifications, messages et annonces de son école

### ❌ Restrictions

- **Ne peut pas créer de nouvelles écoles** (réservé aux super-admins)
- **Ne peut pas supprimer des écoles** (réservé aux super-admins)
- **Ne voit que les données de son école** (filtrage automatique)
- **Ne peut pas modifier les données d'autres écoles**

## Configuration automatique

Le système configure automatiquement :

1. **Filtrage par école** : Tous les objets sont automatiquement filtrés par l'école de l'administrateur
2. **Assignation automatique** : Lors de la création d'un nouvel objet, l'école est automatiquement assignée
3. **Permissions** : Les permissions d'ajout, modification et suppression sont automatiquement gérées

## Exemple : Configuration des paramètres de l'école

1. Connectez-vous à Django Admin
2. Allez dans **Écoles** → Sélectionnez votre école
3. Vous pouvez modifier :
   - Nom de l'école
   - Adresse
   - Téléphone
   - Email
   - Logo
   - Site web
   - Année scolaire
   - Devise
   - Langue
   - Statut actif

**Note** : Les champs `created_at` et `updated_at` sont en lecture seule.

## Dépannage

### Problème : "Vous n'avez pas les permissions nécessaires"

**Solution** : Vérifiez que :
- L'utilisateur a le rôle `ADMIN`
- L'utilisateur a `is_staff=True`
- L'utilisateur est associé à une école

### Problème : "Aucun objet trouvé"

**Solution** : C'est normal si votre école n'a pas encore de données. Créez d'abord des sections, classes, etc.

### Problème : "Impossible de modifier cet objet"

**Solution** : Vérifiez que l'objet appartient bien à votre école. Les administrateurs d'école ne peuvent modifier que les objets de leur propre école.

## Sécurité

- Les administrateurs d'école ne peuvent accéder qu'aux données de leur école
- Les super-admins Django peuvent voir toutes les écoles
- Les permissions sont vérifiées à chaque action (ajout, modification, suppression)
- Le filtrage est appliqué automatiquement dans toutes les vues admin

## Support

Pour toute question ou problème, contactez l'équipe de développement.
