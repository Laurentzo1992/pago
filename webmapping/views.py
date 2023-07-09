from django.shortcuts import render




def login(request):
    return render(request, 'webmapping/login.html')





def home(request):
    return render(request, 'webmapping/home/home.html')
