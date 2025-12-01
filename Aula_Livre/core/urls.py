from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import DisciplinaViewSet
from django.views.generic import TemplateView

router = DefaultRouter()
router.register(r'disciplinas', DisciplinaViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)), 
    # Rota do Frontend (SPA)
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]