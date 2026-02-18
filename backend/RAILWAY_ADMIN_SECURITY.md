# Sécurité admin Django (production Railway)

## 1. URL admin personnalisée

En production, **définir une URL secrète** pour l’admin Django dans les variables Railway :

- **Variable :** `DJANGO_ADMIN_URL`
- **Valeur :** uniquement le segment d’URL, **sans** slash ni espace (ex. `africa-admin-xyw` ou `secret-admin-xyz123`)
- **URL finale :** toujours **avec** un slash à la fin → `https://votre-backend.up.railway.app/africa-admin-xyw/`

**Important :**
- Utiliser l’URL **avec** le slash final : `https://.../africa-admin-xyw/` (sans slash, redirection automatique).
- Dans Railway → projet → service backend → **Variables** : ajouter `DJANGO_ADMIN_URL` = `africa-admin-xyw` (pas de guillemets).
- **Redéployer** après avoir ajouté ou modifié la variable (sinon l’ancienne valeur ou `admin` reste utilisée).
- Si ça ne marche pas : tester `https://.../admin/` ; si `/admin/` fonctionne, la variable n’est pas lue (vérifier le nom et redéployer).

## 2. Protection force brute (django-axes)

- **5 échecs de connexion** → blocage (par couple IP + utilisateur)
- **Durée du blocage :** 1 heure
- **Périmètre :** uniquement l’admin Django (l’API JWT n’est pas concernée)

Réglages dans `config/settings.py` (modifiables si besoin) :

- `AXES_FAILURE_LIMIT = 5`
- `AXES_COOLOFF_TIME = 1` (heure)
- `AXES_ONLY_ADMIN_SITE = True`

## 3. Après déploiement

Lors du premier déploiement avec ces changements, les migrations django-axes sont appliquées automatiquement si votre procédure exécute `python manage.py migrate`. Sinon, les lancer une fois :

```bash
python manage.py migrate
```

## Résumé Railway

| Variable              | Exemple                  | Obligatoire en prod |
|-----------------------|--------------------------|----------------------|
| `DJANGO_ADMIN_URL`    | `secret-admin-xyz123`    | Recommandé           |

Après ajout de `DJANGO_ADMIN_URL` sur Railway, redéployer le service pour que la nouvelle URL admin soit prise en compte.
