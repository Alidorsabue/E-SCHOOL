# Déploiement de l'application mobile E-School

Guide pour construire et déployer l'application Flutter **E-School Mobile** (élèves et parents) en production.

---

## Premier déploiement : générer les dossiers Android / iOS

Si les dossiers `mobile/android/` et `mobile/ios/` **n'existent pas**, il faut d'abord les générer :

```bash
cd mobile
flutter create . --platforms=android,ios
```

Répondez **No** si Flutter propose d'écraser des fichiers existants (pour garder votre code). Ensuite vous pourrez lancer les builds décrits ci-dessous.

---

## Prérequis

- **Flutter SDK** 3.x installé (`flutter --version`)
- **Android** : Android SDK (Android Studio ou SDK seul)
- **Optionnel iOS** : Xcode (sur macOS uniquement)
- **Backend** : URL de l’API en production (ex. Railway)

## 1. Configurer l’URL de l’API

L’URL de l’API est définie au moment du **build** via `--dart-define`.

**URL de production (exemple Railway) :**
```text
https://backend-production-195ed.up.railway.app/api
```

Remplacez par votre URL backend réelle (avec `/api` à la fin, sans slash final).

En **développement**, l’app utilise par défaut `http://localhost:8000/api` si vous ne passez pas `API_BASE_URL`.

## 2. Build Android

### 2.1 Vérifier la présence des dossiers Android / iOS

Si les dossiers `android/` et `ios/` n’existent pas :

```bash
cd mobile
flutter create . --platforms=android,ios
```

Ne pas écraser les fichiers existants si demandé (garder le code actuel).

### 2.2 Build APK (installation directe)

Pour distribuer un fichier APK (tests, distribution hors Play Store) :

```bash
cd mobile

flutter pub get

flutter build apk --release \
  --dart-define=API_BASE_URL=https://backend-production-195ed.up.railway.app/api
```

L’APK est généré ici :
```text
build/app/outputs/flutter-apk/app-release.apk
```

### 2.3 Build AAB (Google Play Store)

Pour publier sur le Play Store, il faut un **App Bundle** signé :

```bash
cd mobile

flutter pub get

flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://backend-production-195ed.up.railway.app/api
```

Le fichier AAB est généré ici :
```text
build/app/outputs/bundle/release/app-release.aab
```

**Signature Android :**  
La première fois, Flutter peut créer une clé de debug. Pour la production, configurez une clé de signature dans `android/app/build.gradle` (voir section 5).

## 3. Build iOS (optionnel, sur macOS)

```bash
cd mobile

flutter pub get

flutter build ios --release \
  --dart-define=API_BASE_URL=https://backend-production-195ed.up.railway.app/api
```

Puis ouvrir le projet dans Xcode et archiver / publier depuis Xcode (signing, App Store Connect).

## 4. Scripts de build (Windows / PowerShell)

Créer dans le dossier `mobile/` un script pour simplifier les commandes.

**`mobile/build_release.ps1`** (exemple) :

```powershell
# Build release APK avec l'URL API de production
$apiUrl = "https://backend-production-195ed.up.railway.app/api"
if ($args.Count -gt 0) { $apiUrl = $args[0] }

Write-Host "Build APK release - API: $apiUrl"
flutter pub get
flutter build apk --release --dart-define=API_BASE_URL=$apiUrl
Write-Host "APK genere: build/app/outputs/flutter-apk/app-release.apk"
```

Usage :
```powershell
cd mobile
.\build_release.ps1
# ou avec une URL personnalisée :
.\build_release.ps1 "https://votre-backend.up.railway.app/api"
```

## 5. Signature Android (production)

Pour signer l’APK/AAB en release avec votre propre clé :

1. Générer une clé (une seule fois) :
   ```bash
   keytool -genkey -v -keystore android/app/eschool-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias eschool
   ```

2. Créer `android/key.properties` (ne pas commiter ce fichier) :
   ```properties
   storePassword=VOTRE_MOT_DE_PASSE
   keyPassword=VOTRE_MOT_DE_PASSE
   keyAlias=eschool
   storeFile=eschool-release-key.jks
   ```

3. Dans `android/app/build.gradle`, ajouter en haut (après les autres `apply`) :
   ```groovy
   def keystoreProperties = new Properties()
   def keystorePropertiesFile = rootProject.file('key.properties')
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }
   ```
   Puis dans `android { ... }` :
   ```groovy
   signingConfigs {
       release {
           keyAlias keystoreProperties['keyAlias']
           keyPassword keystoreProperties['keyPassword']
           storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
           storePassword keystoreProperties['storePassword']
       }
   }
   buildTypes {
       release {
           signingConfig signingConfigs.release
           // ...
       }
   }
   ```

4. Ajouter dans `.gitignore` du projet :
   ```text
   android/key.properties
   android/app/*.jks
   ```

## 6. Firebase (notifications push)

Si vous utilisez Firebase Cloud Messaging :

1. Créer un projet Firebase et ajouter une app Android (et iOS si besoin).
2. Télécharger `google-services.json` et le placer dans `android/app/`.
3. Pour iOS : télécharger `GoogleService-Info.plist` et l’ajouter dans Xcode.
4. Les dépendances `firebase_core` et `firebase_messaging` sont déjà dans `pubspec.yaml`.

## 7. CORS et backend

Le backend (Django) doit autoriser les requêtes depuis les apps mobiles. Les apps Flutter n’envoient pas d’origine navigateur ; en général il suffit que l’API soit exposée en HTTPS et que l’authentification JWT soit activée. Si vous avez des règles CORS strictes, vérifier qu’elles n’empêchent pas les requêtes des clients mobiles.

## 8. Résumé des commandes utiles

| Action | Commande |
|--------|----------|
| APK release (production) | `flutter build apk --release --dart-define=API_BASE_URL=https://VOTRE_BACKEND/api` |
| AAB (Play Store) | `flutter build appbundle --release --dart-define=API_BASE_URL=https://VOTRE_BACKEND/api` |
| Run en dev (localhost) | `flutter run` |
| Run avec une URL custom | `flutter run --dart-define=API_BASE_URL=https://VOTRE_BACKEND/api` |

## 9. Checklist avant déploiement

- [ ] Remplacer l’URL backend par votre URL de production dans les commandes de build.
- [ ] Tester l’APK sur au moins un appareil physique (connexion, login, données).
- [ ] Pour le Play Store : clé de signature configurée et AAB généré.
- [ ] Firebase configuré si vous utilisez les notifications push.
- [ ] Backend en HTTPS et accessible depuis Internet.

Une fois le build terminé, vous pouvez distribuer `app-release.apk` (tests / distribution directe) ou `app-release.aab` (Google Play).

## 10. Dépannage

### Erreur « 'C:\Program' n'est pas reconnu »

Cette erreur apparaît quand Flutter est installé dans un chemin contenant un **espace** (ex. `C:\Program Files\flutter`). La commande est tronquée au premier espace.

**Solutions :**

1. **Installer Flutter dans un chemin sans espace** (recommandé)  
   Ex. : `C:\flutter` ou `C:\dev\flutter`. Puis mettre à jour le `PATH` pour pointer vers ce dossier.

2. **Utiliser le chemin court Windows** (si vous ne pouvez pas déplacer Flutter)  
   Dans une invite de commandes **en tant qu’administrateur** :
   ```powershell
   setx PATH "C:\Progra~1\flutter\bin;%PATH%"
   ```
   Puis rouvrir le terminal et relancer le build.

3. **Définir FLUTTER_ROOT avec des guillemets**  
   Variable d’environnement utilisateur :  
   `FLUTTER_ROOT` = `"C:\Program Files\flutter"`  
   Redémarrer le terminal / l’IDE après modification.
