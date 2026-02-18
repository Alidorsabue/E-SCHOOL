# Guide : Vérifier les Logs Railway pour Diagnostiquer l'Erreur 502

## 🔍 Étapes pour Vérifier les Logs

### Méthode 1 : Via le Dashboard Railway (Recommandé)

1. **Allez sur [railway.app](https://railway.app)** et connectez-vous

2. **Sélectionnez votre projet**

3. **Cliquez sur le service "Backend"** (celui qui affiche l'erreur 502)

4. **Allez dans l'onglet "Deployments"** ou **"Logs"**

5. **Cliquez sur le dernier déploiement** (celui le plus récent)

6. **Lisez les logs depuis le début** - faites défiler vers le haut pour voir le début du déploiement

## 📋 Ce qu'il faut Chercher dans les Logs

### ✅ Signes que l'Application Démarre Correctement

Vous devriez voir dans l'ordre :

1. **Installation des dépendances** :
   ```
   Installing dependencies...
   Collecting gunicorn...
   ```

2. **Exécution des migrations** :
   ```
   Running migrations...
   Operations to perform:
   Running migrations:
   ```

3. **Collecte des fichiers statiques** :
   ```
   Collecting static files...
   Copying ...
   ```

4. **Démarrage de Gunicorn** :
   ```
   [INFO] Starting gunicorn ...
   [INFO] Listening at: http://0.0.0.0:XXXX
   [INFO] Application startup complete.
   ```

### ❌ Erreurs Courantes à Identifier

#### Erreur 1 : "No directory at: /app/staticfiles/"
**Solution** : Les modifications dans `wsgi.py` devraient résoudre cela. Si l'erreur persiste, vérifiez que le déploiement inclut les derniers commits.

#### Erreur 2 : "could not translate host name postgres.railway.internal"
**Cause** : Problème de connexion à la base de données
**Solution** : 
- Vérifiez que `DATABASE_URL` est défini dans Railway Variables
- Vérifiez que le service PostgreSQL est actif
- Supprimez `RAILWAY_PUBLIC_DATABASE_URL` si elle existe

#### Erreur 3 : "SECRET_KEY not set" ou "SECRET_KEY is empty"
**Cause** : Variable d'environnement manquante
**Solution** : Ajoutez `SECRET_KEY` dans Railway Variables

#### Erreur 4 : "No module named 'gunicorn'"
**Cause** : Gunicorn non installé
**Solution** : Vérifiez que `gunicorn` est dans `requirements.txt` (déjà présent)

#### Erreur 5 : "ALLOWED_HOSTS" ou erreur de domaine
**Cause** : Domaine non autorisé
**Solution** : Ajoutez `ALLOWED_HOSTS=*` dans Railway Variables

#### Erreur 6 : Erreur Python (Traceback)
**Cause** : Erreur dans le code Python
**Solution** : Lisez le traceback complet pour identifier le problème

#### Erreur 7 : "Migration failed"
**Cause** : Problème avec les migrations Django
**Solution** : Exécutez les migrations manuellement via Railway CLI

## 🔧 Actions Immédiates

### 1. Vérifier que le Dernier Déploiement Inclut les Modifications

Dans Railway Dashboard → Backend → Deployments, vérifiez :
- La date/heure du dernier déploiement
- Le commit déployé (devrait être `abe853d` ou plus récent)
- Le statut du déploiement (succès ou échec)

### 2. Si le Dernier Déploiement est Ancien

**Redéployez manuellement** :
1. Railway Dashboard → Backend → Deployments
2. Cliquez sur "Redeploy" ou "Deploy Latest"
3. Surveillez les logs pendant le redéploiement

### 3. Si le Déploiement Échoue

1. **Lisez les logs d'erreur** pour identifier le problème
2. **Vérifiez les variables d'environnement** dans Railway Variables
3. **Corrigez le problème** identifié
4. **Redéployez**

## 📊 Checklist de Vérification

Avant de redéployer, vérifiez dans Railway Dashboard → Backend → Variables :

- [ ] `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
- [ ] `SECRET_KEY` = (une clé secrète forte, pas vide)
- [ ] `DEBUG` = `False`
- [ ] `ALLOWED_HOSTS` = `*` ou `backend-production-195ed.up.railway.app`
- [ ] `RAILWAY_PUBLIC_DATABASE_URL` n'existe **PAS** (supprimez-la si présente)
- [ ] `RAILWAY_PUBLIC_HOSTNAME` n'existe **PAS** (supprimez-la si présente)

## 🚀 Commandes Utiles (Railway CLI)

Si vous avez Railway CLI installé :

```bash
# Voir les logs en temps réel
railway logs

# Voir les logs du dernier déploiement
railway logs --deployment <deployment-id>

# Vérifier la configuration Django
railway run python manage.py check --deploy

# Tester la connexion à la base de données
railway run python manage.py dbshell

# Voir les variables d'environnement
railway variables
```

## 📝 Prochaines Étapes

1. **Vérifiez les logs Railway** selon les étapes ci-dessus
2. **Identifiez l'erreur exacte** dans les logs
3. **Partagez l'erreur** pour obtenir une solution spécifique
4. **Corrigez le problème** identifié
5. **Redéployez** l'application

## ⚠️ Important

**L'erreur 502 signifie que l'application ne démarre pas.** Les logs Railway contiennent **toujours** la raison exacte. C'est la première chose à vérifier pour diagnostiquer le problème.

Une fois que vous avez identifié l'erreur dans les logs, partagez-la et je pourrai vous aider à la résoudre spécifiquement.
