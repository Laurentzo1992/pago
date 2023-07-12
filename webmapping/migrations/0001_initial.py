# Generated by Django 4.2.3 on 2023-07-09 21:43

from django.db import migrations, models
import django.db.models.deletion
import mptt.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Arrondissement",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "nom_arrondissement",
                    models.CharField(
                        blank=True,
                        max_length=30,
                        null=True,
                        verbose_name="Nom de l'Arrondissement",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Commune",
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_commune', models.CharField(blank=True, max_length=30, null=True, verbose_name='Nom de la Commune')),
            ],
        ),
        migrations.CreateModel(
            name="Status",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        blank=True,
                        max_length=30,
                        null=True,
                        verbose_name="Status Infrastructure",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Type",
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(blank=True, max_length=30, null=True, verbose_name='Type Infrastructure')),
            ],
        ),
        migrations.CreateModel(
            name="Secteur",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "nom_secteur",
                    models.CharField(
                        blank=True,
                        max_length=30,
                        null=True,
                        verbose_name="Nom du Secteur",
                    ),
                ),
                (
                    "arrondissement",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="webmapping.arrondissement",
                        verbose_name="Nom de l'Arrondissement",
                    ),
                ),
            ],
            options={
                'unique_together': {('nom_secteur', 'arrondissement')},
            },
        ),
        migrations.CreateModel(
            name="Quartier",
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_quartier', models.CharField(blank=True, max_length=30, null=True, verbose_name='Nom du Quartier')),
                ('secteur', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='webmapping.secteur', verbose_name='Nom du Secteur')),
            ],
            options={
                'unique_together': {('nom_quartier', 'secteur')},
            },
        ),
        migrations.CreateModel(
            name="Infrastructure",
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('infrastructure', models.CharField(blank=True, max_length=30, null=True, verbose_name='Infrastructure')),
                ('status', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='webmapping.status', verbose_name="Status de  l'infrastructure")),
                ('type', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='webmapping.type', verbose_name="Type d'infrastructure")),
            ],
        ),
        migrations.AddField(
            model_name="arrondissement",
            name="commune",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="webmapping.commune",
                verbose_name="Nom de la Commune",
            ),
        ),
        migrations.AlterUniqueTogether(
            name='arrondissement',
            unique_together={('nom_arrondissement', 'commune')},
        ),
    ]
