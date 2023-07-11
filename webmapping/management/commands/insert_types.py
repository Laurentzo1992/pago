import pandas as pd
from django.core.management.base import BaseCommand, CommandError
from webmapping.models import *


class Command(BaseCommand):

    def add_arguments(self, parser):
        parser.add_argument("--file", required=False, type=int)

    def handle(self, **options):
        # Charger le fichier Excel dans un DataFrame
        df = pd.read_excel("webmapping/management/data.xlsx", sheet_name='BASE DES DONNEES DU PAGO')


        # Créer une liste de catégories
        categories = df['I11. Type de l\'infrastructure'].fillna('N/A').unique().tolist()


        for category in categories:
            
            #inserer la categorie
            root = Type.objects.create(type=category)

            # Sélectionner les sous-catégories en fonction de la catégorie supérieure
            if category == 'INFRASTRUCTURES MARCHANDS':
                subcategories = df['Q2.1. Type d’infrastructures marchands'].fillna('N/A').unique().tolist()
            elif category == 'CIMETIRE':
                subcategories = df['Q13.1. Etat du cimetière'].fillna('N/A').unique().tolist()
            elif category == 'EAU ET ASSAINISSEMENT':
                subcategories = df['Q9.2. Quel est la nature de l’infrastructure ?'].fillna('N/A').unique().tolist()
            elif category == 'EQUIPEMENT SOCIO CULTUREL / LOISIRS':
                subcategories = df['Q3.1. Type d’infrastructures socio culturel'].fillna('N/A').unique().tolist()
            elif category == 'ESPACES VERTS':
                subcategories = df['Q7.1. Types d’espaces'].fillna('N/A').unique().tolist()
            elif category == 'INFRASTRUCTURES ADMINISTRATIVE':
                subcategories = df['Q8.1. Quel est le type d’infrastructure'].fillna('N/A').unique().tolist()
            elif category == 'INFRASTRUCTURES DE CONSERVATIONS':
                subcategories = df['Q11.6. Quelle est l’utilité de l’infrastructure'].fillna('N/A').unique().tolist()
            elif category == 'INFRASTRUCTURES EDUCATIVES':
                subcategories = df['Q1.1. Établissement'].fillna('N/A').unique().tolist()
            elif category == 'INFRASTRUTURES TOURISTIQUES':
                subcategories = df['Q6.1. Type d’infrastructures touristiques   :'].fillna('N/A').unique().tolist()
            elif category == 'INFRASTURCTURES SANITAIRES':
                subcategories = df['Q4.1. Type d’infrastructures sanitaire'].fillna('N/A').unique().tolist()
            elif category == 'INFRASTURCTURES SPORTIVES':
                subcategories = df['Q5.1. Type d’infrastructures sportives'].fillna('N/A').unique().tolist()
            elif category == 'LES UNITES INDUSTRIELLES ET LES USINES':
                subcategories = df['Q12.1. Quel est le type d’infrastructure'].fillna('N/A').unique().tolist()
            elif category == 'LIEUX DE CULTE':
                subcategories = df['Q10.1.  Type du lieu de culte ?'].fillna('N/A').unique().tolist()
            else:
                subcategories = []

            
            for subcategory in subcategories:
                # Insert child type
                child = Type.objects.create(type=subcategory, parent=root)
                