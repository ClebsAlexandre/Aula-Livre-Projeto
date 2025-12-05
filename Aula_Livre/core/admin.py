from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Disciplina, Disponibilidade, Agendamento, Avaliacao, Certificado

class UsuarioAdmin(UserAdmin):
    # Configuração para exibir os campos customizados 'tipo' e 'nome' no Admin
    fieldsets = UserAdmin.fieldsets + (
        ('Informações Personalizadas', {'fields': ('tipo', 'nome')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('tipo', 'nome', 'email')}),
    )
    list_display = ['username', 'email', 'nome', 'tipo', 'is_staff']
    search_fields = ['nome', 'email', 'username']

admin.site.register(Usuario, UsuarioAdmin)
admin.site.register(Disciplina)
admin.site.register(Disponibilidade)
admin.site.register(Agendamento)
admin.site.register(Avaliacao)
admin.site.register(Certificado)