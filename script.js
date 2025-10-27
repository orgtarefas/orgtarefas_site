// Gerenciamento de Estado
let tarefas = [];
let editandoTarefaId = null;

// Firebase - já inicializado no index.html
const db = window.db;
const fb = window.firebaseModules;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Aguarda o Firebase carregar
    setTimeout(() => {
        if (db) {
            inicializarFirebase();
        } else {
            console.error('Firebase não carregou');
            document.getElementById('status-sincronizacao').innerHTML = 
                '<i class="fas fa-exclamation-triangle"></i> Erro Firebase';
            carregarDoLocalStorage();
        }
    }, 1000);
    
    atualizarDataAtual();
    configurarDataMinima();
});

async function inicializarFirebase() {
    try {
        console.log('🔥 Conectando ao Firebase...');
        
        // Configurar listener em tempo real
        const q = fb.query(fb.collection(db, 'tarefas'), fb.orderBy('dataCriacao', 'desc'));
        
        fb.onSnapshot(q, (snapshot) => {
            tarefas = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            atualizarInterface();
            document.getElementById('status-sincronizacao').innerHTML = 
                '<i class="fas fa-bolt"></i> Tempo Real';
        });
            
        console.log('✅ Firebase conectado - Modo tempo real ativo');
    } catch (error) {
        console.error('❌ Erro Firebase:', error);
        document.getElementById('status-sincronizacao').innerHTML = 
            '<i class="fas fa-exclamation-triangle"></i> Offline';
        carregarDoLocalStorage();
    }
}

// Data Atual
function atualizarDataAtual() {
    const dataElement = document.getElementById('data-atual');
    const agora = new Date();
    dataElement.textContent = agora.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function configurarDataMinima() {
    const hoje = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.min = hoje;
    });
}

// ========== GERENCIAMENTO DE TAREFAS ==========

async function salvarTarefa(event) {
    event.preventDefault();
    
    const tarefa = {
        titulo: document.getElementById('tarefaTitulo').value,
        descricao: document.getElementById('tarefaDescricao').value,
        prioridade: document.getElementById('tarefaPrioridade').value,
        status: document.getElementById('tarefaStatus').value,
        dataInicio: document.getElementById('tarefaDataInicio').value,
        dataFim: document.getElementById('tarefaDataFim').value,
        responsavel: document.getElementById('tarefaResponsavel').value,
        subtarefas: coletarSubtarefas(),
        dataCriacao: editandoTarefaId ? 
            tarefas.find(t => t.id === editandoTarefaId).dataCriacao : 
            fb.serverTimestamp(),
        dataAtualizacao: fb.serverTimestamp()
    };
    
    try {
        if (editandoTarefaId) {
            await fb.updateDoc(fb.doc(db, 'tarefas', editandoTarefaId), tarefa);
            mostrarNotificacao('✅ Tarefa atualizada! Todos verão a mudança.', 'success');
        } else {
            await fb.addDoc(fb.collection(db, 'tarefas'), tarefa);
            mostrarNotificacao('✅ Nova tarefa criada! Disponível para todos.', 'success');
        }
        
        fecharModalTarefa();
    } catch (error) {
        console.error('Erro ao salvar:', error);
        mostrarNotificacao('❌ Erro ao salvar tarefa', 'error');
    }
}

async function excluirTarefa(tarefaId) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    
    try {
        await fb.deleteDoc(fb.doc(db, 'tarefas', tarefaId));
        mostrarNotificacao('✅ Tarefa excluída!', 'success');
    } catch (error) {
        console.error('Erro ao excluir:', error);
        mostrarNotificacao('❌ Erro ao excluir tarefa', 'error');
    }
}

function alternarStatusSubtarefa(tarefaId, subtarefaIndex) {
    const tarefa = tarefas.find(t => t.id === tarefaId);
    if (tarefa && tarefa.subtarefas[subtarefaIndex]) {
        const subtarefa = tarefa.subtarefas[subtarefaIndex];
        subtarefa.status = subtarefa.status === 'concluido' ? 'pendente' : 'concluido';
        
        // Atualizar no Firebase
        fb.updateDoc(fb.doc(db, 'tarefas', tarefaId), {
            subtarefas: tarefa.subtarefas
        });
    }
}

function carregarDoLocalStorage() {
    const dadosSalvos = localStorage.getItem('sistema-planejamento');
    if (dadosSalvos) {
        tarefas = JSON.parse(dadosSalvos);
        atualizarInterface();
    }
}

function salvarNoLocalStorage() {
    localStorage.setItem('sistema-planejamento', JSON.stringify(tarefas));
}

// ========== MODAL E FORMULÁRIO ==========

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
    
    // Configurar data mínima
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('tarefaDataInicio').min = hoje;
    document.getElementById('tarefaDataFim').min = hoje;
    
    // Subtarefas
    const listaSubtarefas = document.getElementById('lista-subtarefas');
    listaSubtarefas.innerHTML = '';
    tarefa.subtarefas.forEach(subtarefa => {
        adicionarSubtarefa(subtarefa);
    });
}

function limparFormulario() {
    document.getElementById('formTarefa').reset();
    document.getElementById('lista-subtarefas').innerHTML = '';
    
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('tarefaDataInicio').min = hoje;
    document.getElementById('tarefaDataFim').min = hoje;
}

function coletarSubtarefas() {
    const subtarefas = [];
    const elementos = document.querySelectorAll('.subtarefa-item');
    
    elementos.forEach(elemento => {
        const titulo = elemento.querySelector('.subtarefa-titulo').value;
        const dataFim = elemento.querySelector('.subtarefa-data').value;
        const status = elemento.querySelector('.subtarefa-status').value;
        
        if (titulo.trim()) {
            subtarefas.push({
                titulo: titulo.trim(),
                dataFim: dataFim,
                status: status
            });
        }
    });
    
    return subtarefas;
}

// ========== SUBTAREFAS ==========

function adicionarSubtarefa(dados = null) {
    const template = document.getElementById('templateSubtarefa');
    const clone = template.content.cloneNode(true);
    const container = document.getElementById('lista-subtarefas');
    
    if (dados) {
        clone.querySelector('.subtarefa-titulo').value = dados.titulo || '';
        clone.querySelector('.subtarefa-data').value = dados.dataFim || '';
        clone.querySelector('.subtarefa-status').value = dados.status || 'pendente';
    }
    
    container.appendChild(clone);
}

function removerSubtarefa(botao) {
    botao.closest('.subtarefa-item').remove();
}

// ========== INTERFACE ==========

function atualizarInterface() {
    atualizarListaTarefas();
    atualizarEstatisticas();
}

function atualizarListaTarefas() {
    const container = document.getElementById('lista-tarefas');
    const mensagemVazio = document.getElementById('mensagem-vazio');
    
    if (tarefas.length === 0) {
        container.innerHTML = '';
        mensagemVazio.style.display = 'block';
        return;
    }
    
    mensagemVazio.style.display = 'none';
    
    const tarefasFiltradas = filtrarTarefasArray();
    container.innerHTML = '';
    
    tarefasFiltradas.forEach(tarefa => {
        container.appendChild(criarElementoTarefa(tarefa));
    });
}

function criarElementoTarefa(tarefa) {
    const div = document.createElement('div');
    div.className = `task-item ${tarefa.prioridade}`;
    
    const hoje = new Date().toISOString().split('T')[0];
    const atrasada = tarefa.dataFim < hoje && tarefa.status !== 'concluido';
    
    div.innerHTML = `
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
            <div class="task-actions">
                <button class="btn btn-outline btn-sm" onclick="abrirModalTarefa('${tarefa.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-outline btn-sm" onclick="excluirTarefa('${tarefa.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        
        ${tarefa.descricao ? `<div class="task-desc">${tarefa.descricao}</div>` : ''}
        
        <div class="task-meta">
            ${tarefa.dataInicio ? `<span><i class="fas fa-play-circle"></i> ${formatarData(tarefa.dataInicio)}</span>` : ''}
            <span><i class="fas fa-flag-checkered"></i> ${formatarData(tarefa.dataFim)}</span>
        </div>
        
        ${tarefa.subtarefas.length > 0 ? criarHTMLSubtarefas(tarefa) : ''}
    `;
    
    return div;
}

function criarHTMLSubtarefas(tarefa) {
    let html = '<div class="subtasks"><strong>Subtarefas:</strong>';
    
    tarefa.subtarefas.forEach((subtarefa, index) => {
        const concluida = subtarefa.status === 'concluido';
        html += `
            <div class="subtask-item ${concluida ? 'concluido' : ''}">
                <input type="checkbox" ${concluida ? 'checked' : ''} 
                    onchange="alternarStatusSubtarefa('${tarefa.id}', ${index})">
                <span>${subtarefa.titulo}</span>
                ${subtarefa.dataFim ? `<small>(${formatarData(subtarefa.dataFim)})</small>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    return html;
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

// ========== FILTROS E BUSCA ==========

function filtrarTarefas() {
    atualizarListaTarefas();
}

function filtrarTarefasArray() {
    const termoBusca = document.getElementById('searchInput').value.toLowerCase();
    const filtroStatus = document.getElementById('filterStatus').value;
    const filtroPrioridade = document.getElementById('filterPrioridade').value;
    const filtroData = document.getElementById('filterData').value;
    
    return tarefas.filter(tarefa => {
        // Busca
        if (termoBusca && !tarefa.titulo.toLowerCase().includes(termoBusca) && 
            !tarefa.descricao.toLowerCase().includes(termoBusca)) {
            return false;
        }
        
        // Filtro de status
        if (filtroStatus && tarefa.status !== filtroStatus) {
            return false;
        }
        
        // Filtro de prioridade
        if (filtroPrioridade && tarefa.prioridade !== filtroPrioridade) {
            return false;
        }
        
        // Filtro de data
        if (filtroData) {
            if (tarefa.dataInicio > filtroData || tarefa.dataFim < filtroData) {
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
    document.getElementById('filterData').value = '';
    filtrarTarefas();
}

// ========== IMPORT/EXPORT ==========

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
    a.download = `backup-planejamento-${new Date().toISOString().split('T')[0]}.json`;
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
                    if (confirm(`Importar ${dados.tarefas.length} tarefas?`)) {
                        // Adicionar cada tarefa ao Firebase
                        dados.tarefas.forEach(async tarefa => {
                            await fb.addDoc(fb.collection(db, 'tarefas'), tarefa);
                        });
                        mostrarNotificacao('Tarefas importadas com sucesso!', 'success');
                    }
                } else {
                    mostrarNotificacao('Arquivo inválido!', 'error');
                }
            } catch (error) {
                mostrarNotificacao('Erro ao importar arquivo', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ========== UTILITÁRIOS ==========

function formatarData(dataString) {
    return new Date(dataString + 'T00:00:00').toLocaleDateString('pt-BR');
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    notificacao.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check' : tipo === 'error' ? 'exclamation-triangle' : 'info'}-circle"></i>
        <span>${mensagem}</span>
    `;
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => notificacao.classList.add('show'), 100);
    
    setTimeout(() => {
        notificacao.classList.remove('show');
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.parentNode.removeChild(notificacao);
            }
        }, 300);
    }, 3000);
}

// Fechar modal clicando fora
window.onclick = function(event) {
    const modal = document.getElementById('modalTarefa');
    if (event.target === modal) {
        fecharModalTarefa();
    }
}