from rest_framework import serializers
from .models import Disciplina, Agendamento, Avaliacao, Professor, Aluno, Disponibilidade

class DisciplinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disciplina
        fields = ['id', 'nome', 'descricao']

class ProfessorSerializer(serializers.ModelSerializer):
    disciplinas = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = Professor
        fields = ['id', 'nome', 'email', 'disciplinas']

class DisponibilidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disponibilidade
        fields = '__all__'

class AlunoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aluno
        fields = ['id', 'nome', 'email']

class AgendamentoSerializer(serializers.ModelSerializer):
    disciplina_nome = serializers.CharField(source='disciplina.nome', read_only=True)
    professor_nome = serializers.CharField(source='disponibilidade.professor.nome', read_only=True)
    aluno_nome = serializers.CharField(source='aluno.nome', read_only=True)
    data = serializers.DateField(source='disponibilidade.data', read_only=True)
    hora = serializers.TimeField(source='disponibilidade.horario_inicio', read_only=True)

    class Meta:
        model = Agendamento
        fields = ['id', 'aluno', 'disponibilidade', 'disciplina', 'link', 'status', 
                  'disciplina_nome', 'professor_nome', 'aluno_nome', 'data', 'hora']

class AvaliacaoSerializer(serializers.ModelSerializer):
    nome_aluno = serializers.CharField(source='agendamento.aluno.nome', read_only=True)
    nome_professor = serializers.CharField(source='agendamento.disponibilidade.professor.nome', read_only=True)
    disciplina_nome = serializers.CharField(source='agendamento.disciplina.nome', read_only=True)

    class Meta:
        model = Avaliacao
        fields = ['id', 'agendamento', 'nota', 'comentario', 'criado_em', 'nome_aluno', 'nome_professor', 'disciplina_nome']