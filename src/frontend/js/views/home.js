// js/views/home.js

export function obterConteudoHome() {
    // retorna o htmlzao estatico da home.
    // no futuro se precisar de dados dinamicos (tipo "professores destaque")
    // a gente transforma isso numa funcao async igual a do explorar
    return `
    <header class="py-5 bg-white">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-6">
                    <h1 class="display-5 fw-bold text-primary mb-3">A Ponte do Conhecimento Voluntário.</h1>
                    <p class="lead mb-4">Conectamos professores que querem doar conhecimento a alunos que precisam de apoio gratuito e estruturado.</p>
                    
                    <div class="d-grid gap-2 d-md-flex justify-content-md-start">
                        <button type="button" data-route="explorar" class="btn botao-verde btn-lg px-4 me-md-2">
                            Encontrar Professor
                        </button>
                        
                        <button type="button" class="btn btn-outline-secondary btn-lg px-4">
                            Sou Professor
                        </button>
                    </div>
                </div>
                
                <div class="col-lg-6 d-none d-lg-block text-center">
                    <i class="bi bi-people-fill text-primary" style="font-size: 10rem; opacity: 0.2;"></i>
                </div>
            </div>
        </div>
    </header>

    <section class="py-5 bg-light">
        <div class="container">
            <h2 class="text-center mb-5 fw-bold text-primary">Como funciona</h2>
            <div class="row text-center">
                
                <div class="col-md-4 mb-4">
                    <div class="card h-100 border-0 shadow-sm p-4">
                        <div class="card-body">
                            <i class="bi bi-search display-4 text-primary mb-3"></i>
                            <h5 class="card-title fw-bold">Busque</h5>
                            <p class="card-text text-muted">Encontre professores voluntários na disciplina que você precisa.</p>
                        </div>
                    </div>
                </div>

                <div class="col-md-4 mb-4">
                    <div class="card h-100 border-0 shadow-sm p-4">
                        <div class="card-body">
                            <i class="bi bi-calendar-check display-4 text-primary mb-3"></i>
                            <h5 class="card-title fw-bold">Agende</h5>
                            <p class="card-text text-muted">Escolha o melhor horário e garanta sua aula de reforço.</p>
                        </div>
                    </div>
                </div>

                <div class="col-md-4 mb-4">
                    <div class="card h-100 border-0 shadow-sm p-4">
                        <div class="card-body">
                            <i class="bi bi-award display-4 text-primary mb-3"></i>
                            <h5 class="card-title fw-bold">Aprenda</h5>
                            <p class="card-text text-muted">Tenha aulas de qualidade e evolua nos seus estudos.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>
    `;
}