from django.shortcuts import redirect, render
from django.contrib import messages
from webmapping.models import Type


<<<<<<< HEAD
def home(request):
    return render(request, 'webmapping/home/home.html')

def map(request):
    return render(request, 'webmapping/map.html')
=======





def maping(request):
    return render(request, 'webmapping/home/home.html')


>>>>>>> niklacode
