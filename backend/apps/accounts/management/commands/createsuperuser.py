"""
Commande personnalisee pour creer un superutilisateur avec le champ role
"""
from django.contrib.auth.management.commands.createsuperuser import Command as BaseCommand
from django.core.exceptions import ValidationError


class Command(BaseCommand):
    """Commande personnalisee pour creer un superutilisateur avec gestion du role"""
    
    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument(
            '--role',
            dest='role',
            default=None,
            help='Role de l\'utilisateur (ADMIN, TEACHER, PARENT, STUDENT)',
        )
    
    def handle(self, *args, **options):
        # Django devrait automatiquement demander le role car il est dans REQUIRED_FIELDS
        # Mais on peut aussi le passer en argument
        return super().handle(*args, **options)
