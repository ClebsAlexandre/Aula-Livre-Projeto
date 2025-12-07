from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated # Módulo essencial para segurança da API.
from django.contrib.auth import login, logout             
from django.shortcuts import get_object_or_404 # Útil para buscar objetos ou retornar 404 de forma concisa.

from .models import Disciplina, Agendamento, Avaliacao, Usuario, Disponibilidade, Certificado 
from .serializers import (
    DisciplinaSerializer, 
    AgendamentoSerializer, 
    AvaliacaoSerializer, 
    UsuarioSerializer, 
    DisponibilidadeSerializer
)

# --- VIEWSETS (Padrão CRUD de Modelos) ---

# ModelViewSet: Oferece endpoints automáticos para CRUD (GET, POST, PUT/PATCH, DELETE).
class DisciplinaViewSet(viewsets.ModelViewSet):
    queryset = Disciplina.objects.all()
    serializer_class = DisciplinaSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

# ViewSet de filtro especializado: Expõe apenas usuários do tipo 'PROFESSOR'.
class ProfessorViewSet(viewsets.ModelViewSet):
    # O queryset é filtrado na origem para servir a tela de 'Explorar Professores'.
    queryset = Usuario.objects.filter(tipo='PROFESSOR')
    serializer_class = UsuarioSerializer


class AlunoViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.filter(tipo='ALUNO')
    serializer_class = UsuarioSerializer
    # Regra de Segurança: Garante que apenas usuários logados possam ver dados de Alunos (privacidade).
    permission_classes = [IsAuthenticated] 


class DisponibilidadeViewSet(viewsets.ModelViewSet):
    # Usado principalmente pelo Professor para criar, listar e excluir seus horários.
    queryset = Disponibilidade.objects.all()
    serializer_class = DisponibilidadeSerializer

class AgendamentoViewSet(viewsets.ModelViewSet):
    queryset = Agendamento.objects.all()
    serializer_class = AgendamentoSerializer
    # Regra de Segurança: Todas as operações de agendamento exigem login.
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Otimização de Performance e Filtragem para Dashboards.
        # Permite que o frontend solicite apenas os agendamentos relevantes (do aluno logado OU do professor logado).
        queryset = Agendamento.objects.all()
        aluno_id = self.request.query_params.get('aluno_id')
        prof_id = self.request.query_params.get('professor_id')
        
        if aluno_id:
            # Filtro para o Dashboard do Aluno: Mostra apenas suas aulas.
            queryset = queryset.filter(aluno_id=aluno_id)
        if prof_id:
            # Filtro para o Dashboard do Professor: Mostra aulas agendadas em suas disponibilidades.
            queryset = queryset.filter(disponibilidade__professor_id=prof_id)
            
        return queryset

class AvaliacaoViewSet(viewsets.ModelViewSet):
    queryset = Avaliacao.objects.all()
    serializer_class = AvaliacaoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Intercepta o salvamento para definir automaticamente quem está avaliando (ALUNO ou PROFESSOR)
        # baseado no usuário logado. Isso impede que o sistema use o valor padrão 'ALUNO' incorretamente.
        serializer.save(tipo_avaliador=self.request.user.tipo)

# --- VIEWS DE AUTENTICAÇÃO E CADASTRO (Funções Decoradas) ---

@api_view(['POST'])
def cadastro_usuario(request):
    # View de criação de conta. O Serializer é responsável por validar os dados e fazer o hashing da senha (segurança).
    serializer = UsuarioSerializer(data=request.data)
        
    if serializer.is_valid():
        user = serializer.save()
        
        # Cria a sessão imediatamente após o registro para evitar erro 403 no primeiro uso.
        login(request, user)

        # Retornamos apenas os dados não sensíveis do usuário para o frontend, facilitando a gestão de estado.
        return Response({
            'id': user.id,
            'nome': user.nome,
            'email': user.email,
            'tipo': user.tipo
        }, status=status.HTTP_201_CREATED)
        
    # Erro de validação (ex: e-mail já existe, senha fraca).
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_usuario(request):
    # View customizada para autenticação baseada em e-mail e senha.
    email = request.data.get('email')
    senha = request.data.get('senha')
    
    try:
        user = Usuario.objects.get(email=email)
        
        # 1. Checagem de Credenciais (usa a função segura check_password do Django).
        if user.check_password(senha):
            # 2. Autenticação de Sessão: Cria a sessão do Django, essencial para manter o estado do login (cookies CSRF, etc.).
            login(request, user) 
            return Response({
                'id': user.id,
                'nome': user.nome,
                'email': user.email,
                'tipo': user.tipo
            })
        else:
            return Response({'detail': 'Senha incorreta.'}, status=status.HTTP_401_UNAUTHORIZED)
            
    except Usuario.DoesNotExist:
        return Response({'detail': 'Usuário não encontrado.'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def logout_usuario(request):
    # Simplesmente encerra a sessão do Django no servidor.
    logout(request)
    return Response({'detail': 'Logout realizado com sucesso.'}, status=status.HTTP_200_OK)


# --- VIEW DE CONFIRMAÇÃO DO CERTIFICADO (Decisão Arquitetural) ---
@api_view(['GET'])
def download_certificado(request, agendamento_id):
    """
    Decisão: Centralizamos a criação do registro de Certificado no DB (backend) 
    e deixamos a visualização/impressão (frontend) como responsabilidade do HTML/CSS, 
    simplificando o desenvolvimento (evitando bibliotecas de PDF).
    """
    # 1. GATES DE SEGURANÇA E PERMISSÃO:
    if not request.user.is_authenticated:
        return Response({'detail': 'Autenticação necessária.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # 2. BUSCA E VALIDAÇÃO DE ESTADO
    try:
        agendamento = get_object_or_404(Agendamento, pk=agendamento_id)
    except Exception:
        return Response({'detail': 'Agendamento não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    # Regra: Só pode emitir se a aula CONCLUÍDA e se o usuário logado for o ALUNO.
    if agendamento.status != 'CONCLUIDO' or agendamento.aluno != request.user:
           return Response({'detail': 'Acesso negado ou aula não concluída.'}, status=status.HTTP_403_FORBIDDEN)
    
    # 3. CRIAÇÃO DE REGISTRO (get_or_create)
    data_aula = agendamento.disponibilidade.data
    
    # get_or_create: Garante que não haverá duplicidade de certificados para o mesmo agendamento.
    codigo_default = f'AL-{agendamento_id}-{data_aula.strftime("%Y%m%d")}'
    certificado, criado = Certificado.objects.get_or_create(
        agendamento=agendamento,
        defaults={'codigo_validacao': codigo_default}
    )

    # 4. CONTEXTO DE RETORNO (para fins de debug/confirmação)
    context = {
        'nome_pessoa': agendamento.aluno.nome,
        'materia': agendamento.disponibilidade.disciplina.nome if agendamento.disponibilidade.disciplina else 'Tira-Dúvidas',
        'professor': agendamento.disponibilidade.professor.nome,
        'data_emissao': certificado.data_emissao.strftime('%d/%m/%Y'),
        'horas': certificado.horas,
        'codigo': certificado.codigo_validacao,
    }

    # 5. RESPOSTA: Indica sucesso e informa que a visualização é responsabilidade do cliente.
    return Response({
        'detail': 'Certificado registrado com sucesso. Use a função de impressão do navegador.',
        'dados': context
    }, status=status.HTTP_200_OK)