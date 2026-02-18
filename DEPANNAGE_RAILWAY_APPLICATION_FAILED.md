# Dépannage : Application Failed to Respond sur Railway

## 🔴 Problème

L'application ne répond pas sur Railway et affiche "Application failed to respond" lors de l'accès à `https://backend-production-195ed.up.railway.app/admin/`.

## 🔍 Étapes de Diagnostic

### 1. Vérifier les Logs de Déploiement

**C'est la première chose à faire !**

1. Allez sur [railway.app](https://railway.app)
2. Sélectionnez votre projet
3. Cliquez sur le service **Backend**
4. Allez dans l'onglet **"Deployments"** ou **"Logs"**
5. Cliquez sur le dernier déploiement
6. **Lisez les logs** pour identifier l'erreur exacte

Les erreurs courantes sont :
- ❌ Erreur de connexion à la base de données
- ❌ Erreur dans les migrations
- ❌ Erreur dans `collectstatic`
- ❌ Variables d'environnement manquantes
- ❌ Erreur Python dans le code

### 2. Vérifier les Variables d'Environnement

Dans Railway Dashboard → Service Backend → Variables, vérifiez que vous avez :

#### Variables Requises

| Variable | Valeur | Description |
|----------|--------|-------------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | URL de la base de données (automatique) |
| `SECRET_KEY` | `votre-clé-secrète` | Clé secrète Django (obligatoire) |
| `DEBUG` | `False` | Mode debug (False en production) |
| `ALLOWED_HOSTS` | `*` ou votre domaine | Domaines autorisés |

#### Variables Optionnelles mais Recommandées

| Variable | Valeur | Description |
|----------|--------|-------------|
| `CORS_ALLOWED_ORIGINS` | URL du frontend | Pour les requêtes CORS |
| `PORT` | Auto (Railway) | Port d'écoute (géré automatiquement) |

### 3. Vérifier la Configuration de la Base de Données

**Problème probable** : La fonction de conversion d'URL peut causer des problèmes en production.

Vérifiez dans Railway Dashboard → Variables que `DATABASE_URL` est bien défini et pointe vers PostgreSQL.

**Si vous avez ajouté `RAILWAY_PUBLIC_DATABASE_URL` pour le développement local**, **supprimez-la** des variables Railway en production ! Elle ne doit être utilisée qu'en local.

### 4. Vérifier le Procfile

Le fichier `backend/Procfile` doit contenir :

```
web: python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --log-file -
```

Vérifiez que :
- ✅ Le fichier existe dans `backend/Procfile`
- ✅ Gunicorn est dans `requirements.txt`
- ✅ Le port utilise `$PORT` (variable Railway)

## 🛠️ Solutions par Type d'Erreur

### Erreur : "could not translate host name postgres.railway.internal"

**Cause** : La fonction de conversion d'URL essaie de convertir l'URL interne en production.

**Solution** :

1. **Vérifiez que `RAILWAY_PUBLIC_DATABASE_URL` n'est PAS définie** dans les variables Railway
2. **Vérifiez que `RAILWAY_PUBLIC_HOSTNAME` n'est PAS définie** dans les variables Railway
3. En production, `DATABASE_URL` avec `postgres.railway.internal` est **correct** et doit fonctionner

Si le problème persiste, modifiez temporairement `settings.py` pour désactiver la conversion en production :

```python
def convert_railway_internal_to_public(database_url):
    # Ne pas convertir en production (sur Railway)
    if os.environ.get('RAILWAY_ENVIRONMENT') == 'production':
        return database_url
    # ... reste du code
```

### Erreur : "SECRET_KEY not set"

**Solution** :

1. Allez dans Railway Dashboard → Backend → Variables
2. Ajoutez `SECRET_KEY` avec une valeur générée :
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(50))"
   ```

### Erreur : "No module named 'gunicorn'"

**Solution** :

Vérifiez que `gunicorn` est dans `backend/requirements.txt` :

```txt
gunicorn>=21.2.0
```

Puis redéployez.

### Erreur : "Migration failed"

**Solution** :

1. Vérifiez les logs pour voir quelle migration échoue
2. Essayez d'exécuter les migrations manuellement via Railway CLI :
   ```bash
   railway run python manage.py migrate
   ```

### Erreur : "collectstatic failed"

**Solution** :

1. Vérifiez que `whitenoise` est dans `requirements.txt`
2. Vérifiez les permissions dans les logs
3. Essayez de désactiver temporairement `collectstatic` dans le Procfile pour tester :
   ```
   web: python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --log-file -
   ```

### Erreur : "ALLOWED_HOSTS"

**Solution** :

Dans Railway Dashboard → Backend → Variables, ajoutez :

```
ALLOWED_HOSTS=*
```

Ou spécifiez votre domaine :

```
ALLOWED_HOSTS=backend-production-195ed.up.railway.app
```

## 🔧 Solution Rapide : Vérifier la Configuration

### Checklist Complète

- [ ] `DATABASE_URL` est défini et pointe vers PostgreSQL Railway
- [ ] `SECRET_KEY` est défini (clé forte)
- [ ] `DEBUG=False` en production
- [ ] `ALLOWED_HOSTS` contient `*` ou votre domaine
- [ ] `RAILWAY_PUBLIC_DATABASE_URL` n'est **PAS** définie (supprimez-la si présente)
- [ ] `RAILWAY_PUBLIC_HOSTNAME` n'est **PAS** définie (supprimez-la si présente)
- [ ] `gunicorn` est dans `requirements.txt`
- [ ] `whitenoise` est dans `requirements.txt`
- [ ] `backend/Procfile` existe et est correct
- [ ] Le Root Directory est bien `backend` dans les Settings Railway

## 🚀 Redéploiement après Correction

Après avoir corrigé les variables :

1. **Redéployez manuellement** :
   - Railway Dashboard → Backend → Deployments
   - Cliquez sur "Redeploy" ou "Deploy Latest"

2. **Ou déclenchez un nouveau déploiement** :
   - Faites un commit et push sur GitHub
   - Railway redéploiera automatiquement

3. **Surveillez les logs** pendant le redéploiement pour vérifier que tout fonctionne

## 📋 Commandes Utiles pour le Diagnostic

### Via Railway CLI

```bash
# Voir les logs en temps réel
railway logs

# Exécuter une commande dans l'environnement Railway
railway run python manage.py check
railway run python manage.py migrate
railway run python manage.py shell
```

### Vérifier la Configuration Django

```bash
railway run python manage.py check --deploy
```

Cette commande vérifie la configuration Django pour la production.

## 🔍 Diagnostic Avancé

### Tester la Connexion à la Base de Données

```bash
railway run python manage.py dbshell
```

Si cela fonctionne, la connexion à la base de données est OK.

### Vérifier les Variables d'Environnement

```bash
railway run env | grep -E "DATABASE|SECRET|DEBUG|ALLOWED"
```

## ⚠️ Problème Connu : Conversion d'URL en Production

Si vous avez récemment ajouté la fonction de conversion d'URL dans `settings.py`, elle peut causer des problèmes en production si `RAILWAY_PUBLIC_DATABASE_URL` est définie.

**Solution** : Modifiez `settings.py` pour désactiver la conversion en production :

```python
def convert_railway_internal_to_public(database_url):
    # Ne pas convertir en production Railway
    # Railway utilise automatiquement l'URL interne qui fonctionne
    if os.environ.get('RAILWAY_ENVIRONMENT') or os.environ.get('RAILWAY_DEPLOYMENT_ID'):
        return database_url
    
    # ... reste du code pour le développement local
```

## 📞 Support

Si le problème persiste après avoir suivi ces étapes :

1. **Copiez les logs complets** du dernier déploiement
2. **Vérifiez les variables d'environnement** (sans exposer les secrets)
3. **Consultez** [Railway Help Station](https://railway.app/help)

## ✅ Vérification Finale

Une fois que l'application démarre correctement :

1. ✅ Les logs montrent "Application startup complete"
2. ✅ L'URL `https://backend-production-195ed.up.railway.app/admin/` répond
3. ✅ Vous pouvez vous connecter avec vos identifiants admin

Si l'admin n'existe pas encore, créez-le avec :
```bash
railway run python manage.py seed_initial
```

(après avoir défini `ADMIN_PASSWORD` dans les variables Railway)
