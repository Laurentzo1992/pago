from  django.urls import  path
from  . import views

urlpatterns = [
    path('map',  views.map, name='map'),
    path('',  views.clone, name='clone'),
    path('api/types/', views.get_types, name='get_types'),
    path('api/locations/', views.get_locations, name='get_locations'),
    path('api/infrastructures/', views.get_infrastructures, name='get_infrastructures'),
]
