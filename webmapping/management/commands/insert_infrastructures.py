import pandas as pd
import json
from mptt.models import MPTTModel, TreeForeignKey
from django.core.management.base import BaseCommand, CommandError
from webmapping.models import *



class Command(BaseCommand):

     def add_arguments(self, parser):
        parser.add_argument("--file", required=False, type=int)
     def handle(self, **options):
        # Charger le fichier Excel dans un DataFrame
        df = pd.read_excel('webmapping/management/data.xlsx', sheet_name='BASE DES DONNEES DU PAGO')
        dfc = pd.read_excel("webmapping/management/Categories.xlsx", sheet_name='data')
        

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


            for index, row in df.iterrows():
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
                        'Emplacement de l\’infrastructure par rapport à la voie': 'N/A' if pd.isna(row['Q2.7. Emplacement de l’infrastructures par rapport à la voie']) else row['Q2.7. Emplacement de l’infrastructures par rapport à la voie'],
                        'État de la voie': 'N/A' if pd.isna(row['Q2.8. Quel est l’état de la voie ?']) else row['Q2.8. Quel est l’état de la voie ?'],
                        'Coordonnées géographiques': {
                            'latitude': 'N/A' if pd.isna(row['_IY1. Coordonnées géographiques_latitude']) else row['_IY1. Coordonnées géographiques_latitude'],
                            'longitude': 'N/A' if pd.isna(row['_IY1. Coordonnées géographiques_longitude']) else row['_IY1. Coordonnées géographiques_longitude'],
                            'altitude': 'N/A' if pd.isna(row['_IY1. Coordonnées géographiques_altitude']) else row['_IY1. Coordonnées géographiques_altitude'],
                            'precision': 'N/A' if pd.isna(row['_IY1. Coordonnées géographiques_precision']) else row['_IY1. Coordonnées géographiques_precision']
                        }
                    }

                Commune_name = row['I2. Commune']
                arrondissement_name = row['II3. arrondissement/Village']
                secteur_name = row['I4. Secteur']
                quartier_name = row['I4. Nom du quartier']


                

                # Recuperer le quartier
                try:
                    thematique = Type.objects.get(type=category, level=0)
                    regroupement = Type.objects.get(type=item[subcategories_columnname], parent=thematique)
                    type = Type.objects.get(type=category, parent=regroupement)
                    
                    commune = Commune.objects.get(nom_commune=item['I2. Commune'])
                    arrondissement = Arrondissement.objects.get(commune=commune, nom_arrondissement=item['II3. arrondissement/Village'])
                    secteur = Secteur.objects.get(arrondissement=arrondissement, nom_secteur=item['I4. Secteur'])
                    quartier = Quartier.objects.get(secteur=secteur, nom_quartier=item['I4. Nom du quartier'])

                    status = Status.objects.get(satus=item['I10. Statut de l\'infrastructure'])
                except (
                    Commune.DoesNotExist, Arrondissement.DoesNotExist,
                    Secteur.DoesNotExist, Quartier.DoesNotExist,
                    Type.DoesNotExist, Status.DoesNotExist
                ):
                    # Handle the case when any of the objects are not found
                    print("No corresponding Type or Quartier or Status found.")
                    exit(1)

                infrastructure, created = Infrastructure.objects.get_or_create(
                    nom = 'N/A' if pd.isna(row['I9. Nom de l\'infrastructure']) else row['I9. Nom de l\'infrastructure'],
    
                    type = type,
                    quartier = quartier,
                    status = item['I10. Statut de l\'infrastructure'],
                    repondant = None,
                        
                    etat_voie = item['Q2.8. Quel est l’état de la voie ?'],
                    emplacement = item['Q2.7. Emplacement de l’infrastructures par rapport à la voie'],
                    cloture = item['Q2.3. Clôture (les lieux sont-ils entourés de mûr, grilles, etc.)'],
                    accessibilite = item['Q1.7. Accessibilité :'],
                    etat = item['Q1.3. État du bâtiment'],
                        
                    latitude = row['_IY1. Coordonnées géographiques_latitude'],
                    longitude = item['_IY1. Coordonnées géographiques_longitude'],
                    altitude = item['_IY1. Coordonnées géographiques_altitude'],
                    precision = item['_IY1. Coordonnées géographiques_precision']
                )
                
    