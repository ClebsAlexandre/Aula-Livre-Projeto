from django.db import models


class Professor(models.Model):
    nome = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    senha = models.CharField(max_length=128) 
    
    def __str__(self):
        return self.nome


class Aluno(models.Model):
    nome = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    senha = models.CharField(max_length=128)
    
    def __str__(self):
        return self.nome


class Disciplina(models.Model):
    nome = models.CharField(max_length=50)
    descricao = models.TextField(blank=True, null=True)
    # Relacionamento: Um professor pode ter várias disciplinas (ManyToMany seria ideal, mas simplifiquei aqui)
    professores = models.ManyToManyField(Professor, related_name='disciplinas')

    def __str__(self):
        return self.nome


class Disponibilidade(models.Model):
    professor = models.ForeignKey(Professor, on_delete=models.CASCADE)
    data = models.DateField()
    horario_inicio = models.TimeField()
    disponivel = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.professor} - {self.data} às {self.horario_inicio}"


class Agendamento(models.Model):
    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE)
    disponibilidade = models.ForeignKey(Disponibilidade, on_delete=models.CASCADE)
    disciplina = models.ForeignKey(Disciplina, on_delete=models.SET_NULL, null=True)
    link = models.URLField(max_length=200, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[('AGENDADO','Agendado'), ('CONCLUIDO','Concluído'), ('CANCELADO','Cancelado')],
        default='AGENDADO'
    )


    def __str__(self):
        return f"Aula de {self.disciplina} - {self.aluno} com {self.disponibilidade.professor}"


class Certificado(models.Model):
    # O certificado é gerado a partir de um agendamento concluído
    agendamento = models.OneToOneField(Agendamento, on_delete=models.CASCADE)
    codigo_validacao = models.CharField(max_length=64, unique=True)
    data_emissao = models.DateTimeField(auto_now_add=True)
    horas = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)


    def __str__(self):
        return f"Certificado {self.codigo_validacao}"
