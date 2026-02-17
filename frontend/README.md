# E-School Management - Frontend Web

Application web React + TypeScript pour la plateforme scolaire digitale.

## 🚀 Démarrage

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

### Build Production

```bash
npm run build
```

## 📁 Structure

```
src/
├── components/     # Composants réutilisables
│   ├── auth/      # Authentification
│   ├── layout/    # Layout principal
│   └── ui/        # Composants UI de base
├── pages/          # Pages de l'application
│   ├── admin/     # Interfaces administrateur
│   ├── teacher/   # Interfaces enseignant
│   ├── parent/    # Interfaces parent
│   └── student/   # Interfaces élève
├── services/       # Services API
├── store/          # State management (Zustand)
├── types/          # Types TypeScript
└── utils/          # Utilitaires
```

## 🎨 Technologies

- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **React Query** - Gestion des données
- **Zustand** - State management
- **React Hook Form** - Formulaires
- **Zod** - Validation

## 👥 Profils Utilisateurs

### Administrateur
- Gestion des inscriptions
- Gestion des classes et enseignants
- Statistiques
- Paiements

### Enseignant
- Notes et présences
- Devoirs et examens
- Cours e-learning
- Réunions

### Parent
- Suivi scolaire
- Réunions (visio)
- Paiements
- Bibliothèque
- Encadrement

### Élève
- Tableau de bord
- Cours et devoirs
- Examens en ligne
- Bibliothèque
- Notes

## 🔧 Configuration

Créer un fichier `.env` :

```
VITE_API_URL=http://localhost:8000/api
```

## 📱 Responsive

L'application est entièrement responsive et optimisée pour :
- Desktop
- Tablette
- Mobile

## ⚡ Optimisations

- Lazy loading des images
- Code splitting
- Cache avec React Query
- Optimisé pour faible débit
