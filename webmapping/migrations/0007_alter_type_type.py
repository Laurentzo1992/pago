# Generated by Django 4.2.3 on 2023-07-09 23:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('webmapping', '0006_infrastructure'),
    ]

    operations = [
        migrations.AlterField(
            model_name='type',
            name='type',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='Type Infrastructure'),
        ),
    ]
