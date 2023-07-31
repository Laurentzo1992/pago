from django.contrib import admin
from .models import *
from mptt.admin import DraggableMPTTAdmin
from mptt.admin import MPTTModelAdmin
from mptt.admin import TreeRelatedFieldListFilter
from django.urls import reverse
from django.utils.html import format_html


""" admin.site.register(
    Type,
    DraggableMPTTAdmin,
    list_display=(
        'tree_actions',
        'indented_title',
        # ...more fields if you feel like it...
    ),
    list_display_links=(
        'indented_title',
    ),
) """
admin.site.register(Commune)
#admin.site.register(Infrastructure)
admin.site.register(Arrondissement)
# admin.site.register(Secteur)
admin.site.register(Quartier)
admin.site.register(Status)
admin.site.register(Guide)




admin.site.register(
    Type,
    DraggableMPTTAdmin,
    list_display=(
        'tree_actions',
        'indented_title',
        
    ),
    list_display_links=(
        'indented_title',
    ),
)


class InfrastructureAdmin(admin.ModelAdmin):
    list_display = ["nom", "type", "quartier", "status"]
    list_per_page = 10
    
    def change_view(self, request, object_id, form_url='', extra_context=None):
        # Récupérer l'URL vers la page souhaitée
        url = reverse('map')

        # Créer un lien HTML vers l'URL
        link = format_html('<a href="{}">Lien vers la page</a>', url)

        # Ajouter le lien à l'extra_context pour l'affichage dans le template
        extra_context = extra_context or {}
        extra_context['custom_link'] = link

        return super().change_view(request, object_id, form_url, extra_context=extra_context)


admin.site.register(Infrastructure, InfrastructureAdmin)

class SecteurAdmin(admin.ModelAdmin):
    list_display = ["nom_secteur", "arrondissement"]
    list_per_page = 10

admin.site.register(Secteur, SecteurAdmin)

