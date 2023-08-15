from django.shortcuts import render
from django.http import JsonResponse
from webmapping.models import *
from django.core.serializers import serialize
import json
from django.core.paginator import Paginator





def map(request):
    results = Infrastructure.objects.all() 
    results_json = json.dumps(list(results.values()))
    context = {'results_json': results_json}
    return render(request, 'webmapping/map.html', context)


def clone(request):
    #results = Infrastructure.objects.all() 
    #results_json = json.dumps(list(results.values()))
    guide = Guide.objects.all()
    context = {"guide":guide}
    return render(request, 'webmapping/clone.html', context)    


def get_types(request):
    root_types = Type.objects.filter(parent__isnull=True)

    def build_tree(type):
        legend = Legend.objects.filter(type=type).first()
        if legend:
            legend_data = {'description': legend.description, 'image': legend.image.url}
        else:
            legend_data = None

        return {
            'id': type.id,
            'level': type.level,
            'name': type.type,
            'legend': legend_data,  # Include legends data for the type
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
    #print(communes)
    return JsonResponse(json_data, safe=False)

""" def get_infrastructures(request):
    if request.method == 'GET':
        selected_types = request.GET.getlist('selected_types[]')
        #print(selected_types)

        selected_quariters = request.GET.getlist('selected_locations[]')

        # Récupérez les infrastructures liées aux catégories sélectionnées
        if(len(selected_types) > 0):
            infrastructures = Infrastructure.objects.filter(type__in=selected_types)
        else:
            infrastructures = Infrastructure.objects.filter()

        # Sérialisez les infrastructures en JSON
        infrastructure_data = list(infrastructures.values())

        # Renvoyer la réponse JSON
        #print(infrastructure_data)
        return JsonResponse(infrastructure_data, safe=False) """

def get_infrastructures(request):
    data = json.loads(request.body.decode('utf-8'))

    selected_types = data.get('selected_types', [])
    selected_quarters = data.get('selected_quarters', [])

    # Check if both selected_types and selected_quarters are empty
    if not selected_types and not selected_quarters:
        # Return an empty JSON response
        return JsonResponse([], safe=False)

    # Query infrastructures based on selected types
    if selected_types:
        infrastructures = Infrastructure.objects.filter(type__in=selected_types)
    else:
        infrastructures = Infrastructure.objects.all()

    # If selected_quarters contains values, filter by quarters
    if selected_quarters:
        infrastructures = infrastructures.filter(quartier__in=selected_quarters)

    # Serialize infrastructures to JSON
    infrastructure_data = list(infrastructures.values())

    # Return JSON response
    return JsonResponse(infrastructure_data, safe=False)


def get_paginated_infrastructures(request):
    data = json.loads(request.body.decode('utf-8'))

    selected_types = data.get('selected_types', [])
    selected_quarters = data.get('selected_quarters', [])

    # Query infrastructures based on selected types
    if selected_types:
        infrastructures = Infrastructure.objects.filter(type__in=selected_types)
    else:
        infrastructures = Infrastructure.objects.all()

    # If selected_quarters contains values, filter by quarters
    if selected_quarters:
        infrastructures = infrastructures.filter(quartier__in=selected_quarters)

    # Paginate the data
    paginator = Paginator(infrastructures, 10)  # Change '10' to the desired number of items per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    # Serialize paginated data to JSON
    infrastructure_data = list(page_obj.object_list.values())

    # Return JSON response with pagination details
    return JsonResponse({
        'data': infrastructure_data,
        'total_items': paginator.count,
        'page': page_obj.number,
        'pages': paginator.num_pages,
    })
    
    
    
    
    







