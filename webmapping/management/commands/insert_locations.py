import pandas as pd
from mptt.models import MPTTModel, TreeForeignKey, TreeManager
from django.core.management.base import BaseCommand, CommandError
from webmapping.models import *


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("--file", required=False, type=int)

    def handle(self, **options):
        print('Inserting locations...')
        # Charger le fichier Excel dans un DataFrame
        df = pd.read_excel("webmapping/management/data.xlsx", sheet_name='BASE DES DONNEES DU PAGO')

        communes = df['I2. Commune'].fillna('').unique().tolist()
        for commune in communes:
           
            criteria_1 = df['I2. Commune'].fillna('') == commune
            arr_vills = df[criteria_1]['II3. arrondissement/Village'].fillna('').unique().tolist()
            
            c, created = Commune.objects.get_or_create(nom_commune=commune)
            self.stdout.write(f"{commune}")
            
            for arr_vill in arr_vills:
                
                crieteria_2 = criteria_1 & (df['II3. arrondissement/Village'].fillna('') == arr_vill)
                secteurs = df[crieteria_2]['I4. Secteur'].fillna('N/A').unique().tolist()
                
                a, created = Arrondissement.objects.get_or_create(nom_arrondissement=arr_vill, commune=c)

                self.stdout.write(f"  - {arr_vill}")

                for secteur in secteurs:
                    
                    criteria = crieteria_2 & (df['I4. Secteur'].fillna('N/A') == secteur)
                    quartiers = df[criteria]['I4. Nom du quartier'].fillna('').unique().tolist()
                    
                    
                    s, created = Secteur.objects.get_or_create(nom_secteur=secteur, arrondissement=a)
                    
                    self.stdout.write(f"    - {secteur}")

                    for quartier in quartiers:
                        q, created = Quartier.objects.get_or_create(nom_quartier=quartier, secteur=s)
                        
                        self.stdout.write(f"      - {quartier}")
                    

