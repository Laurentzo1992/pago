from django.shortcuts import render
from django.http import JsonResponse
from webmapping.models import *
from django.core.serializers import serialize
import json





def map(request):
    results = Infrastructure.objects.all() 
    results_json = json.dumps(list(results.values()))
    context = {'results_json': results_json}
    return render(request, 'webmapping/map.html', context)


def clone(request):
    results = Infrastructure.objects.all() 
    results_json = json.dumps(list(results.values()))
    context = {'results_json': results_json}
    return render(request, 'webmapping/clone.html', context)


def get_types(request):
    root_types = Type.objects.filter(parent__isnull=True)

    def build_tree(type):
        return {
            'id': type.id,
            'level': type.level,
            'name': type.type,
            'children': [build_tree(child) for child in type.children.all()]
        }

    data = [build_tree(category) for category in root_types]


    return JsonResponse(data, safe=False, content_type='application/json')

def get_locations(request):
    communes = Commune.objects.prefetch_related('arrondissement_set__secteur_set__quartier_set').all()

    # Create a list to hold the top-level JSON data (list of communes)
    json_data = []

    for commune in communes:
        commune_data = {
            'id': commune.id,
            'name': commune.nom_commune,
            'arrondissements': [],
        }

        for arrondissement in commune.arrondissement_set.all():
            arrondissement_data = {
                'id': arrondissement.id,
                'name': arrondissement.nom_arrondissement,
                'secteurs': [],
            }

            for secteur in arrondissement.secteur_set.all():
                secteur_data = {
                    'id': secteur.id,
                    'name': secteur.nom_secteur,
                    'quartiers': [],
                }

                for quartier in secteur.quartier_set.all():
                    quartier_data = {
                        'id': quartier.id,
                        'name': quartier.nom_quartier,
                    }

                    secteur_data['quartiers'].append(quartier_data)

                arrondissement_data['secteurs'].append(secteur_data)

            commune_data['arrondissements'].append(arrondissement_data)

        json_data.append(commune_data)

    # Return the JSON response
    return JsonResponse(json_data, safe=False)

def get_infrastructures(request):
    if request.method == 'GET':
        selected_types = request.GET.getlist('selected_types[]')

        # Récupérez les infrastructures liées aux catégories sélectionnées
        infrastructures = Infrastructure.objects.filter(type__in=selected_types)

        # Sérialisez les infrastructures en JSON
        infrastructure_data = list(infrastructures.values())

        # Renvoyer la réponse JSON
        return JsonResponse(infrastructure_data, safe=False)






