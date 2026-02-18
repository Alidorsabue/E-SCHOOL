# Lance l'app avec le Flutter de C:\flutter (evite le conflit avec l'ancien chemin "Program Files")
$flutterPath = "C:\flutter\bin\flutter.bat"
if (-not (Test-Path $flutterPath)) {
    Write-Host "Erreur: Flutter non trouve a C:\flutter\bin\flutter.bat" -ForegroundColor Red
    exit 1
}
& $flutterPath pub get
& $flutterPath run @args
