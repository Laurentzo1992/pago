from django.shortcuts import render
from django.http import JsonResponse
from webmapping.models import *
import json





def map(request):
    results = Infrastructure.objects.all() 
    results_json = json.dumps(list(results.values()))
    context = {'results_json': results_json}
    return render(request, 'webmapping/map.html', context)






