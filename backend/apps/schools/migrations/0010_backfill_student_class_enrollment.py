# Generated manually - backfill StudentClassEnrollment for existing Students

from django.db import migrations


def backfill_enrollments(apps, schema_editor):
    Student = apps.get_model('accounts', 'Student')
    StudentClassEnrollment = apps.get_model('schools', 'StudentClassEnrollment')
    for s in Student.objects.filter(school_class__isnull=False).select_related('school_class'):
        StudentClassEnrollment.objects.get_or_create(
            student=s, school_class=s.school_class,
            defaults={'status': 'active'},
        )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('schools', '0009_add_student_class_enrollment'),
    ]

    operations = [
        migrations.RunPython(backfill_enrollments, noop),
    ]
