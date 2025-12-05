// js/services/auth.js

const CHAVE_USUARIO = 'aulalivre_usuario'; // Chave de armazenamento local para persistência do estado do usuário.
const API_BASE_URL = '/api'; // Ponto de entrada padrão para todas as chamadas do Django REST Framework.

function getCookie(name) {
    // Função auxiliar fundamental para extrair o token CSRF do cookie.
    // O token é obrigatório para todas as requisições POST seguras no Django.
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

export const authService = {
    
    logar: async (email, senha) => {
        try {
            const response = await fetch(`${API_BASE_URL}/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken') // Inclusão obrigatória do token de segurança.
                },
                body: JSON.stringify({ email, senha })
            });

            if (response.ok) {
                const dados = await response.json();
                // Persistência: Guarda os dados não sensíveis do usuário no navegador (localStorage).
                localStorage.setItem(CHAVE_USUARIO, JSON.stringify(dados));
                return { sucesso: true };
            } else {
                // Tratamento de erro detalhado vindo do backend (Django).
                const erro = await response.json();
                return { sucesso: false, erro: erro.detail || 'Falha no login' };
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            return { sucesso: false, erro: 'Erro de conexão com o servidor.' };
        }
    },

    registrar: async (nome, email, senha, tipo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/cadastro/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                // Regra de Coerência: Garante que o tipo (ALUNO/PROFESSOR) seja enviado em maiúsculo para bater com o modelo do Django.
                body: JSON.stringify({ 
                    nome, 
                    email, 
                    senha, 
                    tipo: tipo.toUpperCase() 
                })
            });

            if (response.ok) {
                const dados = await response.json();
                // Após o registro, o usuário já é autenticado e seu estado é salvo no localStorage.
                localStorage.setItem(CHAVE_USUARIO, JSON.stringify(dados));
                return { sucesso: true };
            } else {
                const erro = await response.json();
                return { sucesso: false, erro: erro.detail || 'Falha no cadastro' };
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            return { sucesso: false, erro: 'Erro de conexão com o servidor.' };
        }
    },

    deslogar: () => {
        // Limpa o estado local do usuário. O evento de logout no Django é disparado separadamente (ver router.js).
        localStorage.removeItem(CHAVE_USUARIO);
    },

    usuarioEstaLogado: () => {
        // Checagem simples de estado baseada na existência da chave no localStorage.
        const usuario = localStorage.getItem(CHAVE_USUARIO);
        return !!usuario;
    },

    getUsuario: () => {
        // Recupera os dados do usuário, usados para personalizar a interface (nome, tipo de perfil).
        const usuario = localStorage.getItem(CHAVE_USUARIO);
        return usuario ? JSON.parse(usuario) : null;
    }
};