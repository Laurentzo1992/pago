from django.shortcuts import redirect, render
from django.contrib import messages
from webmapping.models import Type







def maping(request):
    return render(request, 'webmapping/home/home.html')


