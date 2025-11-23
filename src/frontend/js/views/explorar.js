// js/views/explorar.js

// lista mockada pra gente testar o front.
// depois isso aqui vai virar um json q vem do django
const listaDeProfessores = [
    {
        id: 1,
        nome: "Carlos Silva",
        materia: "Matemática",
        corBadge: "bg-success",
        descricao: "Ensino álgebra e geometria básica para ensino fundamental e médio.",
        avaliacoes: 5,
        horarios: ["Segunda - 14:00", "Quarta - 16:00", "Sexta - 10:00"]
    },
    {
        id: 2,
        nome: "Ana Pereira",
        materia: "Inglês",
        corBadge: "bg-primary",
        descricao: "Aulas de conversação e gramática para iniciantes. Método prático.",
        avaliacoes: 4,
        horarios: ["Terça - 19:00", "Quinta - 20:00"]
    },
    {
        id: 3,
        nome: "Roberto Campos",
        materia: "Física",
        corBadge: "bg-danger",
        descricao: "Descomplicando a física mecânica e termodinâmica para vestibulandos.",
        avaliacoes: 5,
        horarios: ["Sábado - 09:00", "Sábado - 11:00"]
    },
    {
        id: 4,
        nome: "Júlia Costa",
        materia: "Redação",
        corBadge: "bg-warning text-dark",
        descricao: "Técnicas de escrita para o ENEM e correção de textos.",
        avaliacoes: 5,
        horarios: ["Segunda - 18:00", "Quarta - 18:00"]
    }
];

// funcao global pra abrir o modal.
// precisa ser window pq o html gerado dinamicamente nao enxerga ela se ficar fechada no modulo
window.abrirModalAgendamento = function(id) {
    const professor = listaDeProfessores.find(p => p.id === id);

    if (!professor) return;

    // atualiza o titulo da modal
    document.getElementById('titulo-modal-agendamento').innerText = `Agenda de ${professor.nome}`;

    // limpa os horarios antigos
    const divHorarios = document.getElementById('lista-horarios');
    divHorarios.innerHTML = ''; 

    // verifica se tem horarios
    if (professor.horarios.length === 0) {
        divHorarios.innerHTML = '<p class="text-muted text-center">Sem horários livres no momento.</p>';
    } else {
        professor.horarios.forEach(horario => {
            const botao = document.createElement('button');
            botao.className = 'btn btn-outline-primary text-start mb-2';
            botao.innerHTML = `<i class="bi bi-calendar-event me-2"></i> ${horario}`;
            
        
            // qdo clica no horario, fecha o modal e mostra a notificação verde
            botao.onclick = () => {
                
                // 1. fecha o modal de agendamento suavemente
                const modalElemento = document.getElementById('modal-agendamento');
                const modalInstance = bootstrap.Modal.getInstance(modalElemento);
                modalInstance.hide();

                // 2. atualiza o texto da notificacao
                const textoNotificacao = document.getElementById('texto-notificacao');
                textoNotificacao.innerText = `Sucesso! Aula com ${professor.nome} agendada para ${horario}.`;

                // 3. mostra o toast (a caixinha verde no canto)
                const toastElemento = document.getElementById('notificacao-sucesso');
                const toastBootstrap = new bootstrap.Toast(toastElemento);
                toastBootstrap.show();

                // TODO: chamar a api do back pra salvar o agendamento no banco
            };
    
            divHorarios.appendChild(botao);
        });
    }

    // abre o modal na tela
    const modalElemento = document.getElementById('modal-agendamento');
    const modalBootstrap = new bootstrap.Modal(modalElemento);
    modalBootstrap.show();
}

// gera o html de cada card
function criarCardProfessor(professor) {
    return `
        <div class="col-md-4 mb-4">
            <div class="card shadow-sm border-0 h-100">
                <div class="card-body text-center d-flex flex-column p-4">
                    
                    <div class="mb-3">
                        <i class="bi bi-person-circle text-secondary" style="font-size: 3rem;"></i>
                    </div>

                    <h5 class="card-title fw-bold">${professor.nome}</h5>
                    
                    <span class="badge ${professor.corBadge} mb-3 align-self-center">
                        ${professor.materia}
                    </span>
                    
                    <p class="card-text small text-muted mb-4">
                        ${professor.descricao}
                    </p>
                    
                    <div class="d-grid mt-auto">
                        <button class="btn btn-outline-primary btn-sm" onclick="window.abrirModalAgendamento(${professor.id})">
                            Ver Horários
                        </button>
                    </div>

                </div>
            </div>
        </div>
    `;
}

// exporta a view pro router
export function obterConteudoExplorar() {
    const cardsHtml = listaDeProfessores.map(criarCardProfessor).join('');

    return `
    <div class="container py-5">
        <h2 class="mb-4 fw-bold text-primary">Professores Disponíveis</h2>
        
        <div class="row mb-4">
            <div class="col-md-4">
                <input type="text" class="form-control" placeholder="Buscar por matéria...">
            </div>
            <div class="col-md-2">
                <button class="btn btn-outline-primary w-100">Filtrar</button>
            </div>
        </div>

        <div class="row">
            ${cardsHtml}
        </div>
    </div>
    `;
}