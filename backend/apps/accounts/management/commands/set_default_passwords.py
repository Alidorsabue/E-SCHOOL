"""
Commande pour définir les mots de passe par défaut pour tous les parents et élèves.
Usage: python manage.py set_default_passwords

Cette commande :
- Définit le mot de passe 'Parent@@' pour tous les parents
- Définit le mot de passe 'Eleve@@' pour tous les élèves
- Les utilisateurs pourront ensuite changer leur mot de passe depuis l'application

Note: Cette commande met à jour TOUS les parents et élèves existants.
Pour définir automatiquement le mot de passe lors de la création d'un nouvel utilisateur,
voir le signal dans apps/accounts/signals.py
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

# Mots de passe par défaut (peuvent être surchargés via settings)
DEFAULT_PARENT_PASSWORD = getattr(settings, 'DEFAULT_PARENT_PASSWORD', 'Parent@@')
DEFAULT_STUDENT_PASSWORD = getattr(settings, 'DEFAULT_STUDENT_PASSWORD', 'Eleve@@')


class Command(BaseCommand):
    help = "Définit les mots de passe par défaut pour tous les parents et élèves"

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Affiche ce qui serait fait sans modifier la base de données',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force la mise à jour même si le mot de passe a déjà été changé',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']

        if dry_run:
            self.stdout.write(self.style.WARNING("Mode DRY-RUN : aucune modification ne sera effectuée"))

        # Récupérer tous les parents
        parents = User.objects.filter(role='PARENT')
        parent_count = parents.count()

        # Récupérer tous les élèves
        students = User.objects.filter(role='STUDENT')
        student_count = students.count()

        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(f"  Définition des mots de passe par défaut")
        self.stdout.write(f"{'='*60}")
        self.stdout.write(f"\nParents trouvés: {parent_count}")
        self.stdout.write(f"Élèves trouvés: {student_count}")

        updated_parents = 0
        updated_students = 0

        # Mettre à jour les parents
        if parent_count > 0:
            self.stdout.write(f"\n{'─'*60}")
            self.stdout.write(f"Mise à jour des parents...")
            self.stdout.write(f"{'─'*60}")
            
            for parent in parents:
                # Vérifier si le mot de passe a déjà été changé (optionnel)
                # On peut détecter cela en vérifiant si le hash correspond au mot de passe par défaut
                # Mais pour simplifier, on met à jour tous les parents
                
                if not dry_run:
                    parent.set_password(DEFAULT_PARENT_PASSWORD)
                    parent.save()
                    updated_parents += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✓ {parent.username} ({parent.get_full_name() or 'N/A'})")
                    )
                else:
                    updated_parents += 1
                    self.stdout.write(f"  [DRY-RUN] {parent.username} ({parent.get_full_name() or 'N/A'})")

        # Mettre à jour les élèves
        if student_count > 0:
            self.stdout.write(f"\n{'─'*60}")
            self.stdout.write(f"Mise à jour des élèves...")
            self.stdout.write(f"{'─'*60}")
            
            for student in students:
                if not dry_run:
                    student.set_password(DEFAULT_STUDENT_PASSWORD)
                    student.save()
                    updated_students += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✓ {student.username} ({student.get_full_name() or 'N/A'})")
                    )
                else:
                    updated_students += 1
                    self.stdout.write(f"  [DRY-RUN] {student.username} ({student.get_full_name() or 'N/A'})")

        # Résumé
        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(self.style.SUCCESS("Résumé"))
        self.stdout.write(f"{'='*60}")
        self.stdout.write(f"Parents mis à jour: {updated_parents}/{parent_count}")
        self.stdout.write(f"Élèves mis à jour: {updated_students}/{student_count}")
        self.stdout.write(f"\nMots de passe par défaut:")
        self.stdout.write(f"  - Parents: {DEFAULT_PARENT_PASSWORD}")
        self.stdout.write(f"  - Élèves: {DEFAULT_STUDENT_PASSWORD}")
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "\n⚠ Mode DRY-RUN : aucune modification n'a été effectuée.\n"
                    "Exécutez sans --dry-run pour appliquer les changements."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n✓ {updated_parents + updated_students} utilisateurs mis à jour avec succès !"
                )
            )
            self.stdout.write(
                self.style.WARNING(
                    "\n⚠ IMPORTANT: Communiquez ces mots de passe de manière sécurisée aux utilisateurs.\n"
                    "Les utilisateurs pourront changer leur mot de passe depuis l'application."
                )
            )
