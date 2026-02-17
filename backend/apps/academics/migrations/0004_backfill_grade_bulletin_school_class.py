# Backfill school_class sur GradeBulletin à partir de StudentClassEnrollment
# (classe dans laquelle l'élève était inscrit pour cette année académique)

from django.db import migrations


def backfill_school_class(apps, schema_editor):
    GradeBulletin = apps.get_model('academics', 'GradeBulletin')
    StudentClassEnrollment = apps.get_model('schools', 'StudentClassEnrollment')
    for b in GradeBulletin.objects.filter(school_class__isnull=True).select_related('student'):
        enr = (
            StudentClassEnrollment.objects
            .filter(student=b.student, school_class__academic_year=b.academic_year)
            .order_by('-enrolled_at')
            .first()
        )
        if enr:
            b.school_class_id = enr.school_class_id
            b.save(update_fields=['school_class_id'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0003_add_school_class_to_grade_bulletin'),
    ]

    operations = [
        migrations.RunPython(backfill_school_class, noop),
    ]
