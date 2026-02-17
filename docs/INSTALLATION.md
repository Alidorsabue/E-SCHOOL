# Guide d'installation - E-School Management

## Prérequis

- Python 3.9+
- Node.js 16+
- PostgreSQL (ou SQLite pour le développement)
- Redis (pour Celery, optionnel)

## Installation Backend

### 1. Créer un environnement virtuel

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 3. Configuration

Copier `.env.example` vers `.env` et configurer les variables :

```bash
cp .env.example .env
```

Éditer `.env` avec vos valeurs.

### 4. Migrations de base de données

**Avec SQLite (développement)** : définir `USE_SQLITE=True` dans `.env` ou :

```powershell
# Windows PowerShell
$env:USE_SQLITE="True"
python manage.py migrate
```

**Si l’erreur `no such table: schools_school` apparaît** (ou autre table manquante), réinitialiser la base puis migrer :

```powershell
# Windows
Remove-Item backend\db.sqlite3 -ErrorAction SilentlyContinue
$env:USE_SQLITE="True"
cd backend
python manage.py migrate
```

**Avec PostgreSQL** : configurer `DB_*` dans `.env`, puis :

```bash
python manage.py migrate
```

### 5. Créer un superutilisateur

```bash
python manage.py createsuperuser
```

- **Rôle** : utiliser `ADMIN` (pas `SUPERADMIN`). Choix valides : `ADMIN`, `TEACHER`, `PARENT`, `STUDENT`.
- Saisir le **mot de passe** deux fois de façon identique.

### 6. Lancer le serveur

```bash
python manage.py runserver
```

Le serveur sera accessible sur `http://localhost:8000`

## Installation Frontend (React Native)

### 1. Installer les dépendances

```bash
cd mobile
npm install
```

### 2. Configuration Android

Assurez-vous d'avoir Android Studio installé et configuré.

### 3. Lancer l'application

```bash
# Android
npx react-native run-android

# iOS (Mac uniquement)
npx react-native run-ios
```

## Configuration Celery (Optionnel)

Pour les tâches asynchrones (SMS, WhatsApp) :

### 1. Démarrer Redis

```bash
redis-server
```

### 2. Démarrer Celery Worker

```bash
celery -A config worker -l info
```

### 3. Démarrer Celery Beat (pour les tâches périodiques)

```bash
celery -A config beat -l info
```

## Tests

```bash
# Backend
python manage.py test

# Frontend
cd mobile
npm test
```

## Structure de la base de données

Après les migrations, vous aurez les tables suivantes :
- `accounts_user`, `accounts_teacher`, `accounts_parent`, `accounts_student`
- `schools_school`, `schools_schoolclass`, `schools_subject`
- `enrollment_enrollmentapplication`, `enrollment_reenrollment`
- `academics_grade`, `academics_attendance`, `academics_disciplinerecord`
- `elearning_course`, `elearning_assignment`, `elearning_quiz`
- `library_book`, `library_bookpurchase`
- `payments_payment`, `payments_feetype`
- `communication_notification`, `communication_message`

## Prochaines étapes

1. Créer une école via l'admin Django
2. Créer des utilisateurs (admin, enseignants, parents, élèves)
3. Configurer les matières et classes
4. Tester les différents modules via l'API
