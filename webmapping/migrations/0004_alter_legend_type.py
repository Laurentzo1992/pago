# Generated by Django 4.2.2 on 2023-08-15 13:31

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('webmapping', '0003_legend'),
    ]

    operations = [
        migrations.AlterField(
            model_name='legend',
            name='type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='webmapping.type', unique=True),
        ),
    ]
