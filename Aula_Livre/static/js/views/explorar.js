// js/views/explorar.js

import { authService } from '../services/auth.js';

// funcao global pra abrir o modal.
window.abrirModalAgendamento = function(id) {
    if (!authService.usuarioEstaLogado()) {
        const modalLogin = new bootstrap.Modal(document.getElementById('modal-entrar'));
        modalLogin.show();
        return;
    }

    const professor = listaDeProfessores.find(p => p.id === id);

    if (!professor) return;

    document.getElementById('titulo-modal-agendamento').innerText = `Agenda de ${professor.nome}`;

    const divHorarios = document.getElementById('lista-horarios');
    divHorarios.innerHTML = ''; 

    if (professor.horarios.length === 0) {
        divHorarios.innerHTML = '<p class="text-muted text-center">Sem horários livres no momento.</p>';
    } else {
        professor.horarios.forEach(horario => {
            const botao = document.createElement('button');
            botao.className = 'btn btn-outline-primary text-start mb-2';
            botao.innerHTML = `<i class="bi bi-calendar-event me-2"></i> ${horario}`;
            
            botao.onclick = () => {
                const modalElemento = document.getElementById('modal-agendamento');
                const modalInstance = bootstrap.Modal.getInstance(modalElemento);
                modalInstance.hide();

                const toastEl = document.getElementById('toast-sistema');
                const toastMsg = document.getElementById('toast-mensagem');
                const toastIcone = document.getElementById('toast-icone');
                
                toastEl.className = 'toast align-items-center text-white border-0 bg-success';
                toastIcone.className = 'bi bi-check-circle-fill me-2';
                toastMsg.innerText = `Sucesso! Aula com ${professor.nome} agendada para ${horario}.`;

                const toastBootstrap = new bootstrap.Toast(toastEl);
                toastBootstrap.show();
            };
    
            divHorarios.appendChild(botao);
        });
    }

    const modalElemento = document.getElementById('modal-agendamento');
    const modalBootstrap = new bootstrap.Modal(modalElemento);
    modalBootstrap.show();
}

// gera o html de cada card
function criarCardProfessor(professor) {
    const estaLogado = authService.usuarioEstaLogado();
    let botaoAcao = '';

    if (estaLogado) {
        botaoAcao = `
        <button class="btn btn-outline-primary btn-sm" onclick="window.abrirModalAgendamento(${professor.id})">
            Ver Horários
        </button>`;
    } else {
        botaoAcao = `
        <button class="btn btn-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modal-entrar">
            <i class="bi bi-lock-fill me-1"></i> Entre para ver horários
        </button>`;
    }

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
                        ${botaoAcao}
                    </div>
                </div>
            </div>
        </div>
    `;
}


export async function obterConteudoExplorar() {
    let htmlProfessores = '';

    try {
        // Busca os dados da API Django
        const response = await fetch('/api/professores/');
        const professores = await response.json();

        if (professores.length === 0) {
            htmlProfessores = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">Nenhum professor encontrado.</p>
                </div>`;
        } else {
            // Mapeia os dados do Django para o formato do seu HTML
            htmlProfessores = professores.map(prof => {
                // Adaptação: O Django retorna 'disciplinas' como lista de strings
                const materiaPrincipal = prof.disciplinas[0] || 'Geral'; 
                
                // Cria um objeto temporário compatível com sua função criarCardProfessor
                const profObj = {
                    id: prof.id,
                    nome: prof.nome,
                    materia: materiaPrincipal,
                    descricao: `Professor de ${prof.disciplinas.join(', ')}`,
                    corBadge: 'bg-primary', // Pode customizar depois
                    horarios: [] // A API de professor ainda não traz horários aninhados, teria que ajustar o serializer
                };
                return criarCardProfessor(profObj);
            }).join('');
        }
    } catch (error) {
        console.error(error);
        htmlProfessores = '<p class="text-danger text-center">Erro ao carregar professores.</p>';
    }

    // ... Retorna o HTML final usando a variável htmlProfessores
    return `
    <div class="container py-5">
        <h2 class="mb-4 fw-bold text-primary">Professores Disponíveis</h2>
        <div class="row">
            ${htmlProfessores}
        </div>
    </div>
    `;
}