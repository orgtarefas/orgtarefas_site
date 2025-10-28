// Gerenciamento de Estado
let tarefas = [];
let usuarios = [];
let editandoTarefaId = null;

// Firebase
let db, fb;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema...');
    
    // Verificar se usuário está logado
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    
    if (!usuarioLogado) {
        console.log('❌ Usuário não logado, redirecionando...');
        window.location.href = 'login.html';
        return;
    }

    console.log('👤 Usuário logado:', usuarioLogado.nome);
    document.getElementById('userName').textContent = usuarioLogado.nome;
    document.getElementById('data-atual').textContent = new Date().toLocaleDateString('pt-BR');
    
    // Inicializar sistema
    inicializarSistema();
});

async function inicializarSistema() {
    console.log('🔥 Inicializando Firebase...');
    
    // Aguardar Firebase carregar
    if (!window.firebaseReady) {
        console.log('⏳ Aguardando Firebase...');
        setTimeout(inicializarSistema, 100);
        return;
    }

    db = window.db;
    fb = window.firebaseModules;
    
    console.log('✅ Firebase carregado!');
    
    try {
        await carregarUsuarios();
        configurarDataMinima();
        configurarFirebase();
        
        // Esconder loading e mostrar conteúdo
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        
        document.getElementById('status-sincronizacao').innerHTML = '<i class="fas fa-bolt"></i> Tempo Real';
        console.log('🎉 Sistema inicializado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        document.getElementById('status-sincronizacao').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Offline';
    }
}

function configurarDataMinima() {
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('tarefaDataInicio').min = hoje;
    document.getElementById('tarefaDataFim').min = hoje;
}

function configurarFirebase() {
    console.log('📡 Conectando ao Firestore...');
    
    const q = fb.query(fb.collection(db, 'tarefas'), fb.orderBy('dataCriacao', 'desc'));
    
    fb.onSnapshot(q, 
        (snapshot) => {
            console.log('📊 Dados recebidos:', snapshot.size, 'tarefas');
            tarefas = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            atualizarInterface();
        },
        (error) => {
            console.error('❌ Erro no Firestore:', error);
            document.getElementById('status-sincronizacao').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Erro Conexão';
        }
    );
}

async function carregarUsuarios() {
    console.log('👥 Carregando usuários...');
    
    try {
        const usersRef = fb.collection(db, 'usuarios');
        const snapshot = await fb.getDocs(usersRef);
        
        usuarios = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('✅ Usuários carregados:', usuarios.length);

        // Preencher selects de responsável
        const selectResponsavel = document.getElementById('tarefaResponsavel');
        const selectFiltro = document.getElementById('filterResponsavel');
        
        selectResponsavel.innerHTML = '<option value="">Selecionar...</option>';
        selectFiltro.innerHTML = '<option value="">Todos</option>';
        
        usuarios.forEach(usuario => {
            const option = `<option value="${usuario.usuario}">${usuario.nome || usuario.usuario}</option>`;
            selectResponsavel.innerHTML += option;
            selectFiltro.innerHTML += option;
        });
        
    } catch (error) {
        console.error('❌ Erro ao carregar usuários:', error);
    }
}

// Modal Functions
function abrirModalTarefa(tarefaId = null) {
    editandoTarefaId = tarefaId;
    const modal = document.getElementById('modalTarefa');
    const titulo = document.getElementById('modalTitulo');
    
    if (tarefaId) {
        titulo.textContent = 'Editar Tarefa';
        preencherFormulario(tarefaId);
    } else {
        titulo.textContent = 'Nova Tarefa';
        limparFormulario();
    }
    
    modal.style.display = 'flex';
}

function fecharModalTarefa() {
    document.getElementById('modalTarefa').style.display = 'none';
    editandoTarefaId = null;
}

function preencherFormulario(tarefaId) {
    const tarefa = tarefas.find(t => t.id === tarefaId);
    if (!tarefa) return;
    
    document.getElementById('tarefaTitulo').value = tarefa.titulo;
    document.getElementById('tarefaDescricao').value = tarefa.descricao || '';
    document.getElementById('tarefaPrioridade').value = tarefa.prioridade;
    document.getElementById('tarefaStatus').value = tarefa.status;
    document.getElementById('tarefaDataInicio').value = tarefa.dataInicio || '';
    document.getElementById('tarefaDataFim').value = tarefa.dataFim;
    document.getElementById('tarefaResponsavel').value = tarefa.responsavel || '';
}

function limparFormulario() {
    document.getElementById('formTarefa').reset();
    configurarDataMinima();
}

// CRUD Operations
async function salvarTarefa() {
    console.log('💾 Salvando tarefa...');
    
    const tarefa = {
        titulo: document.getElementById('tarefaTitulo').value,
        descricao: document.getElementById('tarefaDescricao').value,
        prioridade: document.getElementById('tarefaPrioridade').value,
        status: document.getElementById('tarefaStatus').value,
        dataInicio: document.getElementById('tarefaDataInicio').value,
        dataFim: document.getElementById('tarefaDataFim').value,
        responsavel: document.getElementById('tarefaResponsavel').value,
        dataAtualizacao: fb.serverTimestamp()
    };

    try {
        if (editandoTarefaId) {
            console.log('✏️ Editando tarefa:', editandoTarefaId);
            await fb.updateDoc(fb.doc(db, 'tarefas', editandoTarefaId), tarefa);
        } else {
            console.log('🆕 Criando nova tarefa');
            const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            await fb.setDoc(fb.doc(fb.collection(db, 'tarefas')), {
                ...tarefa,
                dataCriacao: fb.serverTimestamp(),
                criadoPor: usuarioLogado.usuario
            });
        }
        
        fecharModalTarefa();
        mostrarNotificacao('Tarefa salva com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao salvar tarefa:', error);
        mostrarNotificacao('Erro ao salvar tarefa: ' + error.message, 'error');
    }
}

async function excluirTarefa(tarefaId) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    
    console.log('🗑️ Excluindo tarefa:', tarefaId);
    
    try {
        await fb.deleteDoc(fb.doc(db, 'tarefas', tarefaId));
        mostrarNotificacao('Tarefa excluída com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao excluir tarefa:', error);
        mostrarNotificacao('Erro ao excluir tarefa', 'error');
    }
}

// Interface
function atualizarInterface() {
    atualizarEstatisticas();
    atualizarListaTarefas();
}

function atualizarEstatisticas() {
    const total = tarefas.length;
    const pendentes = tarefas.filter(t => t.status === 'pendente').length;
    const andamento = tarefas.filter(t => t.status === 'andamento').length;
    const concluidas = tarefas.filter(t => t.status === 'concluido').length;

    document.getElementById('total-tarefas').textContent = total;
    document.getElementById('tarefas-pendentes').textContent = pendentes;
    document.getElementById('tarefas-andamento').textContent = andamento;
    document.getElementById('tarefas-concluidas').textContent = concluidas;
}

function atualizarListaTarefas() {
    const container = document.getElementById('lista-tarefas');
    const tarefasFiltradas = filtrarTarefas();

    if (tarefasFiltradas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>Nenhuma tarefa encontrada</h3>
                <p>Clique em "Nova Tarefa" para começar</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tarefasFiltradas.map(tarefa => `
        <div class="task-card prioridade-${tarefa.prioridade}">
            <div class="task-header">
                <div>
                    <div class="task-title">${tarefa.titulo}</div>
                    ${tarefa.descricao ? `<div class="task-desc">${tarefa.descricao}</div>` : ''}
                </div>
            </div>
            
            <div class="task-meta">
                <span class="badge prioridade-${tarefa.prioridade}">
                    ${tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
                </span>
                <span class="badge status-${tarefa.status}">
                    ${tarefa.status === 'pendente' ? 'Pendente' : 
                      tarefa.status === 'andamento' ? 'Em Andamento' : 'Concluído'}
                </span>
                ${tarefa.responsavel ? `
                    <span class="task-responsavel">
                        <i class="fas fa-user"></i> ${tarefa.responsavel}
                    </span>
                ` : ''}
            </div>

            <div class="task-meta">
                ${tarefa.dataInicio ? `<small><i class="fas fa-play-circle"></i> ${formatarData(tarefa.dataInicio)}</small>` : ''}
                <small><i class="fas fa-flag-checkered"></i> ${formatarData(tarefa.dataFim)}</small>
            </div>

            <div class="task-actions">
                <button class="btn btn-outline btn-sm" onclick="abrirModalTarefa('${tarefa.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="excluirTarefa('${tarefa.id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        </div>
    `).join('');
}

function filtrarTarefas() {
    const termo = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;
    const prioridade = document.getElementById('filterPrioridade').value;
    const responsavel = document.getElementById('filterResponsavel').value;

    return tarefas.filter(tarefa => {
        if (termo && !tarefa.titulo.toLowerCase().includes(termo) && 
            !(tarefa.descricao && tarefa.descricao.toLowerCase().includes(termo))) {
            return false;
        }
        if (status && tarefa.status !== status) return false;
        if (prioridade && tarefa.prioridade !== prioridade) return false;
        if (responsavel && tarefa.responsavel !== responsavel) return false;
        return true;
    });
}

// Utils
function formatarData(dataString) {
    if (!dataString) return 'Não definida';
    return new Date(dataString + 'T00:00:00').toLocaleDateString('pt-BR');
}

function mostrarNotificacao(mensagem, tipo) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        background: ${tipo === 'success' ? '#28a745' : '#dc3545'};
    `;
    notification.textContent = mensagem;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

function logout() {
    console.log('🚪 Fazendo logout...');
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'login.html';
}

// Event Listeners para filtros
document.getElementById('searchInput').addEventListener('input', atualizarListaTarefas);
document.getElementById('filterStatus').addEventListener('change', atualizarListaTarefas);
document.getElementById('filterPrioridade').addEventListener('change', atualizarListaTarefas);
document.getElementById('filterResponsavel').addEventListener('change', atualizarListaTarefas);

// Fechar modal clicando fora
window.onclick = function(event) {
    const modal = document.getElementById('modalTarefa');
    if (event.target === modal) {
        fecharModalTarefa();
    }
}