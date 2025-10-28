// Gerenciamento de Estado
let tarefas = [];
let usuarios = [];
let editandoTarefaId = null;

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

function inicializarSistema() {
    console.log('🔥 Inicializando Firebase...');
    
    // Aguardar Firebase carregar
    if (!window.db) {
        console.log('⏳ Aguardando Firebase...');
        setTimeout(inicializarSistema, 100);
        return;
    }

    console.log('✅ Firebase carregado!');
    
    try {
        configurarDataMinima();
        carregarUsuarios();
        configurarFirebase();
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        document.getElementById('status-sincronizacao').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Offline';
        mostrarNotificacao('Erro ao conectar com o banco de dados', 'error');
    }
}

function configurarDataMinima() {
    const hoje = new Date().toISOString().split('T')[0];
    const dataInputs = document.querySelectorAll('input[type="date"]');
    dataInputs.forEach(input => {
        input.min = hoje;
    });
}

function configurarFirebase() {
    console.log('📡 Configurando listener do Firestore...');
    
    // Listener em tempo real para tarefas
    db.collection("tarefas")
        .orderBy("dataCriacao", "desc")
        .onSnapshot(
            (snapshot) => {
                console.log('📊 Dados recebidos:', snapshot.size, 'tarefas');
                tarefas = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                document.getElementById('status-sincronizacao').innerHTML = '<i class="fas fa-bolt"></i> Online';
                atualizarInterface();
                console.log('🎉 Sistema carregado com sucesso!');
            },
            (error) => {
                console.error('❌ Erro no Firestore:', error);
                document.getElementById('status-sincronizacao').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Erro Conexão';
                mostrarNotificacao('Erro ao carregar tarefas', 'error');
            }
        );
}

async function carregarUsuarios() {
    console.log('👥 Carregando usuários...');
    
    try {
        const snapshot = await db.collection("usuarios").get();
        
        usuarios = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('✅ Usuários carregados:', usuarios.length);

        // Preencher selects de responsável
        const selectResponsavel = document.getElementById('tarefaResponsavel');
        const selectFiltro = document.getElementById('filterResponsavel');
        
        selectResponsavel.innerHTML = '<option value="">Selecionar responsável...</option>';
        selectFiltro.innerHTML = '<option value="">Todos os Responsáveis</option>';
        
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
    
    modal.style.display = 'block';
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
        dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (editandoTarefaId) {
            console.log('✏️ Editando tarefa:', editandoTarefaId);
            await db.collection("tarefas").doc(editandoTarefaId).update(tarefa);
        } else {
            console.log('🆕 Criando nova tarefa');
            const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            await db.collection("tarefas").add({
                ...tarefa,
                dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
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
        await db.collection("tarefas").doc(tarefaId).delete();
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
    const concluidas = tarefas.filter(t => t.status === 'concluido').length;
    
    const hoje = new Date().toISOString().split('T')[0];
    const atrasadas = tarefas.filter(t => 
        t.dataFim < hoje && t.status !== 'concluido'
    ).length;

    document.getElementById('total-tarefas').textContent = total;
    document.getElementById('tarefas-pendentes').textContent = pendentes;
    document.getElementById('tarefas-concluidas').textContent = concluidas;
    document.getElementById('tarefas-atrasadas').textContent = atrasadas;
}

function atualizarListaTarefas() {
    const container = document.getElementById('lista-tarefas');
    const mensagemVazio = document.getElementById('mensagem-vazio');
    const tarefasFiltradas = filtrarTarefas();

    if (tarefasFiltradas.length === 0) {
        container.innerHTML = '';
        mensagemVazio.style.display = 'block';
        return;
    }

    mensagemVazio.style.display = 'none';
    container.innerHTML = tarefasFiltradas.map(tarefa => {
        const hoje = new Date().toISOString().split('T')[0];
        const atrasada = tarefa.dataFim < hoje && tarefa.status !== 'concluido';
        
        return `
            <div class="task-item ${tarefa.prioridade}">
                <div class="task-header">
                    <div>
                        <div class="task-title">${tarefa.titulo}</div>
                        <div class="task-meta">
                            <span class="badge ${tarefa.prioridade}">${tarefa.prioridade}</span>
                            <span class="badge ${tarefa.status}">${tarefa.status}</span>
                            ${tarefa.responsavel ? `<span><i class="fas fa-user"></i> ${tarefa.responsavel}</span>` : ''}
                            ${atrasada ? '<span class="atrasado"><i class="fas fa-exclamation-triangle"></i> Atrasada</span>' : ''}
                        </div>
                    </div>
                </div>
                
                ${tarefa.descricao ? `<div class="task-desc">${tarefa.descricao}</div>` : ''}
                
                <div class="task-meta">
                    ${tarefa.dataInicio ? `<span><i class="fas fa-play-circle"></i> ${formatarData(tarefa.dataInicio)}</span>` : ''}
                    <span><i class="fas fa-flag-checkered"></i> ${formatarData(tarefa.dataFim)}</span>
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
        `;
    }).join('');
}

function filtrarTarefas() {
    const termo = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;
    const prioridade = document.getElementById('filterPrioridade').value;
    const responsavel = document.getElementById('filterResponsavel').value;
    const data = document.getElementById('filterData').value;

    return tarefas.filter(tarefa => {
        // Busca
        if (termo && !tarefa.titulo.toLowerCase().includes(termo) && 
            !(tarefa.descricao && tarefa.descricao.toLowerCase().includes(termo))) {
            return false;
        }
        
        // Filtro de status
        if (status && tarefa.status !== status) {
            return false;
        }
        
        // Filtro de prioridade
        if (prioridade && tarefa.prioridade !== prioridade) {
            return false;
        }
        
        // Filtro de responsável
        if (responsavel && tarefa.responsavel !== responsavel) {
            return false;
        }
        
        // Filtro de data
        if (data) {
            if (tarefa.dataInicio > data || tarefa.dataFim < data) {
                return false;
            }
        }
        
        return true;
    });
}

function limparFiltros() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterPrioridade').value = '';
    document.getElementById('filterResponsavel').value = '';
    document.getElementById('filterData').value = '';
    filtrarTarefas();
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
        border-radius: 6px;
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

function exportarDados() {
    const dados = {
        tarefas: tarefas,
        metadata: {
            exportadoEm: new Date().toISOString(),
            totalTarefas: tarefas.length,
            versao: '1.0'
        }
    };
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-tarefas-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    mostrarNotificacao('Dados exportados com sucesso!', 'success');
}

function importarDados() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = event => {
            try {
                const dados = JSON.parse(event.target.result);
                
                if (dados.tarefas && Array.isArray(dados.tarefas)) {
                    if (confirm(`Importar ${dados.tarefas.length} tarefas?