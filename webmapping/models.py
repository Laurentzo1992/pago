from django.db import models
from mptt.models import MPTTModel, TreeForeignKey

class Commune(models.Model):
    nom_commune = models.CharField(max_length=30, null=True, blank=True, verbose_name='Nom de la Commune')
    
    
    def __str__(self):
        return self.nom_commune
    
    
    
class Arrondissement(models.Model):
    nom_arrondissement = models.CharField(max_length=30, null=True, blank=True, verbose_name="Nom de l\'Arrondissement")
    commune = models.ForeignKey(Commune, null=True, blank=True, on_delete=models.CASCADE, verbose_name='Nom de la Commune')
    
    
    def __str__(self):
        return self.nom_arrondissement
    
    
    
class Secteur(models.Model):
    nom_secteur = models.CharField(max_length=30, null=True, blank=True, verbose_name="Nom du Secteur")
    arrondissement = models.ForeignKey(Arrondissement, null=True, blank=True, on_delete=models.CASCADE, verbose_name="Nom de l\'Arrondissement")
    
    
    def __str__(self):
        return self.nom_secteur
    
    


class Quartier(models.Model):
    nom_quartier = models.CharField(max_length=30, null=True, blank=True, verbose_name="Nom du Quartier")
    secteur = models.ForeignKey(Secteur, null=True, blank=True, on_delete=models.CASCADE, verbose_name="Nom du Secteur")
   
    
    
    def __str__(self):
        return self.nom_quartier
    
    


class Type(MPTTModel):
    type = models.CharField(max_length=60, null=True, blank=True, unique=True, verbose_name="Type Infrastructure")
    parent = TreeForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    
    class MPTTMeta:
        order_insertion_by = ['type']
    
    def __str__(self):
        return self.type
    
    
    
    
class Status(models.Model):
    status = models.CharField(max_length=30, null=True, blank=True, verbose_name="Status Infrastructure")
    
    
    def __str__(self):
        return self.status
    
    
    
    
class Infrastructure(models.Model):
    infrastructure = models.CharField(max_length=30, null=True, blank=True, verbose_name="Infrastructure")
    type = models.ForeignKey(Type, null=True, blank=True, on_delete=models.CASCADE, verbose_name="Type d\'infrastructure")
    status = models.ForeignKey(Status, null=True, blank=True, on_delete=models.CASCADE, verbose_name="Status de  l\'infrastructure")
   
   
    
    
    def __str__(self):
        return self.infrastructure 
