# Generated manually - harmonisation Postnom après Nom, Nom de la mère après parent_name

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('enrollment', '0002_enrollmentapplication_middle_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='enrollmentapplication',
            name='mother_name',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='Nom de la mère'),
        ),
    ]
