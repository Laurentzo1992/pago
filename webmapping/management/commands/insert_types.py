import pandas as pd
from django.core.management.base import BaseCommand, CommandError
from webmapping.models import *


class Command(BaseCommand):

    def add_arguments(self, parser):
        parser.add_argument("--file", required=False, type=int)

    def handle(self, **options):
        # Charger les fichiers Excels dans un DataFrame
        df = pd.read_excel("webmapping/management/data.xlsx", sheet_name='BASE DES DONNEES DU PAGO')
        dfc = pd.read_excel("webmapping/management/Categories.xlsx", sheet_name='data')


        # Créer une liste de catégories
        categories = df['I11. Type de l\'infrastructure'].fillna('Autres').unique().tolist()

        # Liste de catégories 2 (amendé)
        regroupements = dfc['Regroupement'].fillna('Autres').unique().tolist()

        count = 0
        for category in categories:
            count = count + 1
            if count == 2:
                break
            self.stdout.write(f"{category}")
            #inserer la categorie
            root, created = Type.objects.get_or_create(type=category, parent=None)

            # Sélectionner les sous-catégories en fonction de la catégorie supérieure
            criteria = df['I11. Type de l\'infrastructure'] == category
            if category == 'INFRASTRUCTURES MARCHANDS':
                subcategories = df[criteria]['Q2.1. Type d’infrastructures marchands'].fillna(category).unique().tolist()
            elif category == 'CIMETIRE':
                subcategories = df[criteria]['Q13.1. Etat du cimetière'].fillna(category).unique().tolist()
            elif category == 'EAU ET ASSAINISSEMENT':
                subcategories = df[criteria]['Q9.2. Quel est la nature de l’infrastructure ?'].fillna(category).unique().tolist()
            elif category == 'EQUIPEMENT SOCIO CULTUREL / LOISIRS':
                subcategories = df[criteria]['Q3.1. Type d’infrastructures socio culturel'].fillna(category).unique().tolist()
            elif category == 'ESPACES VERTS':
                subcategories = df[criteria]['Q7.1. Types d’espaces'].fillna(category).unique().tolist()
            elif category == 'INFRASTRUCTURES ADMINISTRATIVE':
                subcategories = df[criteria]['Q8.1. Quel est le type d’infrastructure'].fillna(category).unique().tolist()
            elif category == 'INFRASTRUCTURES DE CONSERVATIONS':
                subcategories = df[criteria]['Q11.6. Quelle est l’utilité de l’infrastructure'].fillna(category).unique().tolist()
            elif category == 'INFRASTRUCTURES EDUCATIVES':
                subcategories = df[criteria]['Q1.1. Établissement'].fillna(category).unique().tolist()
            elif category == 'INFRASTRUTURES TOURISTIQUES':
                subcategories = df[criteria]['Q6.1. Type d’infrastructures touristiques   :'].fillna(category).unique().tolist()
            elif category == 'INFRASTURCTURES SANITAIRES':
                subcategories = df[criteria]['Q4.1. Type d’infrastructures sanitaire'].fillna(category).unique().tolist()
            elif category == 'INFRASTURCTURES SPORTIVES':
                subcategories = df[criteria]['Q5.1. Type d’infrastructures sportives'].fillna(category).unique().tolist()
            elif category == 'LES UNITES INDUSTRIELLES ET LES USINES':
                subcategories = df[criteria]['Q12.1. Quel est le type d’infrastructure'].fillna(category).unique().tolist()
            elif category == 'LIEUX DE CULTE':
                subcategories = df[criteria]['Q10.1.  Type du lieu de culte ?'].fillna(category).unique().tolist()
            else:
                subcategories = []

            
            for subcategory in subcategories:

                if (dfc['Type'].isin([subcategory]).any()):
                    regroupement_name = dfc[dfc['Type'] == subcategory]['Regroupement'].unique().tolist()[0]
                else:
                    regroupement_name = category

                self.stdout.write(f"------ {regroupement_name} --> {subcategory}")

                regroupement, created = Type.objects.get_or_create(type=regroupement_name, parent=root)
                types, created = Type.objects.get_or_create(type=subcategory, parent=regroupement)
                