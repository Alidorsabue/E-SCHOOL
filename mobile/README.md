# 📱 E-School Mobile - Application Unifiée

Application mobile Flutter unifiée pour les **Élèves** et **Parents** dans le système E-School Management.

## 🎯 Concept

Une **seule application** qui s'adapte automatiquement selon le rôle de l'utilisateur connecté :
- **Élève** : Accès aux cours, devoirs, examens, bibliothèque, notes
- **Parent** : Accès à l'inscription, suivi scolaire, réunions, paiements, encadrement

## ✨ Fonctionnalités

### Pour les Élèves
- ✅ Authentification
- ✅ Tableau de bord personnalisé
- ✅ Cours avec téléchargement offline
- ✅ Devoirs avec soumission
- ✅ Examens en ligne
- ✅ Bibliothèque
- ✅ Consultation des notes

### Pour les Parents
- ✅ Authentification
- ✅ Tableau de bord avec vue des enfants
- ✅ Inscription/Réinscription
- ✅ Suivi scolaire (notes des enfants)
- ✅ Réunions parents-professeurs
- ✅ Paiements en ligne
- ✅ Encadrement domicile
- ✅ Bibliothèque

### Commun
- ✅ Mode offline-first avec synchronisation
- ✅ Cache intelligent
- ✅ Notifications push (Firebase)
- ✅ Sécurité renforcée
- ✅ Optimisé pour faible bande passante

## 🏗️ Architecture

### Gestion des rôles
L'application détecte automatiquement le rôle de l'utilisateur après connexion et :
1. Affiche le dashboard approprié
2. Limite l'accès aux routes selon le rôle
3. Adapte la navigation (bottom bar)
4. Personnalise les fonctionnalités disponibles

### Routing conditionnel
Le router (`app_router.dart`) vérifie le rôle et :
- Redirige vers le dashboard si accès non autorisé
- Affiche uniquement les routes pertinentes
- Gère la navigation selon le contexte

## 📦 Installation

```bash
# Installer les dépendances
flutter pub get

# Lancer l'application
flutter run
```

## 🔧 Configuration

1. **Firebase** : Ajouter `google-services.json` dans `android/app/`
2. **API** : Modifier l'URL dans `lib/core/config/app_config.dart`
3. **Sécurité** : Changer la clé de chiffrement en production

## 📱 Structure

```
mobile/
├── lib/
│   ├── core/              # Services et configuration
│   │   ├── config/        # Configuration
│   │   ├── database/      # SQLite + Hive
│   │   ├── network/       # API + Connectivité
│   │   ├── services/      # Notifications + Sync
│   │   ├── router/        # Navigation avec gestion des rôles
│   │   ├── theme/         # Thème Material 3
│   │   └── providers/     # State management
│   └── features/
│       ├── auth/          # Authentification
│       ├── dashboard/     # Dashboard conditionnel
│       ├── courses/       # (Élèves)
│       ├── assignments/   # (Élèves)
│       ├── exams/         # (Élèves)
│       ├── enrollment/    # (Parents)
│       ├── meetings/      # (Parents)
│       ├── payments/      # (Parents)
│       ├── tutoring/      # (Parents)
│       ├── library/       # (Commun)
│       ├── grades/        # (Commun, contenu différent)
│       └── profile/      # (Commun)
```

## 🔐 Sécurité

- Vérification du rôle côté client ET serveur
- Routes protégées selon le rôle
- Tokens JWT sécurisés
- Validation des permissions

## 🚀 Déploiement

L'application peut être déployée comme une seule APK/IPA qui s'adapte automatiquement au rôle de l'utilisateur.

---

**Une application, deux expériences utilisateur** 🎓👨‍👩‍👧
