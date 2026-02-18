# Guide : Créer une école via l'interface Admin Django

## Étape 1 : Créer un superutilisateur (si nécessaire)

Si vous n'avez pas encore de superutilisateur, créez-en un :

```powershell
cd "c:\Users\Helpdesk\OneDrive - AITS\Bureau\MASTER IA DATA SCIENCE DIT\RECHERCHES\E-SCHOOL MANAGEMENT\backend"
python manage.py createsuperuser
```

Remplissez les informations demandées (nom d'utilisateur, email, mot de passe).

## Étape 2 : Accéder à l'interface Admin Django

1. Assurez-vous que le serveur Django est démarré :
   ```powershell
   cd "c:\Users\Helpdesk\OneDrive - AITS\Bureau\MASTER IA DATA SCIENCE DIT\RECHERCHES\E-SCHOOL MANAGEMENT\backend"
   python manage.py runserver
   ```

2. Ouvrez votre navigateur et allez à l'adresse :
   ```
   http://127.0.0.1:8000/admin/
   ```

3. Connectez-vous avec les identifiants du superutilisateur créé à l'étape 1.

## Étape 3 : Créer une école

1. Dans l'interface admin, trouvez la section **"SCHOOLS"** dans le menu de gauche.

2. Cliquez sur **"Schools"**.

3. Cliquez sur le bouton **"Add School"** (en haut à droite).

4. Remplissez le formulaire avec les informations de votre école :
   - **Nom de l'école** : Le nom de votre établissement (ex: "École Primaire ABC")
   - **Code de l'école** : Un code unique en majuscules et chiffres uniquement (ex: "ECOLE001")
   - **Adresse** : L'adresse complète de l'école
   - **Ville** : La ville où se trouve l'école
   - **Pays** : Par défaut "RDC"
   - **Téléphone** : Numéro de téléphone
   - **Email** : Adresse email de l'école
   - **Site web** : (Optionnel) URL du site web
   - **Année scolaire** : (ex: "2024-2025")
   - **Devise** : (ex: "CDF")
   - **Langue** : (ex: "fr")
   - **Actif** : Cochez cette case

5. Cliquez sur **"Save"** pour créer l'école.

## Étape 4 : Associer l'utilisateur ADMIN à l'école

1. Dans l'interface admin, trouvez la section **"ACCOUNTS"** dans le menu de gauche.

2. Cliquez sur **"Users"**.

3. Trouvez votre utilisateur ADMIN dans la liste (celui que vous utilisez pour vous connecter à l'application).

4. Cliquez sur le nom de l'utilisateur pour l'éditer.

5. Dans le formulaire, trouvez le champ **"École"** (dans la section "Informations supplémentaires").

6. Sélectionnez l'école que vous venez de créer dans le menu déroulant.

7. Cliquez sur **"Save"** pour enregistrer les modifications.

## Étape 5 : Vérifier

1. Retournez à votre application frontend.

2. Essayez de créer une classe à nouveau.

3. La création devrait maintenant fonctionner car votre utilisateur ADMIN est associé à une école.

## Alternative : Créer une école via le shell Django

Si vous préférez utiliser le shell Django :

```powershell
cd "c:\Users\Helpdesk\OneDrive - AITS\Bureau\MASTER IA DATA SCIENCE DIT\RECHERCHES\E-SCHOOL MANAGEMENT\backend"
python manage.py shell
```

Puis exécutez ce code Python :

```python
from apps.schools.models import School
from apps.accounts.models import User

# Créer une école
school = School.objects.create(
    name="École par défaut",
    code="DEFAULT",
    address="Adresse de l'école",
    city="Ville",
    country="RDC",
    phone="000000000",
    email="admin@ecole.com",
    academic_year="2024-2025",
    currency="CDF",
    language="fr",
    is_active=True
)

print(f"École créée : {school.name} (ID: {school.id})")

# Associer l'utilisateur ADMIN à l'école
admin_user = User.objects.filter(role='ADMIN').first()
if admin_user:
    admin_user.school = school
    admin_user.save()
    print(f"Utilisateur {admin_user.username} associé à l'école {school.name}")
else:
    print("Aucun utilisateur ADMIN trouvé")
```

## Notes importantes

- Le **Code de l'école** doit être unique et contenir uniquement des majuscules et des chiffres (pas d'espaces, pas de caractères spéciaux).
- Assurez-vous que l'utilisateur ADMIN a bien le rôle "ADMIN" dans la base de données.
- Après avoir associé l'utilisateur à l'école, vous devrez peut-être vous déconnecter et vous reconnecter pour que les changements prennent effet.
