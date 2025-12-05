from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError

class Usuario(AbstractUser):
    # Base do nosso sistema de autenticação customizada. Herdamos AbstractUser para usar o framework de segurança do Django (hashing de senha, etc.).
    TIPO_CHOICES = [
        ('ALUNO', 'Aluno'),
        ('PROFESSOR', 'Professor'),
    ]
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES) # Chave para diferenciar o comportamento do sistema (Dashboards, permissões).
    nome = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email' # Customização: Definimos o login principal como E-mail para melhor UX.
    REQUIRED_FIELDS = ['username', 'nome', 'tipo']

    def __str__(self):
        return self.nome

class Disciplina(models.Model):
    nome = models.CharField(max_length=50)
    descricao = models.TextField(blank=True, null=True)
    professores = models.ManyToManyField(
        Usuario, 
        related_name='disciplinas', 
        # Restrição crucial: Apenas usuários com tipo='PROFESSOR' podem ser ligados a uma disciplina.
        limit_choices_to={'tipo': 'PROFESSOR'},
        blank=True 
    )

    def __str__(self):
        return self.nome

class Disponibilidade(models.Model):
    professor = models.ForeignKey(Usuario, on_delete=models.CASCADE, limit_choices_to={'tipo': 'PROFESSOR'})
    disciplina = models.ForeignKey(Disciplina, on_delete=models.SET_NULL, null=True, blank=True)
    assunto = models.CharField(max_length=100, blank=True, null=True)
    nivel = models.CharField(max_length=50, blank=True, null=True)
    descricao = models.TextField(blank=True, null=True)
    # Este campo é a base para a inovação da Sala Virtual Automática (Ver Agendamento.save()).
    link = models.URLField(max_length=200, blank=True, null=True)
    
    data = models.DateField()
    horario_inicio = models.TimeField()
    disponivel = models.BooleanField(default=True) # Flag de controle de overbooking.

    def __str__(self):
        return f"{self.professor} - {self.data} às {self.horario_inicio}"

class Agendamento(models.Model):
    aluno = models.ForeignKey(Usuario, on_delete=models.CASCADE, limit_choices_to={'tipo': 'ALUNO'})
    disponibilidade = models.ForeignKey(Disponibilidade, on_delete=models.CASCADE)
    
    status = models.CharField(
        max_length=20,
        choices=[
            # Fluxo de estados da aula, essencial para o Dashboard e para o gatilho de Certificado/Avaliação.
            ('AGENDADO', 'Aguardando Confirmação'), 
            ('CONFIRMADO', 'Confirmado'), 
            ('CONCLUIDO', 'Concluído'), 
            ('CANCELADO', 'Cancelado')
        ],
        default='AGENDADO'
    )

    class Meta:
        # Chave de integridade: Garante que um aluno só possa reservar UM agendamento por Disponibilidade específica (horário).
        unique_together = ('aluno', 'disponibilidade')

    def save(self, *args, **kwargs):
        # Este método encapsula toda a lógica transacional do agendamento, agindo como um "hook" de regra de negócio.
        
        # Lógica de criação (executada apenas na primeira vez):
        if not self.pk: 
            # 1. Checagem e Bloqueio Transacional: Evita a condição de corrida (overbooking).
            if not self.disponibilidade.disponivel:
                raise ValidationError("Este horário já foi reservado por outro aluno.")
            
            self.disponibilidade.disponivel = False # Trava o horário para agendamentos futuros.
            
            # 2. INOVAÇÃO: Geração Dinâmica de Sala Virtual (Jitsi Meet).
            # Se o professor não forneceu um link, criamos um link único baseado no ID da Disponibilidade.
            if not self.disponibilidade.link:
                self.disponibilidade.link = f"https://meet.jit.si/AulaLivre-{self.disponibilidade.id}"
            
            self.disponibilidade.save() # Persiste a trava e o link na disponibilidade.

        # Lógica de cancelamento: Libera o horário na Disponibilidade para que possa ser re-agendado (regra de reversão).
        if self.status == 'CANCELADO':
            self.disponibilidade.disponivel = True
            self.disponibilidade.save()
            
        super().save(*args, **kwargs)

    def __str__(self):
        disc_nome = self.disponibilidade.disciplina.nome if self.disponibilidade.disciplina else "Geral"
        return f"Aula de {disc_nome} - {self.aluno} com {self.disponibilidade.professor}"

class Certificado(models.Model):
    # Modelo para o registro formal dos certificados de horas voluntárias.
    agendamento = models.OneToOneField(Agendamento, on_delete=models.CASCADE)
    codigo_validacao = models.CharField(max_length=64, unique=True)
    data_emissao = models.DateTimeField(auto_now_add=True)
    horas = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)

    def __str__(self):
        return f"Certificado {self.codigo_validacao}"
    
class Avaliacao(models.Model):
    # Estrutura de avaliação mútua.
    agendamento = models.ForeignKey(Agendamento, on_delete=models.CASCADE) # ForeignKey permite múltiplas notas (uma do aluno, uma do professor)
    
    # Campo chave para a avaliação mútua (controla quem avalia o quê).
    tipo_avaliador = models.CharField(
        max_length=20, 
        choices=[('ALUNO', 'Aluno'), ('PROFESSOR', 'Professor')],
        default='ALUNO'
    )
    
    nota = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    comentario = models.TextField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Avaliação"
        verbose_name_plural = "Avaliações"
        # Garante que um tipo de avaliador (Aluno OU Professor) não avalie a mesma aula duas vezes.
        unique_together = ('agendamento', 'tipo_avaliador')

    def __str__(self):
        return f"Avaliação de {self.tipo_avaliador} - Nota {self.nota}"