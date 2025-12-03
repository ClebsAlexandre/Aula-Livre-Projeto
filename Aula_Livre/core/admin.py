from django.contrib import admin
from .models import Professor, Aluno, Disciplina, Disponibilidade, Agendamento, Avaliacao

# Isso permite gerenciar esses dados em http://127.0.0.1:8000/admin
admin.site.register(Professor)
admin.site.register(Aluno)
admin.site.register(Disciplina)
admin.site.register(Disponibilidade)
admin.site.register(Agendamento)
admin.site.register(Avaliacao)