// js/views/dashboard.js

import { authService } from '../services/auth.js';


const mockAulasAluno = []; // Lista vazia de aulas

export const mockHorariosProfessor = []; // Lista vazia de agenda

let minhasDisciplinasMock = []; // Lista vazia de disciplinas

// --- VARIAVEIS GLOBAIS ---
let acaoPendente = null;
let idPendente = null;
let modalConfirmacaoInstance = null;
let idAulaSendoAvaliada = null; 

// --- FUNCOES AUXILIARES ---

function notificarSeguro(msg, tipo) {
    if (typeof window.mostrarNotificacao === 'function') {
        window.mostrarNotificacao(msg, tipo);
    } else {
        alert(msg); 
    }
}

window.solicitarGerenciamento = function(id, acao) {
    acaoPendente = acao;
    idPendente = id;
    const txtConfirmacao = document.getElementById('texto-confirmacao');
    
    if (acao === 'concluir') txtConfirmacao.innerText = 'Deseja marcar esta aula como concluída?';
    else if (acao === 'cancelar') txtConfirmacao.innerText = 'Deseja cancelar o agendamento?';
    else if (acao === 'excluir') txtConfirmacao.innerText = 'Excluir este horário?';

    const modalEl = document.getElementById('modal-confirmacao');
    if (!modalConfirmacaoInstance) {
        modalConfirmacaoInstance = new bootstrap.Modal(modalEl);
    }
    modalConfirmacaoInstance.show();
}

window.confirmarAcaoPendente = function() {
    const index = mockHorariosProfessor.findIndex(h => h.id == idPendente);
    
    if (index !== -1) {
        const horario = mockHorariosProfessor[index];
        if (acaoPendente === 'concluir') {
            horario.status = 'Concluído';
            horario.cor = 'bg-success';
            notificarSeguro('Aula concluída!', 'sucesso');
        } else if (acaoPendente === 'cancelar') {
            horario.status = 'Livre';
            horario.aluno = '-';
            horario.cor = 'bg-info text-dark';
            notificarSeguro('Cancelado.', 'sucesso');
        } else if (acaoPendente === 'excluir') {
            mockHorariosProfessor.splice(index, 1);
            notificarSeguro('Horário excluído.', 'sucesso');
        }
    }
    if (modalConfirmacaoInstance) modalConfirmacaoInstance.hide();
    setTimeout(() => { document.getElementById('conteudo-principal').innerHTML = obterConteudoDashboard(); }, 200);
}

window.selecionarEstrela = function(nota) { 
    if (document.getElementById('nota-final').disabled) return;

    document.getElementById('nota-final').value = nota; 
    const estrelas = document.querySelectorAll('.estrela-interativa'); 
    estrelas.forEach(estrela => { 
        const valorEstrela = parseInt(estrela.getAttribute('data-nota')); 
        if (valorEstrela <= nota) { 
            estrela.classList.remove('bi-star'); 
            estrela.classList.add('bi-star-fill'); 
        } else { 
            estrela.classList.remove('bi-star-fill'); 
            estrela.classList.add('bi-star'); 
        } 
    }); 
}

window.abrirAvaliacao = function(idAula, nomeProfessor) { 
    idAulaSendoAvaliada = idAula; 
    
    const form = document.getElementById('form-avaliacao');
    form.reset();
    document.getElementById('nota-final').value = "0";
    document.getElementById('nota-final').disabled = false;
    
    const estrelas = document.querySelectorAll('.estrela-interativa');
    estrelas.forEach(e => {
        e.classList.remove('bi-star-fill');
        e.classList.add('bi-star');
        e.style.cursor = 'pointer'; 
    });

    const textarea = form.querySelector('textarea');
    textarea.value = '';
    textarea.disabled = false;
    
    const btnSubmit = form.querySelector('button[type="submit"]');
    btnSubmit.style.display = 'block'; 

    document.getElementById('nome-avaliado').innerText = nomeProfessor; 
    
    const modalEl = document.getElementById('modal-avaliacao'); 
    const modal = new bootstrap.Modal(modalEl); 
    modal.show(); 
}

window.verAvaliacao = function(idAula, nomeProfessor) {
    const aula = mockAulasAluno.find(a => a.id === idAula);
    if (!aula || !aula.minhaAvaliacao) return;

    const dados = aula.minhaAvaliacao;

    const estrelas = document.querySelectorAll('.estrela-interativa');
    estrelas.forEach(estrela => {
        const valorEstrela = parseInt(estrela.getAttribute('data-nota'));
        estrela.style.cursor = 'default';
        
        if (valorEstrela <= dados.nota) {
            estrela.classList.remove('bi-star');
            estrela.classList.add('bi-star-fill');
        } else {
            estrela.classList.remove('bi-star-fill');
            estrela.classList.add('bi-star');
        }
    });

    document.getElementById('nota-final').value = dados.nota;
    document.getElementById('nota-final').disabled = true;

    const textarea = document.querySelector('#form-avaliacao textarea');
    textarea.value = dados.comentario;
    textarea.disabled = true;

    const btnSubmit = document.querySelector('#form-avaliacao button[type="submit"]');
    btnSubmit.style.display = 'none';

    document.getElementById('nome-avaliado').innerText = nomeProfessor + " (Sua Avaliação)";
    
    const modalEl = document.getElementById('modal-avaliacao');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// Mantido para não quebrar o router, mas não salva nada pois a lista é vazia
window.salvarAvaliacaoMock = function(nota, comentario) {
    if (idAulaSendoAvaliada) {
        const aula = mockAulasAluno.find(a => a.id === idAulaSendoAvaliada);
        if (aula) {
            aula.avaliado = true;
            aula.minhaAvaliacao = { nota: parseInt(nota), comentario: comentario };
            document.getElementById('conteudo-principal').innerHTML = obterConteudoDashboard();
        }
    }
}

window.verCertificado = function(nomePessoa, materia) { 
    document.getElementById('cert-nome-pessoa').innerText = nomePessoa; 
    document.getElementById('cert-materia').innerText = materia; 
    const dataHoje = new Date().toLocaleDateString('pt-BR'); 
    document.getElementById('cert-data').innerText = dataHoje; 
    const modalEl = document.getElementById('modal-certificado'); 
    const modal = new bootstrap.Modal(modalEl); 
    modal.show(); 
}

// --- MODAIS DO PROFESSOR ---
export function atualizarSelectDoModal() {
    const select = document.getElementById('horario-disciplina');
    if (!select) return;
    select.innerHTML = ''; 
    if (minhasDisciplinasMock.length === 0) {
        select.innerHTML = '<option disabled selected>Selecione disciplinas no seu perfil!</option>';
    } else {
        minhasDisciplinasMock.forEach(disc => {
            const option = document.createElement('option');
            option.value = disc;
            option.innerText = disc;
            select.appendChild(option);
        });
    }
}

window.abrirModalNovoHorario = function() {
    atualizarSelectDoModal();
    const modalEl = document.getElementById('modal-novo-horario');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

export function adicionarHorarioMock(dados) {
    // Adiciona na lista temporária (funciona em tempo de execução)
    mockHorariosProfessor.push({
        id: Date.now(),
        dia: dados.dia,
        hora: dados.hora,
        disciplina: dados.disciplina,
        assunto: dados.assunto,
        nivel: dados.nivel,
        link: dados.link,
        status: "Livre",
        aluno: "-",
        cor: "bg-info text-dark"
    });
}

function gerarTagsDisciplinas() {
    if (minhasDisciplinasMock.length === 0) return '<span class="text-muted small">Nenhuma selecionada.</span>';
    return minhasDisciplinasMock.map(disc => `<span class="badge bg-light text-primary border me-1 mb-1">${disc}</span>`).join('');
}

export function salvarDisciplinasSelecionadas() {
    const checkboxes = document.querySelectorAll('#form-disciplinas input[type="checkbox"]:checked');
    minhasDisciplinasMock = [];
    checkboxes.forEach(chk => { minhasDisciplinasMock.push(chk.value); });
    atualizarSelectDoModal();
}

// --- RENDERIZADORES ---

function gerarTabelaAluno() {
    if (mockAulasAluno.length === 0) return `<tr><td colspan="5" class="text-center text-muted py-3">Nenhuma aula agendada.</td></tr>`;
    
    return mockAulasAluno.map(aula => {
        let colAvaliacao = '';
        let colCertificado = '';

        if (aula.status !== 'Concluído') {
            colAvaliacao = '<span class="text-muted small">-</span>';
            colCertificado = '<span class="text-muted small">-</span>';
        } 
        else {
            if (aula.avaliado) {
                colAvaliacao = `
                    <button class="btn btn-sm btn-info text-white" onclick="window.verAvaliacao(${aula.id}, '${aula.professor}')">
                        <i class="bi bi-eye-fill me-1"></i> Ver Avaliação
                    </button>`;
                
                colCertificado = `
                    <button class="btn btn-sm btn-outline-dark" onclick="window.verCertificado('${authService.getUsuario().nome}', '${aula.materia}')">
                        <i class="bi bi-award-fill me-1"></i> Certificado
                    </button>`;
            } else {
                colAvaliacao = `
                    <button class="btn btn-sm btn-warning fw-bold" onclick="window.abrirAvaliacao(${aula.id}, '${aula.professor}')">
                        <i class="bi bi-star-fill me-1"></i> Avaliar Aula
                    </button>`;
                
                colCertificado = `
                    <button class="btn btn-sm btn-light text-muted border" disabled title="Avalie para liberar">
                        <i class="bi bi-lock-fill me-1"></i> Bloqueado
                    </button>`;
            }
        }

        return `
        <tr>
            <td>
                <div class="fw-bold">${aula.materia}</div>
                <small class="text-muted">Prof. ${aula.professor}</small>
            </td>
            <td class="align-middle">${aula.data}</td>
            <td class="align-middle">
                <span class="badge ${aula.cor}">${aula.status}</span>
                ${aula.status !== 'Concluído' ? '<br><small class="text-primary" style="cursor:pointer">Link da aula</small>' : ''}
            </td>
            <td class="align-middle text-center">
                ${colAvaliacao}
            </td>
            <td class="text-end align-middle">
                ${colCertificado}
            </td>
        </tr>`;
    }).join('');
}

function renderPainelAluno(usuario) {
    return `
    <div class="container py-5">
        <div class="row mb-4 align-items-center">
            <div class="col">
                <h2 class="fw-bold text-primary">Área do Aluno</h2>
                <p class="text-muted">Bons estudos, <strong>${usuario.nome}</strong>!</p>
            </div>
            <div class="col-auto">
                <button class="btn botao-verde" data-route="explorar">
                    <i class="bi bi-search me-1"></i> Buscar Professor
                </button>
            </div>
        </div>

        <div class="row mb-5">
            <div class="col-md-4 mb-3">
                <div class="card border-0 shadow-sm p-3">
                    <div class="d-flex align-items-center">
                        <div class="bg-light p-3 rounded-circle me-3 text-primary"><i class="bi bi-journal-bookmark fs-4"></i></div>
                        <div><h6 class="mb-0 text-muted">Aulas Marcadas</h6><h3 class="fw-bold mb-0">0</h3></div>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card border-0 shadow-sm p-3">
                    <div class="d-flex align-items-center">
                        <div class="bg-light p-3 rounded-circle me-3 text-success"><i class="bi bi-clock-history fs-4"></i></div>
                        <div><h6 class="mb-0 text-muted">Horas Estudadas</h6><h3 class="fw-bold mb-0">0h</h3></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3"><h5 class="mb-0 fw-bold">Minhas Aulas</h5></div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="bg-light">
                            <tr>
                                <th class="ps-4">Matéria</th>
                                <th>Data</th>
                                <th>Status</th>
                                <th class="text-center">Avaliação</th>
                                <th class="text-end pe-4">Certificado</th>
                            </tr>
                        </thead>
                        <tbody class="ps-4">${gerarTabelaAluno()}</tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>`;
}

function gerarTabelaProfessor() {
    if (mockHorariosProfessor.length === 0) return `<tr><td colspan="5" class="text-center text-muted py-3">Nenhum horário cadastrado.</td></tr>`;
    
    return mockHorariosProfessor.map(item => {
        let acoes = '';
        if (item.status === 'Agendado') {
            acoes = `<button class="btn btn-sm btn-success me-1" onclick="window.solicitarGerenciamento(${item.id}, 'concluir')" title="Concluir Aula"><i class="bi bi-check-lg"></i></button>
                     <button class="btn btn-sm btn-outline-danger" onclick="window.solicitarGerenciamento(${item.id}, 'cancelar')" title="Cancelar"><i class="bi bi-trash"></i></button>`;
        } else if (item.status === 'Livre') {
            acoes = `<button class="btn btn-sm btn-outline-danger" onclick="window.solicitarGerenciamento(${item.id}, 'excluir')" title="Excluir Horário"><i class="bi bi-trash"></i></button>`;
        } else if (item.status === 'Concluído') {
            acoes = `<span class="badge bg-success"><i class="bi bi-check-circle"></i> Finalizado</span>`;
        }

        return `
        <tr>
            <td>
                <div class="fw-bold text-primary">${item.disciplina || 'Geral'}</div>
                <small class="text-muted">${item.assunto || ''}</small>
                ${item.nivel ? `<br><span class="badge bg-light text-secondary border" style="font-size: 0.6rem">${item.nivel}</span>` : ''}
            </td>
            <td class="align-middle">
                <div class="fw-bold">${item.dia}</div>
                <small>${item.hora}</small>
            </td>
            <td class="align-middle">
                <span class="badge ${item.cor}">${item.status}</span>
                ${item.aluno !== '-' ? `<div class="small mt-1"><i class="bi bi-person"></i> ${item.aluno}</div>` : ''}
            </td>
            <td class="text-end align-middle">${acoes}</td>
        </tr>`;
    }).join('');
}

function renderPainelProfessor(usuario) {
    setTimeout(atualizarSelectDoModal, 100);

    return `
    <div class="container py-5">
        <div class="row mb-4 align-items-center">
            <div class="col">
                <h2 class="fw-bold text-primary">Painel do Professor</h2>
                <p class="text-muted">Bem vindo, <strong>${usuario.nome}</strong>!</p>
            </div>
            <div class="col-auto">
                <button class="btn botao-verde" onclick="window.abrirModalNovoHorario()">
                    <i class="bi bi-plus-circle me-1"></i> Novo Horário
                </button>
            </div>
        </div>

        <div class="row mb-5">
            <div class="col-md-4 mb-3"><div class="card border-0 shadow-sm p-3 h-100"><div class="d-flex align-items-center"><div class="bg-light p-3 rounded-circle me-3 text-warning"><i class="bi bi-people fs-4"></i></div><div><h6 class="mb-0 text-muted">Alunos</h6><h3 class="fw-bold mb-0">0</h3></div></div></div></div>
            <div class="col-md-4 mb-3"><div class="card border-0 shadow-sm p-3 h-100"><div class="d-flex align-items-center"><div class="bg-light p-3 rounded-circle me-3 text-info"><i class="bi bi-patch-check fs-4"></i></div><div><h6 class="mb-0 text-muted">Horas</h6><h3 class="fw-bold mb-0">0h</h3></div></div></div></div>
            
            <div class="col-md-4 mb-3">
                <div class="card border-0 shadow-sm p-3 h-100">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="d-flex align-items-center">
                            <div class="bg-light p-3 rounded-circle me-3 text-primary"><i class="bi bi-book fs-4"></i></div>
                            <div><h6 class="mb-1 text-muted">Leciono:</h6><div>${gerarTagsDisciplinas()}</div></div>
                        </div>
                        <button class="btn btn-sm btn-link text-decoration-none" data-bs-toggle="modal" data-bs-target="#modal-disciplinas">Editar</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3"><h5 class="mb-0 fw-bold">Minha Agenda</h5></div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="bg-light">
                            <tr><th class="ps-4">Conteúdo</th><th>Dia/Hora</th><th>Status</th><th class="text-end pe-4">Ação</th></tr>
                        </thead>
                        <tbody class="ps-4">${gerarTabelaProfessor()}</tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>`;
}

export function obterConteudoDashboard() {
    const usuario = authService.getUsuario();
    if (!usuario) return '';
    return (usuario.tipo === 'professor') ? renderPainelProfessor(usuario) : renderPainelAluno(usuario);
}