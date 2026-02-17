# Gestion des parcours (StudentClassEnrollment) pour les élèves promus
# sans enrollment dans l'ancienne classe (ex. Virginie en 4ème 2026-2027).
"""
Crée les StudentClassEnrollment manquants pour les élèves qui ont des bulletins
pour une classe+année mais pas de parcours (promotion manuelle, ancien flux, etc.).

Usage:
  python manage.py repair_promoted_enrollments
  python manage.py repair_promoted_enrollments --dry-run
"""
from django.core.management.base import BaseCommand
from apps.schools.models import SchoolClass, ClassSubject, StudentClassEnrollment
from apps.academics.models import GradeBulletin
from apps.accounts.models import Student


class Command(BaseCommand):
    help = "Crée les parcours (StudentClassEnrollment) manquants pour les élèves avec bulletins mais sans enrollment."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Afficher les créations sans écrire en base.',
        )

    def handle(self, *args, **options):
        dry = options.get('dry_run', False)
        if dry:
            self.stdout.write(self.style.WARNING('Mode --dry-run : aucune écriture.'))

        created = 0
        for sc in SchoolClass.objects.all().order_by('academic_year'):
            ac = (sc.academic_year or '').strip()
            if not ac:
                continue
            # Uniquement bulletins avec school_class= cette classe (pas school_class=null :
            # les mêmes matières existent ailleurs, on créerait des parcours à tort pour d'autres classes).
            from_bulletin = set(
                GradeBulletin.objects.filter(academic_year=ac, school_class=sc)
                .values_list('student_id', flat=True)
                .distinct()
            )
            existing = set(
                StudentClassEnrollment.objects.filter(school_class=sc).values_list(
                    'student_id', flat=True
                )
            )
            to_add = from_bulletin - existing
            for sid in to_add:
                try:
                    s = Student.objects.get(pk=sid)
                except Student.DoesNotExist:
                    continue
                # Promu si l'élève n'est plus dans cette classe
                status = 'promoted' if (s.school_class_id != sc.id) else 'active'
                if not dry:
                    StudentClassEnrollment.objects.get_or_create(
                        student=s,
                        school_class=sc,
                        defaults={'status': status},
                    )
                self.stdout.write(
                    f"  + {sc.name} ({ac}): {s.user.get_full_name() or s.user.username} [#{s.id}] → {status}"
                )
                created += 1

        self.stdout.write(self.style.SUCCESS(f"Parcours créés ou à créer : {created}"))
        if dry and created:
            self.stdout.write(self.style.WARNING('Relancez sans --dry-run pour appliquer.'))
