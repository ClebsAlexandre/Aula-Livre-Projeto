from django.db import models
from django.core.exceptions import ValidationError

class Professor(models.Model):
    nome = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    senha = models.CharField(max_length=128)

    #Método para HASHING e armazenamento da senha
    def set_password(self, raw_password):
        self.senha = make_password(raw_password)
        self.save() # Salva a instância com a senha já hashada

    #Método para COMPARAÇÃO da senha
    def check_password(self, raw_password):
        # O 'check_password' compara a senha em texto puro com a senha com hash
        return check_password(raw_password, self.senha)
    
    def __str__(self):
        return self.nome

class Aluno(models.Model):
    nome = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    senha = models.CharField(max_length=128)

    #Método para HASHING e armazenamento da senha
    def set_password(self, raw_password):
        self.senha = make_password(raw_password)
        self.save()
        
    #Método para COMPARAÇÃO da senha
    def check_password(self, raw_password):
        return check_password(raw_password, self.senha)
    
    def __str__(self):
        return self.nome

class Disciplina(models.Model):
    nome = models.CharField(max_length=50)
    descricao = models.TextField(blank=True, null=True)
    professores = models.ManyToManyField(Professor, related_name='disciplinas')

    def __str__(self):
        return self.nome

class Disponibilidade(models.Model):
    professor = models.ForeignKey(Professor, on_delete=models.CASCADE)
    
    # Detalhes da aula
    disciplina = models.ForeignKey(Disciplina, on_delete=models.SET_NULL, null=True, blank=True)
    assunto = models.CharField(max_length=100, blank=True, null=True)
    nivel = models.CharField(max_length=50, blank=True, null=True)
    descricao = models.TextField(blank=True, null=True)
    link = models.URLField(max_length=200, blank=True, null=True)
    
    # Dados de tempo
    data = models.DateField()
    horario_inicio = models.TimeField()
    disponivel = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.professor} - {self.data} às {self.horario_inicio}"

class Agendamento(models.Model):
    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE)
    disponibilidade = models.ForeignKey(Disponibilidade, on_delete=models.CASCADE)
    
    # Estes campos são copiados automaticamente da Disponibilidade ao salvar
    disciplina = models.ForeignKey(Disciplina, on_delete=models.SET_NULL, null=True, blank=True)
    link = models.URLField(max_length=200, blank=True, null=True)
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('AGENDADO','Aguardando Confirmação'), 
            ('CONFIRMADO', 'Confirmado'), 
            ('CONCLUIDO','Concluído'), 
            ('CANCELADO','Cancelado')
        ],
        default='AGENDADO'
    )

    class Meta:
        # Garante que um aluno não agende a mesma aula duas vezes
        unique_together = ('aluno', 'disponibilidade')

    def save(self, *args, **kwargs):
        # 1. Copia dados da disponibilidade se estiverem vazios
        if not self.disciplina and self.disponibilidade.disciplina:
            self.disciplina = self.disponibilidade.disciplina
        if not self.link and self.disponibilidade.link:
            self.link = self.disponibilidade.link
            
        # 2. Se for um novo agendamento, verifica disponibilidade
        if not self.pk: 
            if not self.disponibilidade.disponivel:
                raise ValidationError("Este horário já foi reservado por outro aluno.")
            
            # Marca o horário como ocupado
            self.disponibilidade.disponivel = False
            self.disponibilidade.save()

        # 3. Se o agendamento for cancelado, libera o horário novamente
        if self.status == 'CANCELADO':
            self.disponibilidade.disponivel = True
            self.disponibilidade.save()
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Aula de {self.disciplina} - {self.aluno} com {self.disponibilidade.professor}"

class Certificado(models.Model):
    agendamento = models.OneToOneField(Agendamento, on_delete=models.CASCADE)
    codigo_validacao = models.CharField(max_length=64, unique=True)
    data_emissao = models.DateTimeField(auto_now_add=True)
    horas = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)

    def __str__(self):
        return f"Certificado {self.codigo_validacao}"
    
class Avaliacao(models.Model):
    agendamento = models.OneToOneField(Agendamento, on_delete=models.CASCADE)
    nota = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    comentario = models.TextField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Avaliação nota {self.nota} para {self.agendamento}"