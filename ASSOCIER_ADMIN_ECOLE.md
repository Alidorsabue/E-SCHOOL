# Guide : Associer l'utilisateur ADMIN à l'école

## Problème
Vous avez créé une école dans l'admin Django, mais l'erreur persiste car votre utilisateur ADMIN n'est pas associé à cette école.

## Solution rapide

### Méthode 1 : Via l'Admin Django (Recommandée)

1. **Accédez à l'admin Django** : `http://127.0.0.1:8000/admin/`

2. **Allez dans ACCOUNTS → Users**

3. **Trouvez votre utilisateur ADMIN** (celui que vous utilisez pour vous connecter)

4. **Cliquez sur le nom de l'utilisateur** pour l'éditer

5. **Dans le champ "École"**, sélectionnez l'école que vous avez créée

6. **Cliquez sur "Save"**

7. **Déconnectez-vous et reconnectez-vous** dans l'application frontend pour que les changements prennent effet

### Méthode 2 : Via le script Python

1. **Ouvrez un terminal PowerShell** dans le dossier `backend`

2. **Lancez le shell Django** :
   ```powershell
   cd "c:\Users\Helpdesk\OneDrive - AITS\Bureau\MASTER IA DATA SCIENCE DIT\RECHERCHES\E-SCHOOL MANAGEMENT\backend"
   python manage.py shell
   ```

3. **Exécutez le script** :
   ```python
   exec(open('associate_admin_to_school.py').read())
   ```

4. **Le script va** :
   - Lister toutes les écoles disponibles
   - Si une seule école existe, l'utiliser automatiquement
   - Trouver tous les utilisateurs ADMIN sans école
   - Les associer à l'école

5. **Déconnectez-vous et reconnectez-vous** dans l'application frontend

### Méthode 3 : Commande directe dans le shell

Si vous préférez faire cela manuellement :

```powershell
cd "c:\Users\Helpdesk\OneDrive - AITS\Bureau\MASTER IA DATA SCIENCE DIT\RECHERCHES\E-SCHOOL MANAGEMENT\backend"
python manage.py shell
```

Puis exécutez :

```python
from apps.schools.models import School
from apps.accounts.models import User

# Trouver votre école (remplacez par le nom de votre école)
school = School.objects.first()  # ou School.objects.get(name="Nom de votre école")

# Trouver votre utilisateur ADMIN (remplacez par votre nom d'utilisateur)
admin_user = User.objects.get(username="votre_nom_utilisateur")  # ou User.objects.filter(role='ADMIN').first()

# Associer l'utilisateur à l'école
admin_user.school = school
admin_user.save()

print(f"✓ {admin_user.username} associé à {school.name}")
```

## Vérification

Pour vérifier que l'association a fonctionné :

```python
from apps.accounts.models import User

# Vérifier votre utilisateur
user = User.objects.get(username="votre_nom_utilisateur")
print(f"Utilisateur: {user.username}")
print(f"Rôle: {user.role}")
print(f"École: {user.school.name if user.school else 'Aucune école'}")
```

## Important

**Après avoir associé l'utilisateur à l'école, vous DEVEZ :**
1. Vous déconnecter de l'application frontend
2. Vous reconnecter
3. Ensuite, essayez de créer une classe

Cela permet au token JWT d'être mis à jour avec les nouvelles informations de l'utilisateur (y compris l'école).
