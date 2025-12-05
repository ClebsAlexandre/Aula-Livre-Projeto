// Arquivo: static/js/views/home.js

export async function obterConteudoHome() {
    // Função exportada que retorna o template HTML básico da página Home.
    // O conteúdo é totalmente estático e depende do JavaScript (router.js)
    // para ser dinamicamente adaptado ao tipo de usuário.
    return `
    <div class="container mt-5">
        <div class="text-center mb-5">
            <h2 class="fw-bold">Olá, <span id="nome-usuario" class="text-primary">Visitante</span>!</h2>
            <p class="text-muted" id="subtitulo-boas-vindas">O que você quer aprender hoje?</p>
        </div>

        <div id="painel-visitante" class="row justify-content-center d-none">
            <!-- Painel Padrão: Exibido para usuários não logados. O 'd-none' é removido pelo router.js se necessário. -->
            <div class="col-md-8 text-center">
                <h3>A Ponte do Conhecimento Voluntário.</h3>
                <p class="text-muted">Conectamos professores que querem doar conhecimento a alunos que precisam.</p>
                <div class="d-flex justify-content-center gap-3 mt-3">
                    <button class="btn btn-primary btn-lg rounded-pill px-4" data-bs-toggle="modal" data-bs-target="#modal-cadastro">
                        Começar Agora
                    </button>
                    <button class="btn btn-outline-secondary btn-lg rounded-pill px-4" data-route="explorar">
                        Ver Professores
                    </button>
                </div>
            </div>
        </div>

        <div id="painel-aluno" class="row justify-content-center d-none"> 
            <!-- Painel do Aluno: Exibido se o usuário estiver logado como ALUNO. -->
            <!-- Botões direcionam para as rotas chave: Explorar (match) e Dashboard (minhas aulas). -->
            <div class="col-md-5 mb-4">
                <div class="card h-100 p-4 text-center border-0 shadow-sm hover-effect" style="cursor: pointer;" data-route="explorar">
                    <div class="card-body">
                        <i class="bi bi-search text-primary" style="font-size: 3rem;"></i>
                        <h3 class="mt-3">Buscar Aulas</h3>
                        <p class="text-muted">Encontre professores de Matemática, Inglês e mais.</p>
                        <button class="btn btn-outline-primary w-100 rounded-pill mt-2" data-route="explorar">Ir para Busca</button>
                    </div>
                </div>
            </div>
            <div class="col-md-5 mb-4">
                <div class="card h-100 p-4 text-center border-0 shadow-sm hover-effect" style="cursor: pointer;" data-route="dashboard">
                    <div class="card-body">
                        <i class="bi bi-journal-check text-success" style="font-size: 3rem;"></i>
                        <h3 class="mt-3">Meu Painel</h3>
                        <p class="text-muted">Veja suas próximas aulas agendadas.</p>
                        <button class="btn btn-outline-success w-100 rounded-pill mt-2" data-route="dashboard">Ver Minhas Aulas</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="painel-professor" class="row justify-content-center d-none">
            <!-- Painel do Professor: Exibido se o usuário estiver logado como PROFESSOR. -->
            <!-- Botões direcionam para a criação de horários (modal) e o Dashboard (gerenciamento). -->
            <div class="col-md-5 mb-4">
                <div class="card h-100 p-4 text-center border-primary shadow-sm">
                    <div class="card-body">
                        <i class="bi bi-plus-circle-fill text-primary" style="font-size: 3rem;"></i>
                        <h3 class="mt-3">Criar Horário</h3>
                        <p class="text-muted">Abra novos horários na sua agenda.</p>
                        <button class="btn btn-primary w-100 rounded-pill mt-2" data-bs-toggle="modal" data-bs-target="#modal-novo-horario">
                            Cadastrar Disponibilidade
                        </button>
                    </div>
                </div>
            </div>
            <div class="col-md-5 mb-4">
                <div class="card h-100 p-4 text-center border-0 shadow-sm hover-effect" style="cursor: pointer;" data-route="dashboard">
                    <div class="card-body">
                        <i class="bi bi-calendar-week text-dark" style="font-size: 3rem;"></i>
                        <h3 class="mt-3">Minha Agenda</h3>
                        <p class="text-muted">Gerencie quem agendou aulas com você.</p>
                        <button class="btn btn-outline-dark w-100 rounded-pill mt-2" data-route="dashboard">Ver Meus Alunos</button>
                    </div>
                </div>
            </div>
        </div>

    </div>
    `;
}