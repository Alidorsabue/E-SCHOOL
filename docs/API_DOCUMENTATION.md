# Documentation API E-School Management

## Base URL
```
http://localhost:8000/api/
```

## Authentification

Tous les endpoints (sauf `/api/auth/login/` et `/api/auth/register/`) nécessitent une authentification JWT.

### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

### Headers requis
```http
Authorization: Bearer <access_token>
X-School-Code: <school_code>  # Pour le multi-tenant
```

## Endpoints principaux

### Authentification
- `POST /api/auth/login/` - Connexion
- `POST /api/auth/token/refresh/` - Rafraîchir le token
- `POST /api/auth/users/register/` - Inscription
- `GET /api/auth/users/me/` - Profil utilisateur actuel

### Écoles
- `GET /api/schools/` - Liste des écoles
- `GET /api/schools/{id}/` - Détails d'une école
- `GET /api/schools/classes/` - Liste des classes
- `GET /api/schools/subjects/` - Liste des matières

### Inscription
- `POST /api/enrollment/applications/` - Créer une demande d'inscription
- `GET /api/enrollment/applications/` - Liste des demandes
- `POST /api/enrollment/applications/{id}/approve/` - Approuver une demande
- `GET /api/enrollment/reenrollments/` - Liste des réinscriptions

### Suivi scolaire
- `GET /api/academics/grades/` - Liste des notes
- `POST /api/academics/grades/` - Créer une note
- `GET /api/academics/attendance/` - Liste des présences
- `POST /api/academics/attendance/` - Enregistrer une présence
- `GET /api/academics/report-cards/` - Liste des bulletins

### E-learning
- `GET /api/elearning/courses/` - Liste des cours
- `GET /api/elearning/assignments/` - Liste des devoirs
- `POST /api/elearning/assignments/{id}/submit/` - Soumettre un devoir
- `GET /api/elearning/quizzes/` - Liste des quiz
- `POST /api/elearning/quiz-attempts/start/` - Commencer un quiz

### Bibliothèque
- `GET /api/library/books/` - Liste des livres
- `POST /api/library/books/{id}/purchase/` - Acheter un livre
- `POST /api/library/books/{id}/update_progress/` - Mettre à jour la progression

### Paiements
- `GET /api/payments/fee-types/` - Liste des types de frais
- `POST /api/payments/payments/` - Créer un paiement
- `POST /api/payments/payments/{id}/process/` - Traiter un paiement
- `GET /api/payments/receipts/` - Liste des reçus

### Communication
- `GET /api/communication/notifications/` - Liste des notifications
- `POST /api/communication/notifications/{id}/mark_read/` - Marquer comme lu
- `GET /api/communication/messages/` - Liste des messages
- `POST /api/communication/announcements/` - Créer une annonce

## Codes de statut HTTP

- `200 OK` - Succès
- `201 Created` - Ressource créée
- `400 Bad Request` - Requête invalide
- `401 Unauthorized` - Non authentifié
- `403 Forbidden` - Accès refusé
- `404 Not Found` - Ressource non trouvée
- `500 Internal Server Error` - Erreur serveur

## Exemples de réponses

### Succès
```json
{
  "id": 1,
  "title": "Exemple",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Erreur
```json
{
  "detail": "Message d'erreur",
  "field_name": ["Erreur de validation"]
}
```
