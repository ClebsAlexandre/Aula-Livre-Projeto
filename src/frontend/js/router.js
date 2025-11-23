// js/router.js

import { obterConteudoHome } from './views/home.js';
import { obterConteudoExplorar } from './views/explorar.js';

// lista das rotas do app.
// se criar tela nova, tem q registrar aqui, senao o sistema ignora
const rotas = {
    '/': obterConteudoHome,
    'home': obterConteudoHome,
    'explorar': obterConteudoExplorar
};

// funcao q faz a SPA (troca o conteudo).
// ta fechada aqui dentro pra ninguem conseguir chamar pelo console do navegador
function navegar(rota) {
    const app = document.getElementById('conteudo-principal');
    
    // fail-safe: se a rota nao existe ou ta quebrada, joga pra home 
    // pra nao ficar aquela tela branca feia pro usuario
    const viewRender = rotas[rota] || rotas['home'];
    
    // injeta o html novo
    app.innerHTML = viewRender();
    
    // força o scroll pra cima, senao qdo troca de pagina continua lá no rodapé
    window.scrollTo(0, 0);
}

// aqui a gente usa Event Delegation pra nao sujar o html com onclick
// escuta qualquer click na pagina e ve se foi num link nosso
document.addEventListener('click', (e) => {
    
    // procura se o elemento clicado (ou o pai dele) tem a tag data-route
    const link = e.target.closest('[data-route]');

    if (link) {
        e.preventDefault(); // mata o comportamento padrao do link (recarregar a pag)
        const rotaDestino = link.dataset.route;
        navegar(rotaDestino); // chama a nossa navegação interna
    }
});

// qdo o html terminar de carregar, ja chama a home direto
document.addEventListener('DOMContentLoaded', () => {
    navegar('home');
});