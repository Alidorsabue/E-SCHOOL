# Generated migration: assigner chaque matière (ClassSubject) à un enseignant.
# L'enseignant assigné peut saisir les notes de cette matière dans cette classe.
# Le planning horaire pourra s'appuyer sur cette attribution.

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('schools', '0010_backfill_student_class_enrollment'),
    ]

    operations = [
        migrations.AddField(
            model_name='classsubject',
            name='teacher',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='class_subject_assignments',
                to='accounts.teacher',
                verbose_name='Enseignant assigné',
            ),
        ),
    ]
