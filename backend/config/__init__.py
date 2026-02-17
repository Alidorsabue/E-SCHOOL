try:
    from .celery import app as celery_app
except (ImportError, ModuleNotFoundError):
    celery_app = None  # Celery optionnel (ex. dev sans redis)

__all__ = ('celery_app',)
