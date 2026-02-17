# 🚀 Guide de Démarrage Rapide

## Installation en 3 étapes

### 1️⃣ Installer les dépendances
```bash
cd mobile
flutter pub get
```

### 2️⃣ Configurer l'API
Éditer `lib/core/config/app_config.dart` :
```dart
static const String baseUrl = 'https://votre-api.com/api';
```

### 3️⃣ Lancer l'application
```bash
flutter run
```

## 🔧 Configuration Optionnelle

### Firebase (pour les notifications)
1. Créer un projet Firebase
2. Ajouter l'app Android/iOS
3. Télécharger `google-services.json` (Android)
4. Placer dans `android/app/google-services.json`

## 🧪 Tester les Rôles

### Test Élève
1. Se connecter avec un compte **STUDENT**
2. Vérifier l'accès à : Cours, Devoirs, Examens, Bibliothèque, Notes
3. Vérifier que les routes parents sont bloquées

### Test Parent
1. Se connecter avec un compte **PARENT**
2. Vérifier l'accès à : Inscription, Suivi, Réunions, Paiements, Encadrement
3. Vérifier que les routes élèves sont bloquées

## 📱 Structure de l'App

```
mobile/
├── lib/
│   ├── main.dart                    # Point d'entrée
│   ├── core/                        # Services de base
│   │   ├── config/                  # Configuration
│   │   ├── database/                # SQLite + Hive
│   │   ├── network/                 # API + Connectivité
│   │   ├── services/                 # Notifications + Sync
│   │   ├── router/                  # Navigation avec rôles
│   │   ├── theme/                   # Thème Material 3
│   │   └── providers/               # State management
│   └── features/                    # Fonctionnalités
│       ├── auth/                    # Authentification
│       ├── dashboard/               # Dashboard conditionnel
│       ├── courses/                  # (Élèves)
│       ├── assignments/              # (Élèves)
│       ├── exams/                    # (Élèves)
│       ├── enrollment/              # (Parents)
│       ├── meetings/                 # (Parents)
│       ├── payments/                # (Parents)
│       ├── tutoring/                 # (Parents)
│       ├── library/                  # (Commun)
│       ├── grades/                   # (Commun, adapté)
│       └── profile/                 # (Commun)
└── pubspec.yaml                     # Dépendances
```

## 🎯 Fonctionnalités Clés

### Pour les Élèves
- 📚 Cours avec téléchargement offline
- 📝 Devoirs avec soumission offline
- 📊 Examens en ligne
- 📖 Bibliothèque
- 📈 Notes personnelles

### Pour les Parents
- 👶 Inscription/Réinscription
- 📊 Suivi scolaire (notes enfants)
- 🤝 Réunions
- 💳 Paiements
- 🏠 Encadrement domicile
- 📖 Bibliothèque

## 🔄 Mode Offline

L'application fonctionne **même sans connexion** :
- ✅ Cache des données récentes
- ✅ Queue de synchronisation
- ✅ Synchronisation automatique au retour de connexion
- ✅ Téléchargements pour consultation offline

## 📞 Support

En cas de problème :
1. Vérifier la configuration de l'API
2. Vérifier les permissions Android/iOS
3. Consulter les logs : `flutter run -v`

---

**Bon développement ! 🎓**
