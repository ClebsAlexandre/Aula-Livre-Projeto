from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import (
    DisciplinaViewSet, AgendamentoViewSet, AvaliacaoViewSet, 
    ProfessorViewSet, login_usuario, cadastro_usuario
)
from django.views.generic import TemplateView

router = DefaultRouter()
router.register(r'disciplinas', DisciplinaViewSet)
router.register(r'agendamentos', AgendamentoViewSet)
router.register(r'avaliacoes', AvaliacaoViewSet)
router.register(r'professores', ProfessorViewSet)

urlpatterns = [
    # Rotas da API
    path('api/', include(router.urls)),
    path('api/login/', login_usuario, name='api_login'),
    path('api/cadastro/', cadastro_usuario, name='api_cadastro'),

    # Rota do Frontend (SPA)
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]
