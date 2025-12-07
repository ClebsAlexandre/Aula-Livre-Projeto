from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import (
    DisciplinaViewSet, AgendamentoViewSet, AvaliacaoViewSet, 
    ProfessorViewSet, DisponibilidadeViewSet, 
    UsuarioViewSet, AlunoViewSet, 
    login_usuario, cadastro_usuario, logout_usuario,
    download_certificado  # <--- ADICIONADO AQUI
)
from django.views.generic import TemplateView

router = DefaultRouter()

# Rotas simples (Modelos únicos)
router.register(r'disciplinas', DisciplinaViewSet)
router.register(r'agendamentos', AgendamentoViewSet)
router.register(r'avaliacoes', AvaliacaoViewSet)
router.register(r'disponibilidades', DisponibilidadeViewSet)


# Como todos usam o modelo 'Usuario', precisamos dar 'basenames' diferentes:
router.register(r'professores', ProfessorViewSet, basename='professor')
router.register(r'alunos', AlunoViewSet, basename='aluno')
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

urlpatterns = [
    path('api/', include(router.urls)),
    
    # Autenticação
    path('api/login/', login_usuario, name='api_login'),
    path('api/cadastro/', cadastro_usuario, name='api_cadastro'),
    path('api/logout/', logout_usuario, name='api_logout'),

    # Certificado (Nova Rota)
    path('api/certificado/<int:agendamento_id>/download/', download_certificado, name='api_certificado'),
    
    # Frontend
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]