from Aula_Livre.core.utils import set_hashed_password
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
<<<<<<< HEAD
from .models import Disciplina, Agendamento, Avaliacao, Usuario, Disponibilidade
=======
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import login, authenticate, logout
from .models import Disciplina, Agendamento, Avaliacao, Professor, Aluno, Disponibilidade
>>>>>>> 43c824c (Implementação de Segurança)
from .serializers import (
    DisciplinaSerializer, 
    AgendamentoSerializer, 
    AvaliacaoSerializer, 
    UsuarioSerializer, 
    DisponibilidadeSerializer
)

# ViewSet para Gerenciar Disciplinas (Aqui você cria: Matemática, História, etc.)
class DisciplinaViewSet(viewsets.ModelViewSet):
    queryset = Disciplina.objects.all()
    serializer_class = DisciplinaSerializer

<<<<<<< HEAD
# ViewSet genérico para Usuários (Admins, Alunos e Professores)
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

# ViewSet específico para listar apenas Professores
class ProfessorViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.filter(tipo='PROFESSOR')
    serializer_class = UsuarioSerializer
=======
class ProfessorViewSet(viewsets.ModelViewSet):
    queryset = Professor.objects.all()
    serializer_class = ProfessorSerializer
    permission_classes = [IsAuthenticated]
>>>>>>> 43c824c (Implementação de Segurança)

class DisponibilidadeViewSet(viewsets.ModelViewSet):
    queryset = Disponibilidade.objects.all()
    serializer_class = DisponibilidadeSerializer

class AgendamentoViewSet(viewsets.ModelViewSet):
    queryset = Agendamento.objects.all()
    serializer_class = AgendamentoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Permite filtrar agendamentos por aluno ou professor via URL
        Ex: /api/agendamentos/?aluno_id=1
        """
        queryset = Agendamento.objects.all()
        aluno_id = self.request.query_params.get('aluno_id')
        prof_id = self.request.query_params.get('professor_id')
        
        if aluno_id:
            queryset = queryset.filter(aluno_id=aluno_id)
        if prof_id:
            queryset = queryset.filter(disponibilidade__professor_id=prof_id)
            
        return queryset

class AvaliacaoViewSet(viewsets.ModelViewSet):
    queryset = Avaliacao.objects.all()
    serializer_class = AvaliacaoSerializer
    permission_classes = [IsAuthenticated]

    #NOVO: ViewSet para gerenciar Alunos
class AlunoViewSet(viewsets.ModelViewSet):
    queryset = Aluno.objects.all()
    serializer_class = AlunoSerializer
    permission_classes = [IsAuthenticated]

# --- VIEWS DE AUTENTICAÇÃO E CADASTRO ---

@api_view(['POST'])
def cadastro_usuario(request):
<<<<<<< HEAD
    """
    Endpoint dedicado ao cadastro (Signup).
    Usa o UsuarioSerializer corrigido para tratar a senha.
    """
    serializer = UsuarioSerializer(data=request.data)
        
    if serializer.is_valid():
        # O método .save() vai chamar o create() do Serializer, 
        # que agora criptografa a senha corretamente.
        user = serializer.save()
=======
    tipo = request.data.get('tipo')
    raw_password = request.data.get('senha')

    # Prepara os dados: É crucial remover a senha em texto puro antes 
    # de passar para o Serializer
    data_without_password = request.data.copy()
    if 'senha' in data_without_password:
        del data_without_password['senha']

    if tipo == 'professor':
        serializer = ProfessorSerializer(data=data_without_password)
    else:
        serializer = AlunoSerializer(data=data_without_password)

    # Prepara os dados para o serializer correto
    if tipo == 'professor':
        serializer = ProfessorSerializer(data=request.data)
    else:
        serializer = AlunoSerializer(data=request.data)
        
    if serializer.is_valid():
        user = serializer.save()
        set_hashed_password(user, request.data.get('senha'))

    if raw_password:
        user.set_password(raw_password)
>>>>>>> 43c824c (Implementação de Segurança)
        
        return Response({
            'id': user.id,
            'nome': user.nome,
            'email': user.email,
            'tipo': user.tipo
        }, status=status.HTTP_201_CREATED)
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_usuario(request):
    """
    Endpoint simples de Login.
    """
    email = request.data.get('email')
    senha = request.data.get('senha')
    user = authenticate(request, email=email, senha=senha)
    
<<<<<<< HEAD
    try:
        user = Usuario.objects.get(email=email)
        # check_password funciona porque usamos set_password no cadastro
        if user.check_password(senha):
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
=======
    if user is not None:
        login(request,user)
        tipo = 'professor' if hasattr(user, 'professor_id') else 'aluno'

        return Response({
            'id': user.id,
            'nome': user.nome,
            'email': user.email,
            'tipo': tipo
        }, status=status.HTTP_200_OK)
    else:
        return Response(
            {'detail': 'Credenciais inválidas ou conta não encontrada.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
     
@api_view(['POST'])
def logout_usuario(request):
    if request.user.is_authenticated:
        logout(request)
        return Response({'detail': 'Logout realizado com sucesso. Sessão encerrada.'}, 
                        status=status.HTTP_200_OK)
    
    return Response({'detail': 'Nenhum usuário estava logado para fazer logout.'}, 
                    status=status.HTTP_400_BAD_REQUEST)

    # Tenta achar como Professor
    #try:
    #   prof = Professor.objects.get(email=email, senha=senha)
    #    return Response({
    #        'id': prof.id,
    #        'nome': prof.nome,
    #        'email': prof.email,
    #        'tipo': 'professor'
    #    })
    #except Professor.DoesNotExist:
    #    pass

    # Se não achou, tenta como Aluno
    #try:
    #    aluno = Aluno.objects.get(email=email, senha=senha)
    #    return Response({
    #        'id': aluno.id,
    #        'nome': aluno.nome,
    #        'email': aluno.email,
    #        'tipo': 'aluno'
    #    })
    #except Aluno.DoesNotExist:
    #    pass
    #return Response({'detail': 'Credenciais inválidas.'}, status=status.HTTP_401_UNAUTHORIZED)

    #DÚVIDA: Após ter mexido em alguns códigos acima, toda esta linha ficou quase apagada, 
    # como se não fosse "necessária" mais, pois creio que o IF da linha 95 substituiu todo este código, 
    # mas por via das dúvidas, deixei ele comentado invés de apagar. 
>>>>>>> 43c824c (Implementação de Segurança)
