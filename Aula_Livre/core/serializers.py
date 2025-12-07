from rest_framework import serializers
from .models import Disciplina, Agendamento, Avaliacao, Usuario, Disponibilidade

class DisciplinaSerializer(serializers.ModelSerializer):
    # Serializer padrão para CRUD básico de Disciplinas.
    class Meta:
        model = Disciplina
        fields = ['id', 'nome', 'descricao']

class DisponibilidadeSerializer(serializers.ModelSerializer):
    # Otimização de Leitura: Usa 'source' para aninhar nomes de modelos relacionados (Professor/Disciplina).
    # Isso permite ao frontend exibir os nomes sem fazer requisições HTTP extras.
    disciplina_nome = serializers.CharField(source='disciplina.nome', read_only=True)
    professor_nome = serializers.CharField(source='professor.nome', read_only=True)
    
    class Meta:
        model = Disponibilidade
        fields = ['id', 'professor', 'professor_nome', 'disciplina', 'disciplina_nome', 'assunto', 'nivel', 'descricao', 'link', 'data', 'horario_inicio', 'disponivel']

class UsuarioSerializer(serializers.ModelSerializer):
    # Aninhamento de Relacionamentos: Reduz o número de chamadas da API no Dashboard/Explorar.
    disciplinas = serializers.StringRelatedField(many=True, read_only=True)
    disponibilidades = DisponibilidadeSerializer(source='disponibilidade_set', many=True, read_only=True)
    
    # REGRA DE SEGURANÇA CRÍTICA: 'write_only=True' garante que a senha seja enviada, mas NUNCA retornada na resposta da API.
    senha = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['id', 'nome', 'email', 'senha', 'tipo', 'disciplinas', 'disponibilidades']

    def create(self, validated_data):
        # Customização do Cadastro: Garante que a senha seja salva com hashing seguro.
        password = validated_data.pop('senha', None)
        
        # Coerência: Define o 'username' igual ao 'email' para o login customizado.
        if 'email' in validated_data and 'username' not in validated_data:
            validated_data['username'] = validated_data['email']
        
        instance = self.Meta.model(**validated_data)
        
        if password is not None:
            # set_password: Aplica o algoritmo de hashing de senha do Django.
            instance.set_password(password)
        
        instance.save()
        return instance

class AvaliacaoSerializer(serializers.ModelSerializer):
    # Serialização Complexa: Projeta dados contextuais (nomes) de múltiplos modelos relacionados.
    # Essencial para a exibição no dashboard do professor/aluno.
    nome_aluno = serializers.CharField(source='agendamento.aluno.nome', read_only=True)
    nome_professor = serializers.CharField(source='agendamento.disponibilidade.professor.nome', read_only=True)
    disciplina_nome = serializers.CharField(source='agendamento.disponibilidade.disciplina.nome', read_only=True)

    class Meta:
        model = Avaliacao
        # Incluímos 'tipo_avaliador' para diferenciar se a nota foi dada pelo Aluno ou Professor (Avaliação Mútua).
        fields = ['id', 'agendamento', 'nota', 'comentario', 'tipo_avaliador', 'criado_em', 'nome_aluno', 'nome_professor', 'disciplina_nome']

class AgendamentoSerializer(serializers.ModelSerializer):
    # Projeção de Campos: Mapeia informações da Disponibilidade para a lista de Agendamentos.
    disciplina_nome = serializers.SerializerMethodField()
    professor_nome = serializers.CharField(source='disponibilidade.professor.nome', read_only=True)
    aluno_nome = serializers.CharField(source='aluno.nome', read_only=True)
    data = serializers.DateField(source='disponibilidade.data', read_only=True)
    hora = serializers.TimeField(source='disponibilidade.horario_inicio', read_only=True)
    
    assunto = serializers.ReadOnlyField(source='disponibilidade.assunto')
    
    # Campos de Lógica de Negócio (métodos customizados).
    link_aula = serializers.SerializerMethodField() # Regra de segurança para mostrar o link.
    avaliacao = serializers.SerializerMethodField() # Aninhamento condicional da avaliação.

    class Meta:
        model = Agendamento
        fields = ['id', 'aluno', 'disponibilidade', 'disciplina_nome', 'professor_nome', 'aluno_nome', 'data', 'hora', 'status', 'assunto', 'link_aula', 'avaliacao']
        # Desabilitamos o validador 'unique_together' aqui para permitir o fluxo de reativação no 'create'.
        validators = [] 

    def create(self, validated_data):
        aluno = validated_data.get('aluno')
        disponibilidade = validated_data.get('disponibilidade')

        agendamento_existente = Agendamento.objects.filter(
            aluno=aluno, 
            disponibilidade=disponibilidade
        ).first()

        if agendamento_existente:
            # LÓGICA DE RE-AGENDAMENTO (Regra de Negócio).
            # Se o agendamento existe e foi CANCELADO, ele é reativado em vez de criar um novo.
            if agendamento_existente.status == 'CANCELADO':
                if not disponibilidade.disponivel:
                     raise serializers.ValidationError("Horário não disponível.")

                agendamento_existente.status = 'AGENDADO'
                agendamento_existente.save() 
                
                # Re-bloqueio manual da disponibilidade para consistência.
                disponibilidade.disponivel = False
                disponibilidade.save()
                
                return agendamento_existente
            
            # Erro: Se o agendamento já está ativo, impede a duplicidade.
            raise serializers.ValidationError("Agendamento já existe para este horário.")

        return super().create(validated_data)

    def get_disciplina_nome(self, obj):
        # Tratamento de Nulo: Retorna um nome padrão ('Tira-Dúvidas / Geral') se não houver disciplina vinculada.
        if obj.disponibilidade and obj.disponibilidade.disciplina:
            return obj.disponibilidade.disciplina.nome
        return "Tira-Dúvidas / Geral"

    def get_link_aula(self, obj):
        # REGRA DE SEGURANÇA: O link da sala virtual só é exposto se a aula tiver sido CONFIRMADA ou CONCLUÍDA.
        if obj.status in ['CONFIRMADO', 'CONCLUIDO']:
            return obj.disponibilidade.link
        return None

    def get_avaliacao(self, obj):
        # CORREÇÃO DO BUG DE AVALIAÇÃO MÚTUA:
        # Busca apenas a avaliação feita pelo PRÓPRIO usuário logado (usando o contexto do request).
        request = self.context.get('request')
        
        if request and request.user.is_authenticated:
            # Se sou PROFESSOR, busco apenas avaliações com tipo_avaliador='PROFESSOR'
            # Se sou ALUNO, busco apenas avaliações com tipo_avaliador='ALUNO'
            # Isso garante que eu não veja a avaliação do outro como se fosse a minha.
            minha_avaliacao = obj.avaliacao_set.filter(tipo_avaliador=request.user.tipo).first()
            
            if minha_avaliacao:
                return AvaliacaoSerializer(minha_avaliacao).data
        
        return None