from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Disciplina

class DisciplinaCRUDTests(APITestCase):

    def setUp(self):
        """
        Configuração inicial executada antes de cada teste.
        Cria uma massa de dados para testes de leitura/update/delete.
        """
        # Define a URL base. Como usamos DefaultRouter em core/urls.py,
        # o DRF cria nomes de rota automaticamente: 'disciplina-list' e 'disciplina-detail'
        self.url_list = reverse('disciplina-list') # /api/disciplinas/
        
        # Cria uma disciplina inicial para testes
        self.disciplina_exemplo = Disciplina.objects.create(
            nome='História',
            descricao='História Geral e do Brasil'
        )
        # URL de detalhe (ex: /api/disciplinas/1/)
        self.url_detail = reverse('disciplina-detail', args=[self.disciplina_exemplo.id])

    def test_listar_disciplinas(self):
        """Teste (READ): Deve listar as disciplinas existentes"""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verifica se retornou pelo menos 1 item (o criado no setUp)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['nome'], 'História')

    def test_criar_disciplina(self):
        """Teste (CREATE): Deve criar uma nova disciplina via POST"""
        dados = {
            'nome': 'Matemática',
            'descricao': 'Cálculo e Álgebra'
        }
        response = self.client.post(self.url_list, dados, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Disciplina.objects.count(), 2) # 1 do setUp + 1 criada agora
        self.assertEqual(Disciplina.objects.get(id=response.data['id']).nome, 'Matemática')

    def test_atualizar_disciplina(self):
        """Teste (UPDATE): Deve atualizar uma disciplina existente via PUT"""
        novos_dados = {
            'nome': 'História Contemporânea',
            'descricao': 'Foco no século XX'
        }
        response = self.client.put(self.url_detail, novos_dados, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verifica no banco se mudou mesmo
        self.disciplina_exemplo.refresh_from_db()
        self.assertEqual(self.disciplina_exemplo.nome, 'História Contemporânea')

    def test_deletar_disciplina(self):
        """Teste (DELETE): Deve remover uma disciplina"""
        response = self.client.delete(self.url_detail)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Disciplina.objects.count(), 0)
# Create your tests here.
