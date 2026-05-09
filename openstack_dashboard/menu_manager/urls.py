from django.urls import path
from . import views

app_name = 'menu_manager'

urlpatterns = [
    path('', views.index, name='index'),
    path('update/', views.update, name='update'),
]
