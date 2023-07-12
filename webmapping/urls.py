from  django.urls import  path
from  . import views

urlpatterns = [
    path('',  views.map, name='map'),
    path('login', views.login, name='login'),
    path('', views.maping, name='maping'),
   # path('login', views.login, name='login'),
    #path('', views.maping, name='maping'),
]
