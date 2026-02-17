# Generated migration for answer_grades on AssignmentSubmission
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('elearning', '0005_add_teacher_feedback'),
    ]

    operations = [
        migrations.AddField(
            model_name='assignmentsubmission',
            name='answer_grades',
            field=models.JSONField(blank=True, default=dict, verbose_name='Notes par question'),
        ),
    ]
