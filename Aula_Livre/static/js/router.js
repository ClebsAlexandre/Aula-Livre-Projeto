import { obterConteudoHome } from './views/home.js';               // Importa o template da Home.
import { obterConteudoExplorar } from './views/explorar.js';       // Importa a lógica de exploração.
import { obterConteudoDashboard, adicionarHorario } from './views/dashboard.js'; // Importa a lógica do Dashboard e a função de adicionar horário.
import { authService } from './services/auth.js';                 // Importa o serviço para checagem de estado do usuário.

const rotas = {
    // Mapeamento das rotas: Associa um nome de rota à função que renderiza o conteúdo (as views).
    '/': obterConteudoHome,
    'home': obterConteudoHome,
    'explorar': obterConteudoExplorar,
    'dashboard': obterConteudoDashboard
};

// Define quais rotas exigem login (Segurança de Rotas).
const rotasProtegidas = ['dashboard'];

async function navegar(rota) {
    // --- LÓGICA DE SEGURANÇA (Gatekeeper) ---
    // Verifica se a rota é protegida E se o usuário NÃO está logado.
    if (rotasProtegidas.includes(rota) && !authService.usuarioEstaLogado()) {
        window.mostrarNotificacao('Você precisa fazer login para acessar essa página.', 'erro');
        navegar('home'); // Redireciona para home.
        
        // Abre o modal de login automaticamente para melhorar a UX.
        const modalEl = document.getElementById('modal-entrar');
        if (modalEl) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
        return; // Interrompe a renderização da página protegida.
    }

    const app = document.getElementById('conteudo-principal');
    const viewRender = rotas[rota] || rotas['home']; // Se a rota não for encontrada, volta para a home.
    
    // 1. Renderiza o HTML da página (Injeta o template assíncrono na div principal).
    app.innerHTML = await viewRender();
    
    // 2. Se estiver na Home, configura o painel correto (Visitante/Aluno/Professor).
    if (rota === 'home' || rota === '/') {
        atualizarViewHome();
    }

    // Atualiza URL e scroll (Comportamento de SPA).
    window.location.hash = rota;
    window.scrollTo(0, 0);
}

// --- FUNÇÕES DE UI ---

// Controla o que aparece na tela inicial (Aluno vs Professor vs Visitante).
function atualizarViewHome() {
    const usuario = authService.getUsuario();
    
    const painelVisitante = document.getElementById('painel-visitante');
    const painelAluno = document.getElementById('painel-aluno');
    const painelProfessor = document.getElementById('painel-professor');
    const nomeUser = document.getElementById('nome-usuario');
    const subTitulo = document.getElementById('subtitulo-boas-vindas');

    if (!painelVisitante) return; // Evita erro se o elemento não estiver no DOM.

    if (usuario) {
        // --- LOGADO ---
        if (nomeUser) nomeUser.innerText = usuario.nome;
        if (subTitulo) subTitulo.innerText = "Bem-vindo ao seu portal de ensino.";

        painelVisitante.classList.add('d-none'); // Esconde o painel de visitante.

        // Lógica de Diferenciação de Papel (Mostra apenas o painel relevante).
        if (usuario.tipo === 'PROFESSOR' || usuario.tipo === 'professor') {
            painelProfessor.classList.remove('d-none');
            painelAluno.classList.add('d-none');
        } else {
            painelAluno.classList.remove('d-none');
            painelProfessor.classList.add('d-none');
        }
    } else {
        // --- VISITANTE ---
        if (nomeUser) nomeUser.innerText = "Visitante";
        
        painelVisitante.classList.remove('d-none');
        if (painelAluno) painelAluno.classList.add('d-none');
        if (painelProfessor) painelProfessor.classList.add('d-none');
    }
}

// Busca as disciplinas na API para preencher o Select do Modal.
async function carregarOpcoesDisciplinas() {
    const select = document.getElementById('horario-disciplina');
    // Se o elemento não existir na página (modal não carregado), ignora.
    if (!select) return;

    try {
        const response = await fetch('/api/disciplinas/');
        
        if (response.ok) {
            const disciplinas = await response.json();

            // Limpa o texto "Carregando..." e poe a opção padrão.
            select.innerHTML = '<option selected disabled value="">Selecione a disciplina</option>';

            // Cria as opções vindas do banco de dados (DRF).
            disciplinas.forEach(disc => {
                const option = document.createElement('option');
                option.value = disc.id; // CRÍTICO: Envia o ID pro backend para ligar a FK.
                option.innerText = disc.nome; 
                select.appendChild(option);
            });
        } else {
            console.error('Erro ao buscar disciplinas');
            select.innerHTML = '<option disabled>Erro ao carregar lista</option>';
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
    }
}

window.mostrarNotificacao = function(mensagem, tipo = 'sucesso') {
    // Função global de notificação Toast (configurada no index.html).
    const toastEl = document.getElementById('toast-sistema');
    const toastIcone = document.getElementById('toast-icone');
    const toastMsg = document.getElementById('toast-mensagem');

    if (!toastEl) return;

    // Lógica de estilo dinâmico (sucesso = verde, erro = vermelho).
    if (tipo === 'sucesso') {
        toastEl.className = 'toast align-items-center text-white border-0 bg-success';
        toastIcone.className = 'bi bi-check-circle-fill me-2';
    } else {
        toastEl.className = 'toast align-items-center text-white border-0 bg-danger';
        toastIcone.className = 'bi bi-exclamation-triangle-fill me-2';
    }

    toastMsg.innerText = mensagem || "Notificação do sistema";
    const toastBootstrap = new bootstrap.Toast(toastEl);
    toastBootstrap.show();
}

function atualizarNavbar() {
    const usuario = authService.getUsuario();
    const navVisitante = document.getElementById('nav-visitante');
    const navLogado = document.getElementById('nav-logado');
    const spanNome = document.getElementById('nome-usuario-nav');
    const linkExplorar = document.getElementById('link-explorar');

    if (usuario) {
        navVisitante.classList.add('d-none');
        navLogado.classList.remove('d-none');
        spanNome.innerText = usuario.nome.split(' ')[0];

        // Lógica de Diferenciação: Professores não precisam de 'Explorar' (A busca é para Alunos).
        if (usuario.tipo === 'PROFESSOR' || usuario.tipo === 'professor') {
            linkExplorar.classList.add('d-none');
        } else {
            linkExplorar.classList.remove('d-none');
        }

    } else {
        // Estado de Visitante.
        navVisitante.classList.remove('d-none');
        navLogado.classList.add('d-none');
        linkExplorar.classList.remove('d-none');
    }
}

function configurarLogin() {
    const formLogin = document.getElementById('form-login');
    if (!formLogin) return;

    // Clonagem de Formulário: Essencial para evitar o bug de múltiplos event listeners em SPAs.
    const novoForm = formLogin.cloneNode(true);
    formLogin.parentNode.replaceChild(novoForm, formLogin);

    novoForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede o envio tradicional do formulário (que faria o refresh).

        const email = document.getElementById('campo-email').value;
        const senha = document.getElementById('campo-senha').value;

        const resultado = await authService.logar(email, senha);

        if (resultado.sucesso) {
            // Sucesso: Fecha modal, atualiza UI e navega para a Home (ou a view que estava antes).
            const modalEl = document.getElementById('modal-entrar');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            atualizarNavbar();
            
            await navegar('home'); 
            
            const nomeUser = authService.getUsuario() ? authService.getUsuario().nome : 'Usuário';
            window.mostrarNotificacao(`Bem vindo de volta, ${nomeUser}!`, 'sucesso');
        } else {
            window.mostrarNotificacao(resultado.erro, 'erro');
        }
    });
}

function configurarCadastro() {
    const formCadastro = document.getElementById('form-cadastro');
    if (!formCadastro) return; 

    // Clonagem de Formulário para garantir listeners únicos.
    const novoForm = formCadastro.cloneNode(true);
    formCadastro.parentNode.replaceChild(novoForm, formCadastro);

    novoForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const nome = document.getElementById('cad-nome').value;
        const email = document.getElementById('cad-email').value;
        const senha = document.getElementById('cad-senha').value;
        const tipo = document.getElementById('cad-tipo').value;

        const resultado = await authService.registrar(nome, email, senha, tipo);

        if (resultado.sucesso) {
            // Sucesso: Login automático após o cadastro.
            const modalEl = document.getElementById('modal-cadastro');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            atualizarNavbar();
            
            await navegar('home');

            window.mostrarNotificacao(`Conta criada! Bem vindo, ${nome}.`, 'sucesso');
        } else {
             window.mostrarNotificacao(resultado.erro, 'erro');
        }
    });
}

function configurarGestaoHorarios() {
    const formHorario = document.getElementById('form-novo-horario');
    if (!formHorario) return;

    // Clonagem de Formulário.
    const novoForm = formHorario.cloneNode(true);
    formHorario.parentNode.replaceChild(novoForm, formHorario);

    novoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Mapeia os dados do formulário para o formato esperado pela função de lógica.
        const dadosAula = {
            dia: document.getElementById('horario-dia').value,
            hora: document.getElementById('horario-hora').value,
            disciplina: document.getElementById('horario-disciplina').value,
            nivel: document.getElementById('horario-nivel').value,
            assunto: document.getElementById('horario-assunto').value,
            link: document.getElementById('horario-link').value
        };

        // Chama a função de negócio (adicionarHorario) do dashboard.js.
        await adicionarHorario(dadosAula);

        const modalEl = document.getElementById('modal-novo-horario');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        navegar('dashboard'); // Redireciona para o painel de gerenciamento.
    });
}

function configurarDisciplinas() {
    const formDisc = document.getElementById('form-disciplinas');
    if (!formDisc) return;

    // Clonagem de Formulário.
    const novoForm = formDisc.cloneNode(true);
    formDisc.parentNode.replaceChild(novoForm, formDisc);

    novoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Simulação de salvamento de preferências.
        const modalEl = document.getElementById('modal-disciplinas');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        window.mostrarNotificacao('Preferências salvas (Simulação).', 'sucesso');
        navegar('dashboard');
    });
}

// --- ATUALIZAÇÃO DO LOGOUT ---
function configurarLogout() {
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            
            // 1. Requisição ASYNC para encerrar a sessão no servidor Django.
            try {
                await fetch('/api/logout/', { 
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken') // Pega o token se possível
                    }
                });
            } catch (error) {
                console.error("Erro ao fazer logout no servidor:", error);
            }

            // 2. Limpa o estado local (Frontend) e redireciona.
            authService.deslogar();
            atualizarNavbar();
            window.mostrarNotificacao('Você saiu.', 'sucesso');
            navegar('home');
        });
    }
}

// Função auxiliar repetida (Mantida para coerência histórica do projeto).
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

// --- INICIALIZAÇÃO E EVENT LISTENERS GLOBAIS ---

document.addEventListener('click', (e) => {
    // Listener global para todos os links que têm o atributo 'data-route', implementando o roteamento SPA.
    const link = e.target.closest('[data-route]');
    if (link) {
        e.preventDefault(); // Evita que o link dispare o comportamento padrão do navegador.
        const rotaDestino = link.dataset.route;
        navegar(rotaDestino);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Ponto de entrada do SPA, executado quando o DOM está pronto.
    const rotaSalva = window.location.hash.slice(1); // Lê a rota da URL (ex: #dashboard).
    navegar(rotaSalva || 'home'); // Navega para a rota salva ou para a Home se for o primeiro acesso.

    atualizarNavbar();
    // Configura todos os event listeners de formulários e ações críticas.
    configurarLogin();
    configurarCadastro();
    configurarGestaoHorarios();
    configurarDisciplinas();
    configurarLogout();

    // Carrega a lista de disciplinas na inicialização para popular modais.
    carregarOpcoesDisciplinas();
});