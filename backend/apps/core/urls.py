
from django.urls import path
from .views import InstitutionProfileView

urlpatterns = [
    path('institution/profile/', InstitutionProfileView.as_view(), name='institution-profile'),
]
