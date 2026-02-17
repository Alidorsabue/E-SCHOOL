"""
Configuration de l'application accounts
"""
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'
    
    def ready(self):
        """Import des signaux lors du chargement de l'application"""
        import apps.accounts.signals  # noqa
