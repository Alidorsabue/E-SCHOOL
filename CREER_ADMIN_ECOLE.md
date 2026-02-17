# Guide : Créer un Administrateur d'École avec Accès Django Admin

## Problème

Si vous voyez le message "Vous n'avez pas la permission de voir ou de modifier quoi que ce soit" dans Django Admin, cela signifie que l'utilisateur n'a pas les permissions nécessaires.

## Solution : Créer ou Activer un Administrateur d'École

### Option 1 : Créer un nouvel administrateur d'école

#### Via Django Shell

```bash
python manage.py shell
```

```python
from apps.accounts.models import User
from apps.schools.models import School
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission

# 1. Trouver ou créer l'école
school = School.objects.get(code='VITALMAURICE')  # Remplacez par le code de l'école

# 2. Créer l'utilisateur administrateur
username = 'BLAISE'  # Remplacez par le nom d'utilisateur souhaité
email = 'blaise@example.com'  # Remplacez par l'email

# Vérifier si l'utilisateur existe déjà
if User.objects.filter(username=username).exists():
    user = User.objects.get(username=username)
    print(f"L'utilisateur {username} existe déjà")
else:
    # Créer l'utilisateur
    user = User.objects.create_user(
        username=username,
        email=email,
        password='motdepasse123',  # Changez ce mot de passe !
        role='ADMIN',
        school=school,
        is_staff=True,  # Nécessaire pour accéder à Django Admin
        is_active=True
    )
    print(f"Utilisateur {username} créé avec succès")

# 3. Donner toutes les permissions nécessaires
content_types = ContentType.objects.all()
permissions = Permission.objects.filter(content_type__in=content_types)
user.user_permissions.set(permissions)
user.save()

print(f"✅ {permissions.count()} permissions assignées à {username}")
print(f"✅ L'utilisateur peut maintenant accéder à Django Admin")
print(f"   URL: http://localhost:8000/admin/")
```

#### Via le script Python

Créez un fichier `create_school_admin.py` :

```python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.schools.models import School
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission

def create_school_admin(username, email, school_code, password):
    """Crée un administrateur d'école avec toutes les permissions"""
    try:
        # Trouver l'école
        school = School.objects.get(code=school_code)
        
        # Vérifier si l'utilisateur existe
        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            print(f"[INFO] L'utilisateur {username} existe déjà")
        else:
            # Créer l'utilisateur
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role='ADMIN',
                school=school,
                is_staff=True,
                is_active=True
            )
            print(f"[SUCCES] Utilisateur {username} créé")
        
        # Donner toutes les permissions
        content_types = ContentType.objects.all()
        permissions = Permission.objects.filter(content_type__in=content_types)
        user.user_permissions.set(permissions)
        user.is_staff = True
        user.save()
        
        print(f"[SUCCES] {permissions.count()} permissions assignées")
        print(f"[SUCCES] L'utilisateur peut accéder à Django Admin")
        return True
        
    except School.DoesNotExist:
        print(f"[ERREUR] L'école avec le code '{school_code}' n'existe pas")
        return False
    except Exception as e:
        print(f"[ERREUR] {e}")
        return False

if __name__ == '__main__':
    import sys
    if len(sys.argv) >= 5:
        create_school_admin(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        print("Usage: python create_school_admin.py <username> <email> <school_code> <password>")
        print("Exemple: python create_school_admin.py BLAISE blaise@example.com VITALMAURICE motdepasse123")
```

Exécutez :
```bash
python create_school_admin.py BLAISE blaise@example.com VITALMAURICE motdepasse123
```

### Option 2 : Activer un administrateur existant

Si l'utilisateur existe déjà mais n'a pas les permissions :

```bash
python check_user_permissions.py BLAISE
```

Ou utilisez le script d'activation :

```bash
python activate_admin_access.py BLAISE
```

## Vérification

1. **Vérifier que l'utilisateur existe** :
```bash
python check_user_permissions.py BLAISE
```

2. **Lister tous les administrateurs d'école** :
```bash
python activate_admin_access.py --list
```

## Connexion à Django Admin

1. Allez sur `http://localhost:8000/admin/`
2. Connectez-vous avec :
   - **Nom d'utilisateur** : BLAISE (ou le nom que vous avez créé)
   - **Mot de passe** : Le mot de passe que vous avez défini

## Important

- **Déconnectez-vous et reconnectez-vous** après avoir activé les permissions pour que les changements prennent effet
- Assurez-vous que l'utilisateur a :
  - `role='ADMIN'`
  - `school` associée (non null)
  - `is_staff=True`
  - Toutes les permissions assignées

## Dépannage

### Problème : "Vous n'avez pas la permission de voir ou de modifier quoi que ce soit"

**Solutions** :
1. Vérifiez que `is_staff=True`
2. Vérifiez que l'utilisateur a des permissions assignées
3. Déconnectez-vous et reconnectez-vous
4. Utilisez le script `check_user_permissions.py` pour vérifier et corriger

### Problème : L'utilisateur ne voit aucune donnée

**Solution** : C'est normal si l'école n'a pas encore de données. Créez d'abord des sections, classes, etc.

### Problème : L'utilisateur ne peut pas modifier certains objets

**Solution** : Vérifiez que l'objet appartient bien à l'école de l'administrateur. Les administrateurs d'école ne peuvent modifier que les objets de leur propre école.
