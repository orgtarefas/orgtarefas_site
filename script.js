// Gerenciamento de Estado
let tarefas = [];
let editandoTarefaId = null;
let usuarios = [];
let configuracao = {};
let usuarioLogado = null;

// Firebase
let db, fb;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(inicializarSistema, 100);
});

async function inicializarSistema() {
    db = window.db;
    fb = window.firebaseModules;
    
    if (db && fb) {
        console.log('✅ Firebase carregado!');
        await carregarConfiguracao();
        await carregarUsuarios();
        verificarLoginAutomatico();
        inicializarFirebase();
    } else {
        console.log('❌ Firebase não carregou');
        mostrarTelaLogin();
    }
}

// ========== SISTEMA DE LOGIN ==========

async function carregarConfiguracao() {
    try {
        const q = fb.query(fb.collection(db, 'configuracao'));
        fb.onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                configuracao = snapshot.docs[0].data();
                console.log('✅ Configuração carregada:', configuracao);
            } else {
                // Configuração padrão
                configuracao = {
                    tempoSessao: 30, // dias
                    maximoSessoes: 1,
                    contatarAdmin: true
                };
                fb.addDoc(fb.collection(db, 'configuracao'), configuracao);
                console.log('✅ Configuração padrão criada');
            }
        });
    } catch (error) {
        console.error('Erro ao carregar configuração:', error);
    }
}

async function carregarUsuarios() {
    try {
        const q = fb.query(fb.collection(db, 'usuarios'));
        fb.onSnapshot(q, (snapshot) => {
            usuarios = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log('✅ Usuários carregados:', usuarios.length);
            
            // Se não existir admin, criar um padrão
            if (!usuarios.find(u => u.nivel === 'admin')) {
                criarUsuarioPadrao();
            }
            
            atualizarListaUsuarios();
        });
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

function criarUsuarioPadrao() {
    const admin = {
        usuario: 'admin',
        senha: 'admin123',
        nivel: 'admin',
        ativo: true,
        dataCriacao: fb.serverTimestamp(),
        ultimoLogin: null,
        sessoesAtivas: 0
    };
    
    const usuario = {
        usuario: 'usuario',
        senha: 'senha123', 
        nivel: 'usuario',
        ativo: true,
        dataCriacao: fb.serverTimestamp(),
        ultimoLogin: null,
        sessoesAtivas: 0
    };
    
    fb.addDoc(fb.collection(db, 'usuarios'), admin);
    fb.addDoc(fb.collection(db, 'usuarios'), usuario);
    console.log('✅ Usuários padrão criados');
}

async function fazerLogin(event) {
    event.preventDefault();
    
    const usuario = document.getElementById('loginUsuario').value;
    const senha = document.getElementById('loginSenha').value;
    
    if (!usuario || !senha) {
        mostrarNotificacao('❌ Preencha usuário e senha!', 'error');
        return;
    }
    
    const usuarioEncontrado = usuarios.find(u => 
        u.usuario === usuario && u.senha === senha
    );
    
    if (usuarioEncontrado) {
        if (!usuarioEncontrado.ativo) {
            mostrarNotificacao('❌ Usuário bloqueado. Contate o administrador.', 'error');
            return;
        }
        
        // Verificar se já está no limite de sessões
        if (usuarioEncontrado.sessoesAtivas >= configuracao.maximoSessoes) {
            mostrarNotificacao('❌ Este usuário já está logado em outro dispositivo.', 'error');
            return;
        }
        
        // Fazer login
        await realizarLogin(usuarioEncontrado);
    } else {
        mostrarNotificacao('❌ Usuário ou senha inválidos.', 'error');
    }
}

async function realizarLogin(usuario) {
    try {
        const sessaoId = generateSessionId();
        const dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + configuracao.tempoSessao);
        
        // Atualizar usuário
        await fb.updateDoc(fb.doc(db, 'usuarios', usuario.id), {
            ultimoLogin: fb.serverTimestamp(),
            sessoesAtivas: usuario.sessoesAtivas + 1,
            sessaoAtiva: sessaoId,
            dataExpiracao: dataExpiracao
        });
        
        // Salvar sessão local
        usuarioLogado = {
            ...usuario,
            sessaoId: sessaoId,
            dataLogin: new Date(),
            dataExpiracao: dataExpiracao
        };
        
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        
        mostrarNotificacao('✅ Login realizado com sucesso!', 'success');
        mostrarSistemaPrincipal();
        iniciarContadorSessao();
        
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        mostrarNotificacao('❌ Erro ao fazer login', 'error');
    }
}

function generateSessionId() {
    return 'sessao_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function verificarLoginAutomatico() {
    const sessaoSalva = localStorage.getItem('usuarioLogado');
    if (sessaoSalva) {
        const usuario = JSON.parse(sessaoSalva);
        const dataExpiracao = new Date(usuario.dataExpiracao);
        
        if (new Date() < dataExpiracao) {
            // Verificar se usuário ainda existe e está ativo
            const usuarioAtual = usuarios.find(u => u.id === usuario.id && u.ativo);
            if (usuarioAtual) {
                usuarioLogado = usuario;
                mostrarSistemaPrincipal();
                iniciarContadorSessao();
                console.log('✅ Login automático realizado');
                return;
            }
        }
    }
    mostrarTelaLogin();
}

function mostrarTelaLogin() {
    document.getElementById('telaLogin').style.display = 'flex';
    document.getElementById('sistemaPrincipal').style.display = 'none';
}

function mostrarSistemaPrincipal() {
    document.getElementById('telaLogin').style.display = 'none';
    document.getElementById('sistemaPrincipal').style.display = 'block';
    
    // Atualizar informações do usuário
    document.getElementById('infoUsuario').textContent = 
        `${usuarioLogado.usuario} (${usuarioLogado.nivel})`;
    
    // Mostrar botão admin se for admin
    if (usuarioLogado.nivel === 'admin') {
        document.getElementById('btnAdmin').style.display = 'block';
    }
    
    atualizarDataAtual();
    configurarDataMinima();
}

function iniciarContadorSessao() {
    // Atualizar imediatamente
    atualizarTempoRestante();
    
    // Atualizar a cada minuto
    setInterval(atualizarTempoRestante, 60000);
}

function atualizarTempoRestante() {
    if (usuarioLogado && usuarioLogado.dataExpiracao) {
        const agora = new Date();
        const expiracao = new Date(usuarioLogado.dataExpiracao);
        const diff = expiracao - agora;
        
        if (diff <= 0) {
            mostrarNotificacao('⏰ Sessão expirada!', 'warning');
            sair();
            return;
        }
        
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        document.getElementById('tempoRestante').textContent = 
            `Sessão expira em: ${dias}d ${horas}h`;
    }
}

async function sair() {
    if (usuarioLogado) {
        try {
            // Decrementar sessões ativas
            const usuario = usuarios.find(u => u.id === usuarioLogado.id);
            if (usuario) {
                await fb.updateDoc(fb.doc(db, 'usuarios', usuario.id), {
                    sessoesAtivas: Math.max(0, usuario.sessoesAtivas - 1)
                });
            }
        } catch (error) {
            console.error('Erro ao atualizar sessões:', error);
        }
        
        localStorage.removeItem('usuarioLogado');
        usuarioLogado = null;
    }
    
    mostrarNotificacao('👋 Logout realizado!', 'info');
    mostrarTelaLogin();
}

// ========== PAINEL ADMINISTRATIVO ==========

function abrirPainelAdmin() {
    if (usuarioLogado && usuarioLogado.nivel === 'admin') {
        document.getElementById('modalAdmin').style.display = 'block';
        document.getElementById('tempoSessao').value = configuracao.tempoSessao || 30;
        document.getElementById('maximoSessoes').value = configuracao.maximoSessoes || 1;
        atualizarListaUsuarios();
    }
}

function fecharPainelAdmin() {
    document.getElementById('modalAdmin').style.display = 'none';
}

function atualizarListaUsuarios() {
    const container = document.getElementById('listaUsuarios');
    container.innerHTML = '';
    
    usuarios.forEach(usuario => {
        const div = document.createElement('div');
        div.className = 'user-item';
        
        const statusClass = !usuario.ativo ? 'status-bloqueado' : 
                           usuario.sessoesAtivas > 0 ? 'status-online' : 'status-offline';
        
        const statusText = !usuario.ativo ? '🔒 Bloqueado' : 
                          usuario.sessoesAtivas > 0 ? '🟢 Online' : '⚫ Offline';
        
        div.innerHTML = `
            <div class="user-details">
                <div class="user-name">${usuario.usuario} (${usuario.nivel})</div>
                <div class="user-status ${statusClass}">
                    ${statusText}
                    ${usuario.sessoesAtivas > 0 ? ` - ${usuario.sessoesAtivas} sessão(ões)` : ''}
                </div>
                <div class="user-status">
                    Último login: ${usuario.ultimoLogin ? 
                        new Date(usuario.ultimoLogin.toDate()).toLocaleString('pt-BR') : 'Nunca'}
                </div>
            </div>
            <div class="user-actions">
                <button class="btn btn-outline btn-sm" onclick="toggleUsuario('${usuario.id}', ${!usuario.ativo})">
                    <i class="fas fa-${usuario.ativo ? 'lock' : 'unlock'}"></i>
                    ${usuario.ativo ? 'Bloquear' : 'Ativar'}
                </button>
                <button class="btn btn-outline btn-sm" onclick="deslogarUsuario('${usuario.id}')">
                    <i class="fas fa-sign-out-alt"></i>
                    Deslogar
                </button>
                ${usuario.nivel !== 'admin' ? `
                    <button class="btn btn-outline btn-sm btn-danger" onclick="excluirUsuario('${usuario.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        `;
        
        container.appendChild(div);
    });
}

async function adicionarUsuario() {
    const usuario = document.getElementById('novoUsuario').value.trim();
    const senha = document.getElementById('novaSenha').value;
    const nivel = document.getElementById('novoNivel').value;
    
    if (!usuario || !senha) {
        mostrarNotificacao('❌ Preencha usuário e senha!', 'error');
        return;
    }
    
    if (usuarios.find(u => u.usuario === usuario)) {
        mostrarNotificacao('❌ Usuário já existe!', 'error');
        return;
    }
    
    try {
        const novoUsuario = {
            usuario: usuario,
            senha: senha,
            nivel: nivel,
            ativo: true,
            dataCriacao: fb.serverTimestamp(),
            ultimoLogin: null,
            sessoesAtivas: 0
        };
        
        await fb.addDoc(fb.collection(db, 'usuarios'), novoUsuario);
        
        // Limpar formulário
        document.getElementById('novoUsuario').value = '';
        document.getElementById('novaSenha').value = '';
        
        mostrarNotificacao('✅ Usuário adicionado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao adicionar usuário:', error);
        mostrarNotificacao('❌ Erro ao adicionar usuário', 'error');
    }
}

async function toggleUsuario(usuarioId, novoEstado) {
    try {
        await fb.updateDoc(fb.doc(db, 'usuarios', usuarioId), {
            ativo: novoEstado,
            sessoesAtivas: 0 // Forçar logout
        });
        
        mostrarNotificacao(`✅ Usuário ${novoEstado ? 'ativado' : 'bloqueado'} com sucesso!`, 'success');
        
    } catch (error) {
        console.error('Erro ao alterar usuário:', error);
        mostrarNotificacao('❌ Erro ao alterar usuário', 'error');
    }
}

async function deslogarUsuario(usuarioId) {
    try {
        await fb.updateDoc(fb.doc(db, 'usuarios', usuarioId), {
            sessoesAtivas: 0,
            sessaoAtiva: null
        });
        
        mostrarNotificacao('✅ Usuário deslogado de todos os dispositivos!', 'success');
        
    } catch (error) {
        console.error('Erro ao deslogar usuário:', error);
        mostrarNotificacao('❌ Erro ao deslogar usuário', 'error');
    }
}

async function excluirUsuario(usuarioId) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        try {
            await fb.deleteDoc(fb.doc(db, 'usuarios', usuarioId));
            mostrarNotificacao('✅ Usuário excluído!', 'success');
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            mostrarNotificacao('❌ Erro ao excluir usuário', 'error');
        }
    }
}

async function salvarConfiguracoes() {
    try {
        const novoTempoSessao = parseInt(document.getElementById('tempoSessao').value);
        const novoMaximoSessoes = parseInt(document.getElementById('maximoSessoes').value);
        
        configuracao.tempoSessao = novoTempoSessao;
        configuracao.maximoSessoes = novoMaximoSessoes;
        
        // Atualizar no Firebase
        const configDoc = await fb.getDocs(fb.collection(db, 'configuracao'));
        if (!configDoc.empty) {
            await fb.updateDoc(fb.doc(db, 'configuracao', configDoc.docs[0].id), configuracao);
        }
        
        mostrarNotificacao('✅ Configurações salvas com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        mostrarNotificacao('❌ Erro ao salvar configurações', 'error');
    }
}

// ========== SISTEMA DE TAREFAS ==========

async function inicializarFirebase() {
    try {
        const q = fb.query(fb.collection(db, 'tarefas'), fb.orderBy('dataCriacao', 'desc'));
        
        fb.onSnapshot(q, (snapshot) => {
            tarefas = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            if (usuarioLogado) {
                atualizarInterface();
                document.getElementById('status-sincronizacao').innerHTML = 
                    '<i class="fas fa-bolt"></i> Tempo Real';
            }
        });
            
        console.log('✅ Firebase conectado - Modo tempo real ativo');
    } catch (error) {
        console.error('❌ Erro Firebase:', error);
        if (usuarioLogado) {
            document.getElementById('status-sincronizacao').innerHTML = 
                '<i class="fas fa-exclamation-triangle"></i> Offline';
            carregarDoLocalStorage();
        }
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
    
    if (!usuarioLogado) {
        mostrarNotificacao('❌ Faça login primeiro!', 'error');
        return;
    }
    
    const tarefa = {
        titulo: document.getElementById('tarefaTitulo').value,
        descricao: document.getElementById('tarefaDescricao').value,
        prioridade: document.getElementById('tarefaPrioridade').value,
        status: document.getElementById('tarefaStatus').value,
        dataInicio: document.getElementById('tarefaDataInicio').value,
        dataFim: document.getElementById('tarefaDataFim').value,
        responsavel: document.getElementById('tarefaResponsavel').value,
        subtarefas: coletarSubtarefas(),
        criadoPor: usuarioLogado.usuario,
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
    if (!usuarioLogado) {
        mostrarNotificacao('❌ Faça login primeiro!', 'error');
        return;
    }
    
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
    if (!usuarioLogado) {
        mostrarNotificacao('❌ Faça login primeiro!', 'error');
        return;
    }
    
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
    if (!usuarioLogado) {
        mostrarNotificacao('❌ Faça login primeiro!', 'error');
        return;
    }
    
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
                    ${tarefa.criadoPor ? `<span><i class="fas fa-user-edit"></i> ${tarefa.criadoPor}</span>` : ''}
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
    if (!usuarioLogado) {
        mostrarNotificacao('❌ Faça login primeiro!', 'error');
        return;
    }
    
    const dados = {
        tarefas: tarefas,
        metadata: {
            exportadoEm: new Date().toISOString(),
            totalTarefas: tarefas.length,
            versao: '1.0',
            exportadoPor: usuarioLogado.usuario
        }
    };
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-planejamento-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    mostrarNotificacao('📁 Dados exportados com sucesso!', 'success');
}

function importarDados() {
    if (!usuarioLogado) {
        mostrarNotificacao('❌ Faça login primeiro!', 'error');
        return;
    }
    
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
                        if (!db || !fb) {
                            mostrarNotificacao('❌ Firebase não disponível', 'error');
                            return;
                        }
                        // Adicionar cada tarefa ao Firebase
                        dados.tarefas.forEach(async tarefa => {
                            await fb.addDoc(fb.collection(db, 'tarefas'), {
                                ...tarefa,
                                criadoPor: usuarioLogado.usuario,
                                dataCriacao: fb.serverTimestamp(),
                                dataAtualizacao: fb.serverTimestamp()
                            });
                        });
                        mostrarNotificacao('✅ Tarefas importadas com sucesso!', 'success');
                    }
                } else {
                    mostrarNotificacao('❌ Arquivo inválido!', 'error');
                }
            } catch (error) {
                mostrarNotificacao('❌ Erro ao importar arquivo', 'error');
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
    }, 4000);
}

// Fechar modal clicando fora
window.onclick = function(event) {
    const modal = document.getElementById('modalTarefa');
    if (event.target === modal) {
        fecharModalTarefa();
    }
    
    const modalAdmin = document.getElementById('modalAdmin');
    if (event.target === modalAdmin) {
        fecharPainelAdmin();
    }
}