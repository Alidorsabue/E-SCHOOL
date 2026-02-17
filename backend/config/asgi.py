"""
ASGI config for e-school-management project.
"""
import os
from pathlib import Path
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Créer le répertoire staticfiles s'il n'existe pas (pour WhiteNoise)
# Cela évite l'erreur "No directory at: /app/staticfiles/"
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATIC_ROOT.mkdir(parents=True, exist_ok=True)

application = get_asgi_application()
