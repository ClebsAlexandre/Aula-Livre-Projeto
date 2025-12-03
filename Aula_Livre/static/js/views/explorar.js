// js/views/explorar.js

import { authService } from '../services/auth.js';

// Inicializa a lista global
window.listaDeProfessores = [];

// Função auxiliar para pegar o CSRF Token (necessário para POST no Django)
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

window.abrirModalAgendamento = function(id) {
    if (!authService.usuarioEstaLogado()) {
        const modalLogin = new bootstrap.Modal(document.getElementById('modal-entrar'));
        modalLogin.show();
        return;
    }

    const professor = window.listaDeProfessores.find(p => p.id === id);
    if (!professor) return;

    document.getElementById('titulo-modal-agendamento').innerText = `Agenda de ${professor.nome}`;

    const divHorarios = document.getElementById('lista-horarios');
    divHorarios.innerHTML = ''; 

    if (professor.horarios.length === 0) {
        divHorarios.innerHTML = '<p class="text-muted text-center">Sem horários livres no momento.</p>';
    } else {
        professor.horarios.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card mb-3 border-primary';
            
            // Note que adicionei item.id na chamada da função abaixo
            card.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h6 class="card-title fw-bold text-primary mb-0">
                                <i class="bi bi-book-half me-1"></i> ${item.disciplina}
                            </h6>
                            <span class="badge bg-light text-dark border mt-1">${item.nivel || 'Nível Geral'}</span>
                        </div>
                        <div class="text-end">
                            <h5 class="fw-bold mb-0 text-success">${item.hora}</h5>
                            <small class="text-muted d-block">${item.dataExtenso}</small>
                        </div>
                    </div>
                    
                    <p class="card-text mb-2">
                        <strong>Tema:</strong> ${item.assunto || 'Não informado'}
                    </p>
                    
                    ${item.descricao ? `<p class="card-text small text-muted bg-light p-2 rounded"><em>"${item.descricao}"</em></p>` : ''}
                    
                    <button class="btn botao-verde w-100 mt-2" onclick="window.confirmarAgendamentoReal(${item.id}, '${professor.nome}', '${item.dataFormatada}', '${item.hora}')">
                        Agendar Aula
                    </button>
                </div>
            `;
            
            divHorarios.appendChild(card);
        });
    }

    const modalElemento = document.getElementById('modal-agendamento');
    const modalBootstrap = new bootstrap.Modal(modalElemento);
    modalBootstrap.show();
}

// --- FUNÇÃO DE AGENDAMENTO REAL (ATUALIZADA) ---
window.confirmarAgendamentoReal = async function(idDisponibilidade, nomeProf, data, hora) {
    const usuario = authService.getUsuario();
    if (!usuario) return;

    // 1. Prepara os dados para o Backend
    const payload = {
        aluno: usuario.id,
        disponibilidade: idDisponibilidade,
        // O status padrão já é 'AGENDADO' no modelo, mas podemos reforçar
        status: 'AGENDADO'
    };

    try {
        // 2. Faz a requisição POST para salvar no banco
        const response = await fetch('/api/agendamentos/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // 3. Sucesso: Fecha modal e avisa
            const modalElemento = document.getElementById('modal-agendamento');
            const modalInstance = bootstrap.Modal.getInstance(modalElemento);
            modalInstance.hide();

            const toastEl = document.getElementById('toast-sistema');
            const toastMsg = document.getElementById('toast-mensagem');
            const toastIcone = document.getElementById('toast-icone');
            
            toastEl.className = 'toast align-items-center text-white border-0 bg-success';
            toastIcone.className = 'bi bi-check-circle-fill me-2';
            toastMsg.innerText = `Sucesso! Aula agendada com ${nomeProf} dia ${data} às ${hora}.`;

            const toastBootstrap = new bootstrap.Toast(toastEl);
            toastBootstrap.show();

            // Opcional: Recarregar a lista de professores para atualizar a disponibilidade (se ela sumir após agendar)
            obterConteudoExplorar().then(html => {
               // Se quisesse atualizar a tela na hora...
            });

        } else {
            const erro = await response.json();
            console.error(erro);
            alert("Erro ao agendar: " + JSON.stringify(erro));
        }

    } catch (error) {
        console.error(error);
        alert("Erro de conexão ao tentar agendar.");
    }
}

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
        const timestamp = new Date().getTime();
        // Filtramos para trazer apenas quem tem horários, se quiser, ou trazemos tudo
        const response = await fetch(`/api/professores/?t=${timestamp}`);
        const dadosApi = await response.json();

        window.listaDeProfessores = dadosApi.map(prof => {
            let materiasLista = prof.disciplinas || [];
            
            const listaHorarios = prof.disponibilidades 
                ? prof.disponibilidades.map(d => {
                    // Filtro visual: Se a disponibilidade já não estiver "disponivel", você pode querer esconder aqui
                    // Mas vamos deixar aparecer tudo por enquanto.
                    
                    const partesData = d.data.split('-'); 
                    const dia = partesData[2];
                    const mes = partesData[1];
                    const hora = d.horario_inicio.slice(0, 5); 
                    const nomeDisc = d.disciplina_nome || 'Geral';
                    
                    if (materiasLista.length === 0 && d.disciplina_nome) {
                        if (!materiasLista.includes(d.disciplina_nome)) materiasLista.push(d.disciplina_nome);
                    }

                    return {
                        id: d.id, // ID REAL da Disponibilidade
                        disciplina: nomeDisc,
                        assunto: d.assunto,
                        nivel: d.nivel,
                        descricao: d.descricao,
                        hora: hora,
                        dataFormatada: `${dia}/${mes}`,
                        dataExtenso: `${dia}/${mes}`
                    };
                  }) 
                : []; 

            const materiaPrincipal = materiasLista.length > 0 ? materiasLista[0] : 'Multidisciplinar';
            const textoDescricao = materiasLista.length > 0 
                ? `Professor de ${materiasLista.join(', ')}` 
                : 'Professor voluntário disponível.';

            return {
                id: prof.id,
                nome: prof.nome,
                materia: materiaPrincipal,
                descricao: textoDescricao,
                corBadge: 'bg-primary', 
                horarios: listaHorarios 
            };
        });

        if (window.listaDeProfessores.length === 0) {
            htmlProfessores = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">Nenhum professor encontrado.</p>
                </div>`;
        } else {
            htmlProfessores = window.listaDeProfessores.map(prof => criarCardProfessor(prof)).join('');
        }
    } catch (error) {
        console.error(error);
        htmlProfessores = '<p class="text-danger text-center">Erro ao carregar professores.</p>';
    }

    return `
    <div class="container py-5">
        <h2 class="mb-4 fw-bold text-primary">Professores Disponíveis</h2>
        <div class="row">
            ${htmlProfessores}
        </div>
    </div>
    `;
}