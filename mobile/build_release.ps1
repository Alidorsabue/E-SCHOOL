# Build release APK avec l'URL API de production
# Usage: .\build_release.ps1
#        .\build_release.ps1 "https://votre-backend.up.railway.app/api"

$apiUrl = "https://backend-production-195ed.up.railway.app/api"
if ($args.Count -gt 0) { $apiUrl = $args[0] }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  E-School Mobile - Build Release APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API URL: $apiUrl" -ForegroundColor Yellow
Write-Host ""

flutter pub get
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

flutter build apk --release --dart-define=API_BASE_URL=$apiUrl
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "APK genere avec succes !" -ForegroundColor Green
Write-Host "Emplacement: build\app\outputs\flutter-apk\app-release.apk" -ForegroundColor Green
