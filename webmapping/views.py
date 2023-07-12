from django.shortcuts import redirect, render
from django.contrib import messages
from webmapping.models import Type



def map(request):
    return render(request, 'webmapping/map.html')



