# Mots de Passe par Défaut pour Parents et Élèves

## 📋 Vue d'Ensemble

Le système définit automatiquement des mots de passe par défaut pour tous les parents et élèves :

- **Parents** : `Parent@@`
- **Élèves** : `Eleve@@`

Ces mots de passe peuvent être changés par les utilisateurs depuis l'application.

## 🔧 Configuration

### Mots de passe par défaut

Les mots de passe par défaut sont définis dans `backend/config/settings.py` :

```python
DEFAULT_PARENT_PASSWORD = config('DEFAULT_PARENT_PASSWORD', default='Parent@@')
DEFAULT_STUDENT_PASSWORD = config('DEFAULT_STUDENT_PASSWORD', default='Eleve@@')
```

### Personnaliser les mots de passe (optionnel)

Vous pouvez personnaliser les mots de passe par défaut via les variables d'environnement :

**Dans Railway** :
- `DEFAULT_PARENT_PASSWORD` : Mot de passe par défaut pour les parents
- `DEFAULT_STUDENT_PASSWORD` : Mot de passe par défaut pour les élèves

**Dans `.env` (local)** :
```env
DEFAULT_PARENT_PASSWORD=VotreMotDePasseParent
DEFAULT_STUDENT_PASSWORD=VotreMotDePasseEleve
```

## 🚀 Utilisation

### 1. Définir les mots de passe pour tous les utilisateurs existants

Pour mettre à jour tous les parents et élèves existants avec les mots de passe par défaut :

**En local** :
```bash
cd backend
python manage.py set_default_passwords
```

**Sur Railway** :
1. Railway Dashboard → Service Backend → Shell
2. Exécutez :
```bash
python manage.py set_default_passwords
```

**Mode dry-run (test sans modification)** :
```bash
python manage.py set_default_passwords --dry-run
```

### 2. Création automatique pour les nouveaux utilisateurs

Les nouveaux parents et élèves créés via :
- L'inscription (`/api/enrollment/applications/`)
- L'API de création d'utilisateur (`/api/auth/users/register/`)
- Django Admin

**Auront automatiquement** le mot de passe par défaut défini.

### 3. Changement de mot de passe par l'utilisateur

Les parents et élèves peuvent changer leur mot de passe depuis l'application :

**Via l'API** :
```http
POST /api/auth/users/change_password/
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "Parent@@",
  "new_password": "NouveauMotDePasse123!",
  "new_password2": "NouveauMotDePasse123!"
}
```

**Via le frontend** :
- Les utilisateurs peuvent accéder à leur profil et changer leur mot de passe

## 📝 Exemples

### Exemple 1 : Mettre à jour tous les parents et élèves existants

```bash
python manage.py set_default_passwords
```

**Sortie** :
```
============================================================
  Définition des mots de passe par défaut
============================================================

Parents trouvés: 15
Élèves trouvés: 120

------------------------------------------------------------
Mise à jour des parents...
------------------------------------------------------------
  ✓ alidor.alidor (Alidor SABUE)
  ✓ jean.dupont (Jean DUPONT)
  ...

------------------------------------------------------------
Mise à jour des élèves...
------------------------------------------------------------
  ✓ eleve001 (Élève UN)
  ✓ eleve002 (Élève DEUX)
  ...

============================================================
Résumé
============================================================
Parents mis à jour: 15/15
Élèves mis à jour: 120/120

Mots de passe par défaut:
  - Parents: Parent@@
  - Élèves: Eleve@@

✓ 135 utilisateurs mis à jour avec succès !

⚠ IMPORTANT: Communiquez ces mots de passe de manière sécurisée aux utilisateurs.
Les utilisateurs pourront changer leur mot de passe depuis l'application.
```

### Exemple 2 : Test sans modification (dry-run)

```bash
python manage.py set_default_passwords --dry-run
```

Cela affichera ce qui serait fait sans modifier la base de données.

## 🔒 Sécurité

### Bonnes Pratiques

1. **Communiquez les mots de passe de manière sécurisée** :
   - Par email sécurisé
   - En personne
   - Via un système de messagerie sécurisé

2. **Encouragez les utilisateurs à changer leur mot de passe** :
   - À la première connexion
   - Régulièrement (tous les 3-6 mois)

3. **Ne partagez jamais les mots de passe par défaut publiquement**

4. **Utilisez des mots de passe forts** si vous personnalisez les mots de passe par défaut :
   - Au moins 8 caractères
   - Mélange de majuscules, minuscules, chiffres et caractères spéciaux

## 🛠️ Dépannage

### Les mots de passe ne sont pas définis automatiquement

**Cause possible** : Le signal Django n'est pas chargé.

**Solution** : Vérifiez que `apps.accounts` est dans `INSTALLED_APPS` dans `settings.py` et que les signals sont importés dans `apps.py` :

```python
# apps/accounts/apps.py
class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'
    
    def ready(self):
        import apps.accounts.signals  # Import des signals
```

### La commande ne trouve pas d'utilisateurs

**Vérifiez** :
- Que les utilisateurs ont bien le rôle `PARENT` ou `STUDENT`
- Que les utilisateurs sont actifs (`is_active=True`)

### Les utilisateurs ne peuvent pas changer leur mot de passe

**Vérifiez** :
- Que l'endpoint `/api/auth/users/change_password/` est accessible
- Que l'utilisateur est authentifié (token valide)
- Que le serializer `ChangePasswordSerializer` fonctionne correctement

## 📚 Fichiers Modifiés

- `backend/apps/accounts/management/commands/set_default_passwords.py` : Commande pour définir les mots de passe
- `backend/apps/accounts/signals.py` : Signal pour définir automatiquement les mots de passe lors de la création
- `backend/apps/enrollment/views.py` : Utilisation des mots de passe par défaut lors de l'inscription
- `backend/config/settings.py` : Configuration des mots de passe par défaut

## ✅ Checklist

- [ ] Les mots de passe par défaut sont définis dans `settings.py`
- [ ] La commande `set_default_passwords` fonctionne
- [ ] Les nouveaux utilisateurs reçoivent automatiquement le mot de passe par défaut
- [ ] Les utilisateurs peuvent changer leur mot de passe depuis l'application
- [ ] Les mots de passe sont communiqués de manière sécurisée aux utilisateurs

## 💡 Notes Importantes

- Les mots de passe sont **hashés** dans la base de données (pbkdf2_sha256)
- Les mots de passe en clair ne sont **jamais stockés** dans la base de données
- Les utilisateurs peuvent changer leur mot de passe à tout moment
- Les mots de passe par défaut sont appliqués uniquement lors de la création ou via la commande
