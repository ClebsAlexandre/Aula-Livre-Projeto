from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Disciplina, Agendamento, Avaliacao, Professor, Aluno, Disponibilidade
from .serializers import (
    DisciplinaSerializer, AgendamentoSerializer, AvaliacaoSerializer, 
    ProfessorSerializer, AlunoSerializer, DisponibilidadeSerializer
)

# --- VIEWS DE API (CRUD) ---

class DisciplinaViewSet(viewsets.ModelViewSet):
    queryset = Disciplina.objects.all()
    serializer_class = DisciplinaSerializer

class ProfessorViewSet(viewsets.ModelViewSet):
    queryset = Professor.objects.all()
    serializer_class = ProfessorSerializer

class AgendamentoViewSet(viewsets.ModelViewSet):
    queryset = Agendamento.objects.all()
    serializer_class = AgendamentoSerializer
    
    # Permite filtrar agendamentos por aluno ou professor via URL
    # Ex: /api/agendamentos/?aluno_id=1
    def get_queryset(self):
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

# --- VIEWS DE AUTENTICAÇÃO (CUSTOMIZADA) ---

@api_view(['POST'])
def cadastro_usuario(request):
    tipo = request.data.get('tipo')
    
    # Prepara os dados para o serializer correto
    if tipo == 'professor':
        serializer = ProfessorSerializer(data=request.data)
    else:
        serializer = AlunoSerializer(data=request.data)
        
    if serializer.is_valid():
        # OBS: Em produção, você DEVE criptografar a senha (hash) aqui.
        # Por enquanto, salvaremos direto para funcionar com seu model atual.
        user = serializer.save(senha=request.data.get('senha'))
        
        return Response({
            'id': user.id,
            'nome': user.nome,
            'email': user.email,
            'tipo': tipo
        }, status=status.HTTP_201_CREATED)
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_usuario(request):
    email = request.data.get('email')
    senha = request.data.get('senha')
    
    # Tenta achar como Professor
    try:
        prof = Professor.objects.get(email=email, senha=senha)
        return Response({
            'id': prof.id,
            'nome': prof.nome,
            'email': prof.email,
            'tipo': 'professor'
        })
    except Professor.DoesNotExist:
        pass

    # Se não achou, tenta como Aluno
    try:
        aluno = Aluno.objects.get(email=email, senha=senha)
        return Response({
            'id': aluno.id,
            'nome': aluno.nome,
            'email': aluno.email,
            'tipo': 'aluno'
        })
    except Aluno.DoesNotExist:
        pass
        
    return Response({'detail': 'Credenciais inválidas.'}, status=status.HTTP_401_UNAUTHORIZED)

