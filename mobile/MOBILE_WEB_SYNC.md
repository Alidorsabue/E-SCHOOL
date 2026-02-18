# Synchronisation App Mobile / Web

Les rôles **Parent** et **Élève** utilisent les deux plateformes (web et app mobile). Les modules et les données sont alignés pour que l’expérience soit cohérente.

## Modules alignés

### Parent (web `/parent/*` ↔ mobile dashboard + routes)

| Web (Sidebar)        | Mobile (Dashboard + route)   | API partagée |
|----------------------|-----------------------------|--------------|
| Tableau de bord      | Accueil / Dashboard         | `GET /api/auth/students/parent_dashboard/` |
| Notes                | Notes (Suivi Scolaire)      | `GET /api/academics/grades/`, `GET /api/auth/students/` |
| Réunions             | Réunions                    | `GET /api/meetings/` |
| Paiements            | Paiements                   | `GET /api/payments/payments/` |
| Bibliothèque         | Bibliothèque                | `GET /api/library/` |
| Encadrement          | Encadrement                 | `GET /api/tutoring/` |
| Fiches de discipline | Fiches de discipline        | `GET /api/academics/discipline/` |
| Communication        | Communication               | `GET /api/communication/announcements/`, `messages/`, `notifications/` |
| —                    | Inscription (mobile only)   | `GET /api/enrollment/` |

### Élève (web `/student/*` ↔ mobile dashboard + routes)

| Web (Sidebar)        | Mobile (Dashboard + route)   | API partagée |
|----------------------|-----------------------------|--------------|
| Tableau de bord      | Accueil / Dashboard         | — |
| Cours                | Mes Cours                   | `GET /api/elearning/` ou cours |
| Devoirs              | Devoirs                     | `GET /api/academics/` (assignments) |
| Examens              | Examens                     | `GET /api/elearning/` (quizzes/exams) |
| Bibliothèque         | Bibliothèque                | `GET /api/library/` |
| Notes                | Notes                       | `GET /api/academics/grades/` |
| Fiches de discipline | Fiches de discipline        | `GET /api/academics/discipline/` |
| Communication        | Communication               | `GET /api/communication/` |

## Règles de routage (mobile)

- **Parent** : accès à Inscription, Notes, Réunions, Paiements, Bibliothèque, Encadrement, Fiches de discipline, Communication. Pas d’accès à Cours, Devoirs, Examens (redirection vers dashboard).
- **Élève** : accès à Cours, Devoirs, Examens, Bibliothèque, Notes, Fiches de discipline, Communication. Pas d’accès à Inscription, Réunions, Paiements, Encadrement (redirection vers dashboard).

## Données

- Même backend (Django) pour le web et l’app mobile.
- Token JWT et `X-School-Code` envoyés par l’app mobile comme sur le web.
- Réponses paginées gérées côté mobile (`results` quand présent).
