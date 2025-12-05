import { authService } from '../services/auth.js'; // Importa o serviço de autenticação para checagem de login.

// Inicializa a lista global - Funciona como um cache local dos professores.
// É usado para buscar rapidamente os dados de um professor ao abrir o modal de agendamento.
window.listaDeProfessores = []; 

function getCookie(name) {
    // Função auxiliar para obter o token CSRF, necessário para a requisição POST (agendamento).
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
    // GATE DE SEGURANÇA (Regra de Negócio):
    // Se o usuário não estiver logado, ele é impedido de ver os horários e é redirecionado para o login.
    if (!authService.usuarioEstaLogado()) {
        const modalLogin = new bootstrap.Modal(document.getElementById('modal-entrar'));
        modalLogin.show();
        return;
    }

    // Busca o professor no cache local (listaDeProfessores) usando o ID.
    const professor = window.listaDeProfessores.find(p => p.id === id);
    if (!professor) return;

    document.getElementById('titulo-modal-agendamento').innerText = `Agenda de ${professor.nome}`;

    const divHorarios = document.getElementById('lista-horarios');
    divHorarios.innerHTML = ''; // Limpa o conteúdo anterior.

    // Filtra apenas os horários marcados como disponíveis (disponivel !== false) para exibição.
    const horariosDisponiveis = professor.horarios.filter(h => h.disponivel !== false);

    if (horariosDisponiveis.length === 0) {
        divHorarios.innerHTML = '<p class="text-muted text-center">Sem horários livres no momento.</p>';
    } else {
        // Renderiza um card de agendamento para cada horário disponível.
        horariosDisponiveis.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card mb-3 border-primary';
            
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

window.confirmarAgendamentoReal = async function(idDisponibilidade, nomeProf, data, hora) {
    // Inicia a transação de agendamento na API REST.
    const usuario = authService.getUsuario();
    if (!usuario) return;

    const payload = {
        aluno: usuario.id,              // ID do aluno logado.
        disponibilidade: idDisponibilidade, // ID do horário reservado.
        status: 'AGENDADO'               // Define o status inicial (Aguardando Confirmação).
    };

    try {
        const response = await fetch('/api/agendamentos/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken') // Token de segurança obrigatório.
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // FLUXO DE SUCESSO: Feedback visual e atualização de estado.
            const modalElemento = document.getElementById('modal-agendamento');
            const modalInstance = bootstrap.Modal.getInstance(modalElemento);
            modalInstance.hide(); // Fecha o modal de horários.

            // Notificação de Sucesso (Toast)
            const toastEl = document.getElementById('toast-sistema');
            const toastMsg = document.getElementById('toast-mensagem');
            const toastIcone = document.getElementById('toast-icone');
            
            toastEl.className = 'toast align-items-center text-white border-0 bg-success';
            toastIcone.className = 'bi bi-check-circle-fill me-2';
            toastMsg.innerText = `Sucesso! Aula agendada com ${nomeProf} dia ${data} às ${hora}.`;

            const toastBootstrap = new bootstrap.Toast(toastEl);
            toastBootstrap.show();

            // Atualiza a lista em segundo plano (O horário reservado deve sumir da lista de disponíveis).
            obterConteudoExplorar();

        } else {
            // Tratamento de erros de API (ex: horário já reservado, problema de validação).
            const erro = await response.json();
            console.error(erro);
            alert("Erro ao agendar: " + (erro.detail || "Verifique os dados."));
        }

    } catch (error) {
        console.error(error);
        alert("Erro de conexão ao tentar agendar.");
    }
}

function criarCardProfessor(professor) {
    // Renderiza o card individual de um professor na tela de exploração.
    const estaLogado = authService.usuarioEstaLogado();
    let botaoAcao = '';

    if (estaLogado) {
        // Ação para usuário logado: Permite ver os horários para agendar.
        botaoAcao = `
        <button class="btn btn-outline-primary btn-sm" onclick="window.abrirModalAgendamento(${professor.id})">
            Ver Horários
        </button>`;
    } else {
        // Ação para visitante: Exibe o gate de login.
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
    // Função principal exportada: Busca dados e renderiza a tela de Exploração.
    let htmlProfessores = '';

    try {
        const timestamp = new Date().getTime(); // Parâmetro anti-cache.
        // Busca todos os professores e suas disponibilidades aninhadas (otimização de API).
        const response = await fetch(`/api/professores/?t=${timestamp}`);
        const dadosApi = await response.json();

        // Mapeamento e Transformação de Dados: Converte a resposta da API para o formato esperado pelo frontend (cache).
        window.listaDeProfessores = dadosApi.map(prof => {
            let materiasLista = prof.disciplinas || [];
            
            const listaHorarios = prof.disponibilidades 
                ? prof.disponibilidades.map(d => {
                    // Formata os campos de data e hora para exibição no modal.
                    const partesData = d.data.split('-'); 
                    const dia = partesData[2];
                    const mes = partesData[1];
                    const hora = d.horario_inicio.slice(0, 5); 
                    const nomeDisc = d.disciplina_nome || 'Geral';
                    
                    // Lógica para garantir que o 'materiaPrincipal' do card reflita os horários cadastrados.
                    if (materiasLista.length === 0 && d.disciplina_nome) {
                        if (!materiasLista.includes(d.disciplina_nome)) materiasLista.push(d.disciplina_nome);
                    }

                    return {
                        id: d.id, 
                        disciplina: nomeDisc,
                        assunto: d.assunto,
                        nivel: d.nivel,
                        descricao: d.descricao,
                        hora: hora,
                        dataFormatada: `${dia}/${mes}`,
                        dataExtenso: `${dia}/${mes}`,
                        disponivel: d.disponivel
                    };
                  }) 
                : []; // Se não houver disponibilidades, a lista fica vazia.

            const materiaPrincipal = materiasLista.length > 0 ? materiasLista[0] : 'Multidisciplinar';
            const textoDescricao = materiasLista.length > 0 
                ? `Professor de ${materiasLista.join(', ')}` 
                : 'Professor voluntário disponível.';

            return {
                id: prof.id,
                nome: prof.nome,
                materia: materiaPrincipal,
                descricao: textoDescricao,
                corBadge: 'bg-primary', // Estilo visual para o badge.
                horarios: listaHorarios 
            };
        });

        if (window.listaDeProfessores.length === 0) {
            htmlProfessores = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">Nenhum professor encontrado.</p>
                </div>`;
        } else {
            // Gera o HTML final a partir do mapeamento.
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