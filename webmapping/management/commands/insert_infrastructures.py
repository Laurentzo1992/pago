import pandas as pd
import json
import sys
from mptt.models import MPTTModel, TreeForeignKey
from django.core.management.base import BaseCommand, CommandError
from webmapping.models import *
import os
from django.core.management import call_command



class Command(BaseCommand):

     def add_arguments(self, parser):
        parser.add_argument("--file", required=False, type=int)

     def handle(self, **options):
        print('Inserting infrastructures')
        # Charger le fichier Excel dans un DataFrame
        df = pd.read_excel('webmapping/management/data.xlsx', sheet_name='BASE DES DONNEES DU PAGO')
        dfc = pd.read_excel("webmapping/management/Categories.xlsx", sheet_name='data')
        
        exceeds = []
        errors = []
        total_rows = df.shape[0]
        for index, row in df.iterrows():
            
            category = 'Autres' if pd.isna(row['I11. Type de l\'infrastructure']) else row['I11. Type de l\'infrastructure']
            
            if category == 'INFRASTRUCTURES MARCHANDS':
                subcategories_columnname = "Q2.1. Type d’infrastructures marchands"
            elif category == 'CIMETIRE':
                subcategories_columnname = "Q13.1. Etat du cimetière"
            elif category == 'EAU ET ASSAINISSEMENT':
                subcategories_columnname = "Q9.2. Quel est la nature de l’infrastructure ?"
            elif category == 'EQUIPEMENT SOCIO CULTUREL / LOISIRS':
                subcategories_columnname = "Q3.1. Type d’infrastructures socio culturel"
            elif category == 'ESPACES VERTS':
                subcategories_columnname = "Q7.1. Types d’espaces"
            elif category == 'INFRASTRUCTURES ADMINISTRATIVE':
                subcategories_columnname = "Q8.1. Quel est le type d’infrastructure"
            elif category == 'INFRASTRUCTURES DE CONSERVATIONS':
                subcategories_columnname = "Q11.6. Quelle est l’utilité de l’infrastructure"
            elif category == 'INFRASTRUCTURES EDUCATIVES':
                subcategories_columnname = 'Q1.1. Établissement'
            elif category == 'INFRASTRUTURES TOURISTIQUES':
                subcategories_columnname = "Q6.1. Type d’infrastructures touristiques   :"
            elif category == 'INFRASTURCTURES SANITAIRES':
                subcategories_columnname = "Q4.1. Type d’infrastructures sanitaire"
            elif category == 'INFRASTURCTURES SPORTIVES':
                subcategories_columnname = "Q5.1. Type d’infrastructures sportives"
            elif category == 'LES UNITES INDUSTRIELLES ET LES USINES':
                subcategories_columnname = "Q12.1. Quel est le type d’infrastructure"
            elif category == 'LIEUX DE CULTE':
                subcategories_columnname = "Q10.1.  Type du lieu de culte ?"
            else:
                subcategories_columnname = 'NaN'

            item = {
                    'Statut de l\'infrastructure': 'N/A' if pd.isna(row['I10. Statut de l\'infrastructure']) else row['I10. Statut de l\'infrastructure'],
                    'Nom de l\'infrastructure': 'N/A' if pd.isna(row['I9. Nom de l\'infrastructure']) else row['I9. Nom de l\'infrastructure'],
                    'Commune': '' if pd.isna(row['I2. Commune']) else row['I2. Commune'],
                    'Arrondissement/Village': '' if pd.isna(row['II3. arrondissement/Village']) else row['II3. arrondissement/Village'],
                    'Secteur': 'N/A' if pd.isna(row['I4. Secteur']) else row['I4. Secteur'],
                    'Nom du quartier': '' if pd.isna(row['I4. Nom du quartier']) else row['I4. Nom du quartier'],
                    'Contact du répondant': 'N/A' if pd.isna(row['I7. Contact du répondant']) else int(row['I7. Contact du répondant']),
                    'État du bâtiment': 'N/A' if pd.isna(row['Q1.3. État du bâtiment']) else row['Q1.3. État du bâtiment'],
                    'Accessibilité': 'N/A' if pd.isna(row['Q1.7. Accessibilité :']) else row['Q1.7. Accessibilité :'],
                    'État': 'N/A' if pd.isna(row['Q2.2. Etat']) else row['Q2.2. Etat'],
                    'Clôture': 'N/A' if pd.isna(row['Q2.3. Clôture (les lieux sont-ils entourés de mûr, grilles, etc.)']) else row['Q2.3. Clôture (les lieux sont-ils entourés de mûr, grilles, etc.)'],
                    'Emplacement de l\’infrastructure': 'N/A' if pd.isna(row['Q2.7. Emplacement de l’infrastructures par rapport à la voie']) else row['Q2.7. Emplacement de l’infrastructures par rapport à la voie'],
                    'État de la voie': 'N/A' if pd.isna(row['Q2.8. Quel est l’état de la voie ?']) else row['Q2.8. Quel est l’état de la voie ?'],
                    'Coordonnées géographiques': {
                        'latitude': 'N/A' if pd.isna(row['_IY1. Coordonnées géographiques_latitude']) else row['_IY1. Coordonnées géographiques_latitude'],
                        'longitude': 'N/A' if pd.isna(row['_IY1. Coordonnées géographiques_longitude']) else row['_IY1. Coordonnées géographiques_longitude'],
                        'altitude': 'N/A' if pd.isna(row['_IY1. Coordonnées géographiques_altitude']) else row['_IY1. Coordonnées géographiques_altitude'],
                        'precision': 'N/A' if pd.isna(row['_IY1. Coordonnées géographiques_precision']) else row['_IY1. Coordonnées géographiques_precision']
                    }
                }
            subcategory = 'N/A' if pd.isna(row[subcategories_columnname]) else row[subcategories_columnname]

            
            criteria_regroupement = (dfc['Type'] == subcategory) & (dfc['Thematiques'] == category)
            regroupement_names = dfc[criteria_regroupement]['Regroupement'].values
            regroupement_name = category if (len(regroupement_names) < 1) else regroupement_names[0]
            if (len(regroupement_names) > 1):
                exceeds.append([index, category, subcategory, regroupement_names])

            if (dfc['Type'].isin([subcategory]).any()):
                regroupement_criteria = (dfc['Thematiques'] == category) & (dfc['Type'] == subcategory)
                regroupement_names = dfc[regroupement_criteria]['Regroupement'].values
                regroupement_name = category if (len(regroupement_names) < 1) else regroupement_names[0]
            else:
                regroupement_name = category
            

            # Recuperer le quartier
            try:
                # print('a')
                thematique = Type.objects.get(type=category, level=0)
                # print('b')
                regroupement = Type.objects.get(type=regroupement_name, parent=thematique)
                # print('c')
                typee = regroupement.get_children().filter(type=subcategory).first()
                # print('d')
                # commune_compare = pd.NA if (item['Commune'] == 'N/A') else item['Commune']
                commune = Commune.objects.get(nom_commune=item['Commune'])
                # print('e')  
                # arrondissement_compare = pd.NA if (item['Arrondissement/Village'] == 'N/A') else item['Arrondissement/Village']
                arrondissement = commune.arrondissement_set.all().filter(nom_arrondissement=item['Arrondissement/Village']).first()
                # print('f')
                # secteur_compare = pd.NA if (item['Secteur'] == 'N/A') else item['Secteur'] == 'N/A'
                secteur = arrondissement.secteur_set.all().filter(nom_secteur=item['Secteur']).first()
                # print('g')
                # quartier_compare = pd.NA if (item['Nom du quartier'] == 'N/A') else item['Nom du quartier']
                quartier = secteur.quartier_set.all().filter(nom_quartier=item['Nom du quartier']).first()
                # print('h')
                status = Status.objects.get(status=item['Statut de l\'infrastructure'])
            except Exception as e:
                print(str(e))
                # exception_type, exception_value, exception_traceback = sys.exc_info()
                # Handle the case when any of the objects are not found
                # print(f"An error occurred: {exception_type.__name__} - {exception_value}")
                # print("No corresponding Type or Quartier or Status found.")
                nom_infra = item['Nom de l\'infrastructure']
                print(f"{index+1}/{total_rows} (Error): {category} --> {regroupement_name} --> {subcategory} --> {nom_infra}")
                print(item['Commune'], item['Arrondissement/Village'], item['Secteur'], item['Nom du quartier'])
                errors.append([index, category, subcategory, item['Nom de l\'infrastructure']])
                continue

            coordinates = item['Coordonnées géographiques']
            infrastructure, created = Infrastructure.objects.get_or_create(
                nom = 'N/A' if pd.isna(row['I9. Nom de l\'infrastructure']) else row['I9. Nom de l\'infrastructure'],

                type = typee,
                quartier = quartier,
                status = status,
                    
                etat_voie = item['État de la voie'],
                emplacement = item['Emplacement de l\’infrastructure'],
                cloture = item['Clôture'],
                accessibilite = item['Accessibilité'],
                etat = item['État du bâtiment'],
                    
                latitude = coordinates['latitude'],
                longitude = coordinates['longitude'],
                altitude = coordinates['altitude'],
                precision = coordinates['precision']
            )
            print(f"{index+1}/{total_rows} : {category} --> {regroupement_name} --> {subcategory} --> {infrastructure.nom}")
        
        if (len(exceeds) > 0):
            print('Rows matching more that one regroupement:')
            print(exceeds)
            
        if(len(errors) > 0):
            print('Error rows:')
            print(errors)
                
    