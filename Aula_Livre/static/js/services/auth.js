// js/services/auth.js

const CHAVE_USUARIO = 'aulalivre_usuario'; // Chave de armazenamento local.
const API_BASE_URL = '/api'; // Ponto de entrada da API.

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

export const authService = {
    
    logar: async (email, senha) => {
        try {
            const response = await fetch(`${API_BASE_URL}/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ email, senha })
            });

            if (response.ok) {
                const dados = await response.json();
                localStorage.setItem(CHAVE_USUARIO, JSON.stringify(dados));
                return { sucesso: true };
            } else {
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
                body: JSON.stringify({ 
                    nome, 
                    email, 
                    senha, 
                    tipo: tipo.toUpperCase() 
                })
            });

            if (response.ok) {
                const dados = await response.json();
                localStorage.setItem(CHAVE_USUARIO, JSON.stringify(dados));
                return { sucesso: true };
            } else {
                // O Django retorna erros de campo como: { "senha": ["Senha muito curta"] }
                const erro = await response.json();
                
                let mensagem = 'Falha no cadastro';
                
                if (erro.detail) {
                    mensagem = erro.detail;
                } else if (erro.senha) {
                    mensagem = `Senha: ${erro.senha[0]}`; // Pega a primeira msg de erro da senha
                } else if (erro.email) {
                    mensagem = `E-mail: ${erro.email[0]}`;
                } else {
                    // Se for outro erro, tenta pegar o primeiro valor que encontrar
                    const primeiraChave = Object.keys(erro)[0];
                    if(primeiraChave) mensagem = `${erro[primeiraChave][0]}`;
                }

                return { sucesso: false, erro: mensagem };
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            return { sucesso: false, erro: 'Erro de conexão com o servidor.' };
        }
    },

    deslogar: () => {
        localStorage.removeItem(CHAVE_USUARIO);
    },

    usuarioEstaLogado: () => {
        const usuario = localStorage.getItem(CHAVE_USUARIO);
        return !!usuario;
    },

    getUsuario: () => {
        const usuario = localStorage.getItem(CHAVE_USUARIO);
        return usuario ? JSON.parse(usuario) : null;
    }
};