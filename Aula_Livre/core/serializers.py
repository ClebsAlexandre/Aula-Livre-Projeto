from rest_framework import serializers
from .models import Disciplina, Agendamento, Avaliacao, Professor, Aluno, Disponibilidade

class DisciplinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disciplina
        fields = ['id', 'nome', 'descricao']

class DisponibilidadeSerializer(serializers.ModelSerializer):
    # Campo extra para facilitar exibição no frontend (mostra nome em vez de ID)
    disciplina_nome = serializers.CharField(source='disciplina.nome', read_only=True)
    
    class Meta:
        model = Disponibilidade
        fields = ['id', 'professor', 'disciplina', 'disciplina_nome', 'assunto', 'nivel', 'descricao', 'link', 'data', 'horario_inicio', 'disponivel']

class ProfessorSerializer(serializers.ModelSerializer):
    disciplinas = serializers.StringRelatedField(many=True, read_only=True)
    # Traz as disponibilidades aninhadas para exibir no perfil do professor
    disponibilidades = DisponibilidadeSerializer(source='disponibilidade_set', many=True, read_only=True)
    
    class Meta:
        model = Professor
        fields = ['id', 'nome', 'email', 'senha', 'disciplinas', 'disponibilidades']
        extra_kwargs = {'senha': {'write_only': True}}

class AlunoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aluno
        fields = ['id', 'nome', 'email', 'senha']
        extra_kwargs = {'senha': {'write_only': True}}

# --- MUDANÇA: Coloquei AvaliacaoSerializer ANTES de Agendamento ---
# Isso ajuda o Python a entender a referência quando usarmos dentro do Agendamento
class AvaliacaoSerializer(serializers.ModelSerializer):
    nome_aluno = serializers.CharField(source='agendamento.aluno.nome', read_only=True)
    nome_professor = serializers.CharField(source='agendamento.disponibilidade.professor.nome', read_only=True)
    disciplina_nome = serializers.CharField(source='agendamento.disciplina.nome', read_only=True)

    class Meta:
        model = Avaliacao
        fields = ['id', 'agendamento', 'nota', 'comentario', 'criado_em', 'nome_aluno', 'nome_professor', 'disciplina_nome']

class AgendamentoSerializer(serializers.ModelSerializer):
    # Campos de leitura para exibir nomes em vez de IDs
    disciplina_nome = serializers.CharField(source='disciplina.nome', read_only=True)
    professor_nome = serializers.CharField(source='disponibilidade.professor.nome', read_only=True)
    aluno_nome = serializers.CharField(source='aluno.nome', read_only=True)
    data = serializers.DateField(source='disponibilidade.data', read_only=True)
    hora = serializers.TimeField(source='disponibilidade.horario_inicio', read_only=True)
    
    # Campo calculado para segurança do link
    link_aula = serializers.SerializerMethodField()
    
    # --- CORREÇÃO IMPORTANTE: Campo para trazer a avaliação existente ---
    avaliacao = serializers.SerializerMethodField()

    class Meta:
        model = Agendamento
        fields = ['id', 'aluno', 'disponibilidade', 'disciplina_nome', 'professor_nome', 'aluno_nome', 'data', 'hora', 'status', 'link_aula', 'avaliacao']

    # Só mostra o link se estiver CONFIRMADO ou CONCLUIDO
    def get_link_aula(self, obj):
        if obj.status == 'CONFIRMADO' or obj.status == 'CONCLUIDO':
            return obj.link
        return None

    # Verifica se já existe avaliação para este agendamento
    def get_avaliacao(self, obj):
        try:
            # Tenta acessar a relação OneToOne (agendamento.avaliacao)
            if hasattr(obj, 'avaliacao'):
                return AvaliacaoSerializer(obj.avaliacao).data
        except Exception:
            return None
        return None