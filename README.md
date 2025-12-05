# AulaLivre - Plataforma de Ensino Voluntário

COLABORADORES: CLEBSON ALEXANDRE, NICOLAS KLAYVERT, SERGIO ROBERTO, DIEGO LUIZ

## 1. Visão Geral do Projeto

A AulaLivre é uma plataforma de ensino voluntário desenvolvida com uma arquitetura de Single Page Application (SPA) no Frontend (JavaScript, Bootstrap) e uma API RESTful no Backend (Django 5.2.9, Django REST Framework - DRF).

* **Tecnologias Principais:** Python (Django), Django REST Framework, JavaScript (Módulos Puros), Bootstrap 5.
* **Modelo de Usuário:** O sistema utiliza um modelo `Usuario` customizado com autenticação baseada em **e-mail** e perfis distintos: **ALUNO** e **PROFESSOR**.

---

## 2. Funcionalidades de Negócio e Segurança

### Agendamento e Sala Virtual
1.  **Controle de Concorrência:** Implementa lógica transacional no método `Agendamento.save()` para prevenir o *overbooking*, bloqueando o horário (`disponivel = False`) após o primeiro agendamento.
2.  **Geração Automática de Link:** Se o professor não fornecer um link de sala virtual, o sistema gera um link Jitsi Meet único (`https://meet.jit.si/AulaLivre-{id}`).
3.  **Segurança de Acesso:** O link da aula é exposto ao aluno apenas quando o status do agendamento é **CONFIRMADO** ou **CONCLUIDO**.

### Avaliação e Certificação
1.  **Avaliação Mútua:** O modelo `Avaliacao` permite avaliação bidirecional (Aluno avalia Professor e vice-versa), controlada pelo campo `tipo_avaliador` e garantida por uma restrição de unicidade (`unique_together`).
2.  **Emissão de Certificado:** A emissão do `Certificado` é restrita ao status **CONCLUIDO** e exige que o usuário logado seja o **ALUNO**.

---

## 3. Estrutura do Código

### Backend (Django/core)

* **`core/models.py`:** Define a estrutura do banco de dados (BD).
* **`core/serializers.py`:** Responsável por converter objetos do BD para formatos JSON (e vice-versa), incluindo a lógica de segurança da senha (`write_only=True`).
* **`core/views.py`:** Contém os ViewSets para CRUD via DRF e as funções decoradas para autenticação (`login_usuario`, `cadastro_usuario`).

### Frontend (static/js)

* **`static/js/router.js`:** Controla a navegação SPA e implementa o *gatekeeping* para rotas protegidas que exigem autenticação.
* **`static/js/services/auth.js`:** Camada de serviço responsável pela comunicação com as APIs de login e cadastro, e pela persistência do estado do usuário no `localStorage`.
* **`static/js/views/*.js`:** Módulos que retornam o conteúdo HTML e contêm a lógica específica de cada tela (Home, Explorar, Dashboard).
