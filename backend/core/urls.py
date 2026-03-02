from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, ConstitutionViewSet, DrugAnalysisViewSet, AcupointViewSet

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'constitution', ConstitutionViewSet, basename='constitution')
router.register(r'drugs', DrugAnalysisViewSet, basename='drugs')
router.register(r'acupoints', AcupointViewSet, basename='acupoints')

urlpatterns = [
    path('', include(router.urls)),
]
