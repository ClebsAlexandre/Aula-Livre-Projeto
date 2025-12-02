// js/services/auth.js

const CHAVE_USUARIO = 'aulalivre_usuario';
const API_BASE_URL = '/api'; // Endereço base da sua API Django (exemplo)

export const authService = {
    
    // Agora tenta bater na API real (vai dar erro 404 por enquanto, pq ainda não criamos a URL no Django)
    logar: async (email, senha) => {
        try {
            const response = await fetch(`${API_BASE_URL}/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, senha })
            });

            if (response.ok) {
                const dados = await response.json();
                // Salva o usuário retornado pelo Django
                localStorage.setItem(CHAVE_USUARIO, JSON.stringify(dados));
                return { sucesso: true };
            } else {
                // Erro da API (ex: 401 Não Autorizado)
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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome, email, senha, tipo })
            });

            if (response.ok) {
                const dados = await response.json();
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