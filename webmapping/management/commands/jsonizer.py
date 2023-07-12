import pandas as pd
import json
from mptt.models import MPTTModel, TreeForeignKey
from django.core.management.base import BaseCommand, CommandError



class Command(BaseCommand):

     def add_arguments(self, parser):
        parser.add_argument("--file", required=False, type=int)
     def handle(self, **options):
        # Charger le fichier Excel dans un DataFrame
        df = pd.read_excel('webmapping/management/data.xlsx', sheet_name='BASE DES DONNEES DU PAGO')


        # Sélectionner les colonnes d'intérêt
        columns = ['I10. Statut de l\'infrastructure', 'I9. Nom de l\'infrastructure', 'I2. Commune', 'II3. arrondissement/Village',
                'I4. Secteur', 'I4. Nom du quartier', 'I7. Contact du répondant', 'Q1.3. État du bâtiment', 'Q1.7. Accessibilité :',
                'Q2.2. Etat', 'Q2.3. Clôture (les lieux sont-ils entourés de mûr, grilles, etc.)',
                'Q2.7. Emplacement de l’infrastructures par rapport à la voie', 'Q2.8. Quel est l’état de la voie ?',
                '_IY1. Coordonnées géographiques_latitude', '_IY1. Coordonnées géographiques_longitude',
                '_IY1. Coordonnées géographiques_altitude', '_IY1. Coordonnées géographiques_precision']

        # Créer une liste de catégories
        categories = df['I11. Type de l\'infrastructure'].unique().tolist()

        # Convertir les données en JSON
        data = []

        for category in categories:
            # Sélectionner les sous-catégories en fonction de la catégorie supérieure
            if category == 'INFRASTRUCTURES MARCHANDS':
                subcategories = df['Q2.1. Type d’infrastructures marchands'].unique().tolist()
                subcategories_columnname = 'Q2.1. Type d’infrastructures marchands'
            elif category == 'CIMETIRE':
                subcategories = df['Q13.1. Etat du cimetière'].unique().tolist()
                subcategories_columnname = 'Q13.1. Etat du cimetière'
            elif category == 'EAU ET ASSAINISSEMENT':
                subcategories = df['Q9.2. Quel est la nature de l’infrastructure ?'].unique().tolist()
                subcategories_columnname = 'Q9.2. Quel est la nature de l’infrastructure ?'
            elif category == 'EQUIPEMENT SOCIO CULTUREL / LOISIRS':
                subcategories = df['Q3.1. Type d’infrastructures socio culturel'].unique().tolist()
                subcategories_columnname = 'Q3.1. Type d’infrastructures socio culturel'
            elif category == 'ESPACES VERTS':
                subcategories = df['Q7.1. Types d’espaces'].unique().tolist()
                subcategories_columnname = 'Q7.1. Types d’espaces'
            elif category == 'INFRASTRUCTURES ADMINISTRATIVE':
                subcategories = df['Q8.1. Quel est le type d’infrastructure'].unique().tolist()
                subcategories_columnname = 'Q8.1. Quel est le type d’infrastructure'
            elif category == 'INFRASTRUCTURES DE CONSERVATIONS':
                subcategories = df['Q11.6. Quelle est l’utilité de l’infrastructure'].unique().tolist()
                subcategories_columnname = 'Q11.6. Quelle est l’utilité de l’infrastructure'
            elif category == 'INFRASTRUCTURES EDUCATIVES':
                subcategories = df['Q1.1. Établissement'].unique().tolist()
                subcategories_columnname = 'Q1.1. Établissement'
            elif category == 'INFRASTRUTURES TOURISTIQUES':
                subcategories = df['Q6.1. Type d’infrastructures touristiques   :'].unique().tolist()
                subcategories_columnname = 'Q6.1. Type d’infrastructures touristiques   :'
            elif category == 'INFRASTURCTURES SANITAIRES':
                subcategories = df['Q4.1. Type d’infrastructures sanitaire'].unique().tolist()
                subcategories_columnname = 'Q4.1. Type d’infrastructures sanitaire'
            elif category == 'INFRASTURCTURES SPORTIVES':
                subcategories = df['Q5.1. Type d’infrastructures sportives'].unique().tolist()
                subcategories_columnname = 'Q5.1. Type d’infrastructures sportives'
            elif category == 'LES UNITES INDUSTRIELLES ET LES USINES':
                subcategories = df['Q12.1. Quel est le type d’infrastructure'].unique().tolist()
                subcategories_columnname = 'Q12.1. Quel est le type d’infrastructure'
            elif category == 'LIEUX DE CULTE':
                subcategories = df['Q10.1.  Type du lieu de culte ?'].unique().tolist()
                subcategories_columnname = 'Q10.1.  Type du lieu de culte ?'
            else:
                subcategories = []
                subcategories_columnname = 'NaN'

            # Créer une liste d'informations pour chaque sous-catégorie
            category_data = {
                'Category': category,
                'Subcategories': []
            }
            
            for subcategory in subcategories:
                subset = df[df['I11. Type de l\'infrastructure'] == category]
                subset = subset[subset[subcategories_columnname] == subcategory]
                
                items = []
                
                for index, row in subset.iterrows():
                    item = {
                        'Statut de l\'infrastructure': 'N/A' if pd.isna(row['I10. Statut de l\'infrastructure']) else row['I10. Statut de l\'infrastructure'],
                        'Nom de l\'infrastructure': 'N/A' if pd.isna(row['I9. Nom de l\'infrastructure']) else row['I9. Nom de l\'infrastructure'],
                        'Commune': 'N/A' if pd.isna(row['I2. Commune']) else row['I2. Commune'],
                        'Arrondissement/Village': 'N/A' if pd.isna(row['II3. arrondissement/Village']) else row['II3. arrondissement/Village'],
                        'Secteur': 'N/A' if pd.isna(row['I4. Secteur']) else row['I4. Secteur'],
                        'Nom du quartier': 'N/A' if pd.isna(row['I4. Nom du quartier']) else row['I4. Nom du quartier'],
                        'Contact du répondant': 'N/A' if pd.isna(row['I7. Contact du répondant']) else int(row['I7. Contact du répondant']),
                        'État du bâtiment': 'N/A' if pd.isna(row['Q1.3. État du bâtiment']) else row['Q1.3. État du bâtiment'],
                        'Accessibilité': 'N/A' if pd.isna(row['Q1.7. Accessibilité :']) else row['Q1.7. Accessibilité :'],
                        'État': 'N/A' if pd.isna(row['Q2.2. Etat']) else row['Q2.2. Etat'],
                        'Clôture': 'N/A' if pd.isna(row['Q2.3. Clôture (les lieux sont-ils entourés de mûr, grilles, etc.)']) else row['Q2.3. Clôture (les lieux sont-ils entourés de mûr, grilles, etc.)'],
                        'Emplacement de l\’infrastructure par rapport à la voie': 'N/A' if pd.isna(row['Q2.7. Emplacement de l\’infrastructures par rapport à la voie']) else row['Q2.7. Emplacement de l\’infrastructures par rapport à la voie'],
                        'État de la voie': 'N/A' if pd.isna(row['Q2.8. Quel est l’état de la voie ?']) else row['Q2.8. Quel est l’état de la voie ?'],
                        'Coordonnées géographiques': {
                            'latitude': 'N/A' if pd.isna(row['_IY1. Coordonnées géographiques_latitude']) else row['_IY1. Coordonnées géographiques_latitude'],
                            'longitude': 'N/A' if pd.isna(row['_IY1. Coordonnées géographiques_longitude']) else row['_IY1. Coordonnées géographiques_longitude'],
                            'altitude': 'N/A' if pd.isna(row['_IY1. Coordonnées géographiques_altitude']) else row['_IY1. Coordonnées géographiques_altitude'],
                            'precision': 'N/A' if pd.isna(row['_IY1. Coordonnées géographiques_precision']) else row['_IY1. Coordonnées géographiques_precision']
                        }
                    }
                    
                    items.append(item)
                
                # Ajouter les informations à la liste des sous-catégories
                category_data['Subcategories'].append({
                    'Subcategory': subcategory,
                    'Items': items
                })
            
            # Ajouter les informations à la liste des catégories
            data.append(category_data)

        # Convertir les données en JSON
        json_data = json.dumps(data, separators=(',', ':'))

        # Écrire le JSON dans un fichier
        with open('data.json', 'w') as file:
            file.write(json_data)
            print("Output data generated: data.json")
    