from .models import Professor, Aluno
from .utils import check_raw_password

class CustomAuthBackend:

    def authenticate(self, request, email=None, senha=None):
        # 1. Tenta como Professor
        try:
            user = Professor.objects.get(email=email)
            if check_raw_password(user, senha):
                # Anexa atributos necessários para o login do Django
                user.is_authenticated = True
                user.professor_id = user.id # Marca como Professor
                user.tipo = 'professor'
                return user
        except Professor.DoesNotExist:
            pass

        # 2. Tenta como Aluno
        try:
            user = Aluno.objects.get(email=email)
            if check_raw_password(user, senha):
                # Anexa atributos necessários para o login do Django
                user.is_authenticated = True
                user.aluno_id = user.id # Marca como Aluno
                user.tipo = 'aluno'
                return user
        except Aluno.DoesNotExist:
            pass
        return None

    def get_user(self, user_id):
 
        try:
            user = Professor.objects.get(pk=user_id)
            user.is_authenticated = True
            user.tipo = 'professor'
            return user
        except Professor.DoesNotExist:
            try:
                user = Aluno.objects.get(pk=user_id)
                user.is_authenticated = True
                user.tipo = 'aluno'
                return user
            except Aluno.DoesNotExist:
                return None