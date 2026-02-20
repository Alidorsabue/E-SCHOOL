# Fullname élève = first_name + last_name + middle_name (postnom)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_add_accountant_discipline_officer_roles'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='middle_name',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Postnom'),
        ),
    ]
