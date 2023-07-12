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
        

        # Recuperer la liste de status
        statuss = df['I10. Statut de l\'infrastructure'].unique().tolist()

        # Inserer la liste des status
        for status in statuss:
            self.stdout.write(f"{status}")
            status, created = Status.objects.get_or_create(status=status)
    