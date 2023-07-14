from django.contrib import admin
from .models import *
from django.contrib import admin
from mptt.admin import DraggableMPTTAdmin
from django.contrib import admin
from mptt.admin import MPTTModelAdmin
from mptt.admin import DraggableMPTTAdmin


from mptt.admin import TreeRelatedFieldListFilter

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
admin.site.register(Infrastructure)
admin.site.register(Arrondissement)
admin.site.register(Secteur)
admin.site.register(Quartier)
admin.site.register(Status)

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



