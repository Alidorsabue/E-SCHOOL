# Guide de Migration - Application Unifiée

## 📋 Vue d'ensemble

Ce guide explique comment migrer vers l'application mobile unifiée qui gère à la fois les élèves et les parents.

## 🔄 Changements principaux

### Avant (2 applications séparées)
- `mobile_student/` : Application pour les élèves
- `mobile_parent/` : Application pour les parents

### Après (1 application unifiée)
- `mobile/` : Application unique qui s'adapte selon le rôle

## 📁 Structure de fichiers à copier

### Core (déjà créé)
Les fichiers core sont déjà créés dans `mobile/lib/core/`. Si besoin, copier depuis `mobile_student/lib/core/` :
- `database/` (hive_service.dart, database_service.dart)
- `network/` (api_service.dart, connectivity_service.dart)
- `services/` (notification_service.dart, sync_service.dart)
- `theme/` (app_theme.dart)
- `providers/` (auth_provider.dart)

### Features à copier

#### Depuis mobile_student (pour les élèves)
```
mobile_student/lib/features/
├── courses/          → mobile/lib/features/courses/
├── assignments/      → mobile/lib/features/assignments/
├── exams/            → mobile/lib/features/exams/
└── library/          → mobile/lib/features/library/ (déjà partagé)
```

#### Depuis mobile_parent (pour les parents)
```
mobile_parent/lib/features/
├── enrollment/       → mobile/lib/features/enrollment/
├── meetings/         → mobile/lib/features/meetings/
├── payments/         → mobile/lib/features/payments/
└── tutoring/         → mobile/lib/features/tutoring/
```

#### Commun (déjà créé)
- `auth/` : Authentification (déjà créé)
- `dashboard/` : Dashboard conditionnel (déjà créé)
- `grades/` : Notes (adapter selon le rôle)
- `library/` : Bibliothèque (commun)
- `profile/` : Profil (déjà créé)

## 🔧 Adaptations nécessaires

### 1. Grades Page
Adapter `grades_page.dart` pour gérer les deux rôles :
- **Élève** : Afficher ses propres notes
- **Parent** : Afficher les notes de ses enfants avec sélecteur

### 2. Database Service
Fusionner les schémas de base de données :
- Tables communes : sync_queue, cache
- Tables élèves : downloaded_courses, assignments, exams, library_books
- Tables parents : enrollments, children_grades, meetings, payments

### 3. Auth Repository
Déjà unifié, gère tous les rôles.

## ✅ Checklist de migration

- [x] Créer la structure de base `mobile/`
- [x] Créer `pubspec.yaml` unifié
- [x] Créer `main.dart` unifié
- [x] Créer router avec gestion des rôles
- [x] Créer dashboard conditionnel
- [x] Créer pages auth (splash, login)
- [x] Créer UserModel avec gestion des rôles
- [x] Créer profile page unifié
- [ ] Copier features élèves (courses, assignments, exams)
- [ ] Copier features parents (enrollment, meetings, payments, tutoring)
- [ ] Adapter grades page pour les deux rôles
- [ ] Fusionner database service
- [ ] Tester l'authentification avec les deux rôles
- [ ] Tester la navigation conditionnelle
- [ ] Vérifier les permissions de routes

## 🚀 Prochaines étapes

1. **Copier les fichiers features** depuis les deux applications
2. **Adapter les pages** qui doivent gérer les deux rôles
3. **Tester** avec des comptes élève et parent
4. **Supprimer** les anciennes applications `mobile_student/` et `mobile_parent/`

## 📝 Notes importantes

- Le router vérifie automatiquement le rôle et redirige si nécessaire
- Le dashboard s'adapte automatiquement selon le rôle
- La navigation (bottom bar) change selon le rôle
- Toutes les routes sont protégées par rôle

---

**Une fois la migration terminée, vous aurez une seule application qui gère parfaitement les deux types d'utilisateurs !** 🎉
