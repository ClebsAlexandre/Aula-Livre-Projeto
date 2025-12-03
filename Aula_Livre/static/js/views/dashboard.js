// js/views/dashboard.js

import { authService } from '../services/auth.js';

// --- VARIAVEIS GLOBAIS ---
let acaoPendente = null;
let idPendente = null;
let modalConfirmacaoInstance = null;
let tipoItemPendente = 'disponibilidade'; 
let idAulaSendoAvaliada = null;

// --- FUNCOES AUXILIARES ---
function obterProximaData(nomeDiaSemana) {
    const dias = { 'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6 };
    const hoje = new Date();
    const diaDesejado = dias[nomeDiaSemana];
    if (diaDesejado === undefined) return new Date().toISOString().split('T')[0];
    let diaAtual = hoje.getDay();
    let distancia = diaDesejado - diaAtual;
    if (distancia <= 0) distancia += 7;
    hoje.setDate(hoje.getDate() + distancia);
    return hoje.toISOString().split('T')[0]; 
}

function formatarDataBr(stringData) {
    if(!stringData) return '-';
    const partes = stringData.split('-');
    return `${partes[2]}/${partes[1]}`;
}

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

function notificarSeguro(msg, tipo) {
    if (typeof window.mostrarNotificacao === 'function') {
        window.mostrarNotificacao(msg, tipo);
    } else { alert(msg); }
}

// --- API ---
async function buscarDisciplinas() {
    try {
        const response = await fetch('/api/disciplinas/');
        if(response.ok) return await response.json();
    } catch(e) { console.error(e); }
    return [];
}

async function buscarMinhasAulas(usuario) {
    const timestamp = new Date().getTime();
    try {
        if (usuario.tipo === 'professor') {
            const [respDisp, respAgend] = await Promise.all([
                fetch(`/api/professores/${usuario.id}/?t=${timestamp}`),
                fetch(`/api/agendamentos/?professor_id=${usuario.id}&t=${timestamp}`)
            ]);
            let disponibilidades = [];
            let agendamentos = [];
            if (respDisp.ok) {
                const dados = await respDisp.json();
                disponibilidades = dados.disponibilidades || [];
            }
            if (respAgend.ok) agendamentos = await respAgend.json();
            return { disponibilidades, agendamentos };
        } else {
            const response = await fetch(`/api/agendamentos/?aluno_id=${usuario.id}&t=${timestamp}`);
            if (response.ok) return await response.json();
        }
    } catch (e) { console.error("Erro:", e); }
    return usuario.tipo === 'professor' ? { disponibilidades: [], agendamentos: [] } : [];
}

// --- INTERFACE DE GERENCIAMENTO ---
window.solicitarGerenciamento = function(id, acao, tipo = 'disponibilidade') {
    acaoPendente = acao;
    idPendente = id;
    tipoItemPendente = tipo;
    const txtConfirmacao = document.getElementById('texto-confirmacao');
    
    if (acao === 'confirmar_agendamento') txtConfirmacao.innerText = 'Aceitar pedido de aula?';
    else if (acao === 'rejeitar_agendamento') txtConfirmacao.innerText = 'Rejeitar este pedido?';
    else if (acao === 'concluir_aula') txtConfirmacao.innerText = 'Finalizar aula? O aluno poderá avaliar.';
    else if (acao === 'excluir') txtConfirmacao.innerText = 'Excluir este horário?';

    const modalEl = document.getElementById('modal-confirmacao');
    if (!modalConfirmacaoInstance) modalConfirmacaoInstance = new bootstrap.Modal(modalEl);
    modalConfirmacaoInstance.show();
}

window.confirmarAcaoPendente = async function() {
    const headers = { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') };
    try {
        if (acaoPendente === 'excluir') {
            await fetch(`/api/disponibilidades/${idPendente}/`, { method: 'DELETE', headers });
            notificarSeguro('Horário excluído.', 'sucesso');
        } else if (acaoPendente === 'confirmar_agendamento') {
            await fetch(`/api/agendamentos/${idPendente}/`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'CONFIRMADO' }) });
            notificarSeguro('Aula confirmada!', 'sucesso');
        } else if (acaoPendente === 'rejeitar_agendamento') {
            await fetch(`/api/agendamentos/${idPendente}/`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'CANCELADO' }) });
            notificarSeguro('Aula cancelada.', 'sucesso');
        } else if (acaoPendente === 'concluir_aula') {
            await fetch(`/api/agendamentos/${idPendente}/`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'CONCLUIDO' }) });
            notificarSeguro('Aula concluída!', 'sucesso');
        }
        const novoConteudo = await obterConteudoDashboard();
        document.getElementById('conteudo-principal').innerHTML = novoConteudo;
    } catch (e) {
        notificarSeguro('Erro na operação.', 'erro');
        console.error(e);
    }
    if (modalConfirmacaoInstance) modalConfirmacaoInstance.hide();
}

// --- LÓGICA DE AVALIAÇÃO (AGORA COM MODO LEITURA) ---

// 1. Função visual das estrelas
window.selecionarEstrela = function(nota) {
    // Se o campo estiver desabilitado (modo leitura), não faz nada
    if (document.getElementById('nota-final').disabled) return;

    const inputNota = document.getElementById('nota-final');
    if (inputNota) inputNota.value = nota;

    const estrelas = document.querySelectorAll('.estrela-interativa');
    estrelas.forEach(estrela => {
        const valor = parseInt(estrela.getAttribute('data-nota'));
        if (valor <= nota) {
            estrela.classList.remove('bi-star');
            estrela.classList.add('bi-star-fill', 'text-warning');
        } else {
            estrela.classList.remove('bi-star-fill', 'text-warning');
            estrela.classList.add('bi-star');
        }
    });
};

// 2. Abre modal para NOVA avaliação
window.abrirAvaliacao = function(idAgendamento, nomeProfessor) {
    idAulaSendoAvaliada = idAgendamento;
    
    // Configura Visual para Edição
    document.getElementById('nome-avaliado').innerText = nomeProfessor;
    
    const inputNota = document.getElementById('nota-final');
    inputNota.value = "0";
    inputNota.disabled = false; // Habilita edição

    const textarea = document.querySelector('#form-avaliacao textarea');
    textarea.value = "";
    textarea.disabled = false; // Habilita edição
    textarea.placeholder = "O que você achou da didática?";

    // Reseta estrelas
    const estrelas = document.querySelectorAll('.estrela-interativa');
    estrelas.forEach(e => {
        e.classList.remove('bi-star-fill', 'text-warning');
        e.classList.add('bi-star');
        e.style.cursor = 'pointer'; // Mostra que pode clicar
    });

    // Mostra botão de enviar
    const btnSubmit = document.querySelector('#form-avaliacao button[type="submit"]');
    btnSubmit.style.display = 'block';
    btnSubmit.innerText = 'Enviar Avaliação';

    // Intercepta envio
    const form = document.getElementById('form-avaliacao');
    form.onsubmit = function(event) {
        event.preventDefault();
        window.enviarAvaliacao();
    };

    new bootstrap.Modal(document.getElementById('modal-avaliacao')).show();
};

// 3. Abre modal para VER avaliação existente (Modo Leitura)
window.verAvaliacao = function(nota, comentario, nomeProfessor) {
    document.getElementById('nome-avaliado').innerText = nomeProfessor + " (Feita)";

    const inputNota = document.getElementById('nota-final');
    inputNota.value = nota;
    inputNota.disabled = true; // Bloqueia

    const textarea = document.querySelector('#form-avaliacao textarea');
    textarea.value = comentario || "Sem comentários.";
    textarea.disabled = true; // Bloqueia

    // Pinta estrelas e bloqueia clique
    const estrelas = document.querySelectorAll('.estrela-interativa');
    estrelas.forEach(estrela => {
        const valor = parseInt(estrela.getAttribute('data-nota'));
        estrela.style.cursor = 'default';
        if (valor <= nota) {
            estrela.classList.remove('bi-star');
            estrela.classList.add('bi-star-fill', 'text-warning');
        } else {
            estrela.classList.remove('bi-star-fill', 'text-warning');
            estrela.classList.add('bi-star');
        }
    });

    // Esconde botão de enviar
    const btnSubmit = document.querySelector('#form-avaliacao button[type="submit"]');
    btnSubmit.style.display = 'none';

    new bootstrap.Modal(document.getElementById('modal-avaliacao')).show();
};

// 4. Envia dados
window.enviarAvaliacao = async function() {
    const nota = document.getElementById('nota-final').value;
    const comentario = document.querySelector('#form-avaliacao textarea').value;

    if (!nota || nota === "0") {
        alert("Selecione pelo menos uma estrela.");
        return;
    }

    try {
        const response = await fetch('/api/avaliacoes/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
            body: JSON.stringify({ agendamento: idAulaSendoAvaliada, nota: parseInt(nota), comentario: comentario })
        });

        if (response.ok) {
            notificarSeguro('Avaliação enviada!', 'sucesso');
            bootstrap.Modal.getInstance(document.getElementById('modal-avaliacao')).hide();
            // Atualiza a tabela para mudar o botão para "Ver"
            document.getElementById('conteudo-principal').innerHTML = await obterConteudoDashboard();
        } else {
            alert("Erro ao salvar avaliação.");
        }
    } catch (e) { console.error(e); }
};

// --- CERTIFICADO ---
window.verCertificado = function(nomePessoa, materia) { 
    document.getElementById('cert-nome-pessoa').innerText = nomePessoa; 
    document.getElementById('cert-materia').innerText = materia; 
    document.getElementById('cert-data').innerText = new Date().toLocaleDateString('pt-BR'); 
    new bootstrap.Modal(document.getElementById('modal-certificado')).show(); 
};

// --- RENDERIZADORES ---

// Função auxiliar para escapar aspas e evitar erro no HTML onclick
function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function gerarTabelaAluno(listaAgendamentos) {
    if (listaAgendamentos.length === 0) return `<tr><td colspan="5" class="text-center text-muted py-3">Nenhuma aula.</td></tr>`;
    
    return listaAgendamentos.map(aula => {
        let statusBadge = '';
        let acoes = '';

        if (aula.status === 'AGENDADO') {
            statusBadge = '<span class="badge bg-warning text-dark">Aguardando</span>';
            acoes = '<small class="text-muted">Aguarde o prof.</small>';
        } else if (aula.status === 'CONFIRMADO') {
            statusBadge = '<span class="badge bg-primary">Confirmado</span>';
            acoes = aula.link_aula ? `<a href="${aula.link_aula}" target="_blank" class="btn btn-sm btn-outline-primary">Acessar Aula</a>` : 'Link indisponível';
        } else if (aula.status === 'CONCLUIDO') {
            statusBadge = '<span class="badge bg-success">Concluído</span>';
            
            // SE TIVER AVALIAÇÃO, MUDA O BOTÃO
            let botaoAvaliacao = '';
            if (aula.avaliacao) {
                // Já avaliou: Botão Azul (Ver)
                // Usamos escapeHtml para evitar bugs se o comentario tiver aspas
                botaoAvaliacao = `
                    <button class="btn btn-sm btn-info text-white me-1" 
                            onclick="window.verAvaliacao(${aula.avaliacao.nota}, '${escapeHtml(aula.avaliacao.comentario)}', '${aula.professor_nome}')">
                        <i class="bi bi-eye-fill"></i> Ver Avaliação
                    </button>`;
            } else {
                // Não avaliou: Botão Amarelo (Avaliar)
                botaoAvaliacao = `
                    <button class="btn btn-sm btn-warning me-1" 
                            onclick="window.abrirAvaliacao(${aula.id}, '${aula.professor_nome}')">
                        <i class="bi bi-star"></i> Avaliar
                    </button>`;
            }

            acoes = `
                ${botaoAvaliacao}
                <button class="btn btn-sm btn-dark" onclick="window.verCertificado('${aula.aluno_nome}', '${aula.disciplina_nome}')">
                    <i class="bi bi-award"></i> Certificado
                </button>
            `;
        } else if (aula.status === 'CANCELADO') {
            statusBadge = '<span class="badge bg-danger">Cancelado</span>';
            acoes = '-';
        }

        return `
        <tr>
            <td><div class="fw-bold">${aula.disciplina_nome || 'Aula'}</div><small class="text-muted">Prof. ${aula.professor_nome}</small></td>
            <td class="align-middle">${formatarDataBr(aula.data)} - ${aula.hora.slice(0,5)}</td>
            <td class="align-middle">${statusBadge}</td>
            <td class="align-middle text-center"> - </td>
            <td class="text-end align-middle">${acoes}</td>
        </tr>`;
    }).join('');
}

// --- REPETINDO FUNÇÕES DO PROFESSOR PARA O ARQUIVO FICAR COMPLETO ---
export async function atualizarSelectDoModal() {
    const select = document.getElementById('horario-disciplina');
    if (!select) return;
    select.innerHTML = '<option disabled selected>Carregando...</option>';
    const disciplinas = await buscarDisciplinas();
    select.innerHTML = ''; 
    if (disciplinas.length === 0) select.innerHTML = '<option disabled>Nenhuma disciplina</option>';
    else disciplinas.forEach(disc => {
        const option = document.createElement('option');
        option.value = disc.nome; option.innerText = disc.nome;
        select.appendChild(option);
    });
}

window.abrirModalNovoHorario = function() {
    atualizarSelectDoModal();
    new bootstrap.Modal(document.getElementById('modal-novo-horario')).show();
}

export const adicionarHorarioMock = async (dados) => {
    const usuario = authService.getUsuario();
    const todasDisciplinas = await buscarDisciplinas();
    const disciplinaEncontrada = todasDisciplinas.find(d => d.nome === dados.disciplina);
    const disciplinaId = disciplinaEncontrada ? disciplinaEncontrada.id : null;
    const descEl = document.getElementById('horario-descricao');
    const descricaoValor = descEl ? descEl.value : '';

    const payload = {
        professor: usuario.id, disciplina: disciplinaId,
        assunto: dados.assunto, nivel: dados.nivel, descricao: descricaoValor,
        link: dados.link, data: obterProximaData(dados.dia), horario_inicio: dados.hora,
        disponivel: true
    };
    try {
        const response = await fetch('/api/disponibilidades/', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Falha");
        document.getElementById('conteudo-principal').innerHTML = await obterConteudoDashboard();
        notificarSeguro('Horário publicado!', 'sucesso');
    } catch (e) { console.error("Erro:", e); alert("Erro ao criar horário."); }
}

function gerarTabelaProfessor(dados) {
    const horariosLivres = dados.disponibilidades.filter(d => d.disponivel === true);
    const agendamentosPendentes = dados.agendamentos.filter(a => a.status === 'AGENDADO');
    const agendamentosConfirmados = dados.agendamentos.filter(a => a.status === 'CONFIRMADO');

    let html = '';
    if (agendamentosPendentes.length > 0) {
        html += `<tr class="table-warning"><td colspan="4" class="fw-bold text-dark"><i class="bi bi-exclamation-circle-fill me-2"></i> Pedidos Pendentes</td></tr>`;
        html += agendamentosPendentes.map(ag => `<tr><td><div class="fw-bold">${ag.disciplina_nome}</div><small>${ag.aluno_nome}</small></td><td>${formatarDataBr(ag.data)} - ${ag.hora.slice(0,5)}</td><td><span class="badge bg-warning text-dark">Pendente</span></td><td class="text-end"><button class="btn btn-sm btn-success me-1" onclick="window.solicitarGerenciamento(${ag.id}, 'confirmar_agendamento', 'agendamento')">Aceitar</button><button class="btn btn-sm btn-danger" onclick="window.solicitarGerenciamento(${ag.id}, 'rejeitar_agendamento', 'agendamento')">Rejeitar</button></td></tr>`).join('');
    }
    if (agendamentosConfirmados.length > 0) {
        html += `<tr class="table-success"><td colspan="4" class="fw-bold text-dark"><i class="bi bi-check-circle-fill me-2"></i> Aulas Confirmadas</td></tr>`;
        html += agendamentosConfirmados.map(ag => `<tr><td><div class="fw-bold">${ag.disciplina_nome}</div><small>${ag.aluno_nome}</small></td><td>${formatarDataBr(ag.data)} - ${ag.hora.slice(0,5)}</td><td><span class="badge bg-success">Confirmado</span></td><td class="text-end"><button class="btn btn-sm btn-success me-1" onclick="window.solicitarGerenciamento(${ag.id}, 'concluir_aula', 'agendamento')">Concluir</button><button class="btn btn-sm btn-outline-danger" onclick="window.solicitarGerenciamento(${ag.id}, 'rejeitar_agendamento', 'agendamento')">Cancelar</button></td></tr>`).join('');
    }
    html += `<tr class="table-light"><td colspan="4" class="fw-bold text-muted"><i class="bi bi-calendar me-2"></i> Horários Livres</td></tr>`;
    if (horariosLivres.length === 0) html += `<tr><td colspan="4" class="text-center text-muted small py-2">Sem horários livres.</td></tr>`;
    else html += horariosLivres.map(item => `<tr><td><div class="fw-bold text-primary">${item.assunto || 'Livre'}</div><small>${item.disciplina_nome || 'Geral'}</small></td><td>${formatarDataBr(item.data)} - ${item.horario_inicio.slice(0,5)}</td><td><span class="badge bg-info text-dark">Disponível</span></td><td class="text-end"><button class="btn btn-sm btn-outline-danger" onclick="window.solicitarGerenciamento(${item.id}, 'excluir', 'disponibilidade')"><i class="bi bi-trash"></i></button></td></tr>`).join('');
    return html;
}

async function renderPainelProfessor(usuario) {
    const dados = await buscarMinhasAulas(usuario);
    return `<div class="container py-5"><div class="row mb-4 align-items-center"><div class="col"><h2 class="fw-bold text-primary">Painel do Professor</h2><p class="text-muted">Bem vindo, ${usuario.nome}!</p></div><div class="col-auto"><button class="btn botao-verde" onclick="window.abrirModalNovoHorario()">Novo Horário</button></div></div><div class="card border-0 shadow-sm"><div class="card-body p-0"><div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="bg-light"><tr><th class="ps-4">Conteúdo</th><th>Dia/Hora</th><th>Status</th><th class="text-end pe-4">Ação</th></tr></thead><tbody class="ps-4">${gerarTabelaProfessor(dados)}</tbody></table></div></div></div></div>`;
}

async function renderPainelAluno(usuario) {
    const listaAgendamentos = await buscarMinhasAulas(usuario);
    return `<div class="container py-5"><div class="row mb-4 align-items-center"><div class="col"><h2 class="fw-bold text-primary">Área do Aluno</h2><p class="text-muted">Bons estudos, ${usuario.nome}!</p></div><div class="col-auto"><button class="btn botao-verde" data-route="explorar">Buscar Professor</button></div></div><div class="card border-0 shadow-sm"><div class="card-body p-0"><div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="bg-light"><tr><th class="ps-4">Matéria</th><th>Data</th><th>Status</th><th class="text-center">Avaliação</th><th class="text-end pe-4">Acesso</th></tr></thead><tbody class="ps-4">${gerarTabelaAluno(listaAgendamentos)}</tbody></table></div></div></div></div>`;
}

export async function obterConteudoDashboard() {
    const usuario = authService.getUsuario();
    if (!usuario) return '';
    return (usuario.tipo === 'professor') ? await renderPainelProfessor(usuario) : await renderPainelAluno(usuario);
}

export function salvarDisciplinasSelecionadas() {}