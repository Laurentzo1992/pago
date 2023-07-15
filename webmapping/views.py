from django.shortcuts import render





def map(request):
    return render(request, 'webmapping/map.html')



