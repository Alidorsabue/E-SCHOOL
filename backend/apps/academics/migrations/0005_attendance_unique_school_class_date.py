# Generated migration: présence 1x/jour par classe
# unique (student, date, subject) → (student, school_class, date)

from django.db import migrations, models


def dedupe_attendance(apps, schema_editor):
    """Avant de changer unique_together: garder une seule présence par (student, school_class, date)."""
    Attendance = apps.get_model('academics', 'Attendance')
    from django.db.models import Count, Max
    dupes = (
        Attendance.objects.values('student', 'school_class', 'date')
        .annotate(cnt=Count('id'), max_id=Max('id'))
        .filter(cnt__gt=1)
    )
    for g in dupes:
        Attendance.objects.filter(
            student_id=g['student'],
            school_class_id=g['school_class'],
            date=g['date'],
        ).exclude(id=g['max_id']).delete()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0004_backfill_grade_bulletin_school_class'),
    ]

    operations = [
        migrations.RunPython(dedupe_attendance, noop),
        migrations.AlterUniqueTogether(
            name='attendance',
            unique_together={('student', 'school_class', 'date')},
        ),
    ]
