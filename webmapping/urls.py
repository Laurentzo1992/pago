from  django.urls import  path
from  . import views

urlpatterns = [
    path('',  views.clone, name='clone'),
    path('clone/',  views.clone, name='clone'),
    path('api/types/', views.get_types, name='get_types'),
    path('api/locations/', views.get_locations, name='get_locations'),
    path('api/infrastructures/', views.get_infrastructures, name='get_infrastructures'),
]
