// login.js - SISTEMA CORRIGIDO PARA SUA ESTRUTURA
console.log('🔥 Login carregado - Buscando por campo "usuario"');

// Estado do formulário
let formularioLiberado = false;

function liberarFormularioCompletamente() {
    if (formularioLiberado) return;
    
    console.log('🎯 Liberando formulário completamente...');
    
    // Liberar todos os elementos
    document.querySelectorAll('*').forEach(el => {
        el.style.pointerEvents = 'auto';
        el.style.userSelect = 'auto';
        el.style.webkitUserSelect = 'auto';
    });
    
    // Configurar inputs especificamente
    const inputs = document.querySelectorAll('input, textarea, select, button');
    inputs.forEach(input => {
        input.disabled = false;
        input.readOnly = false;
        input.style.pointerEvents = 'auto';
        input.style.cursor = 'auto';
        input.style.opacity = '1';
        
        // Remover qualquer event listener bloqueador
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
    });
    
    // Configurar foco e clique
    document.addEventListener('click', function(e) {
        e.stopPropagation();
    }, true);
    
    document.addEventListener('mousedown', function(e) {
        e.stopPropagation();
    }, true);
    
    formularioLiberado = true;
    console.log('✅ Formulário completamente liberado!');
}

// Quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Carregado - iniciando liberação');
    
    // Liberação imediata
    liberarFormularioCompletamente();
    
    // Configurar formulário
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const usuario = document.getElementById('loginUsuario').value;
            const password = document.getElementById('loginPassword').value;
            
            console.log('👤 Tentando login com:', usuario);
            
            await fazerLogin(usuario, password);
        });
    }
    
    // Configurar inputs para manter foco
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            console.log('🎯 Input em foco:', this.id);
        });
        
        input.addEventListener('blur', function() {
            console.log('🔘 Input perdeu foco:', this.id);
        });
        
        input.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('🖱️ Input clicado:', this.id);
        });
    });
    
    // Focar no primeiro campo
    setTimeout(() => {
        const primeiroInput = document.getElementById('loginUsuario');
        if (primeiroInput) {
            primeiroInput.focus();
            primeiroInput.select();
            console.log('🎯 Foco definido no primeiro input');
        }
    }, 500);
});

// Fallback agressivo - liberar tudo
setTimeout(liberarFormularioCompletamente, 100);
setTimeout(liberarFormularioCompletamente, 500);
setTimeout(liberarFormularioCompletamente, 1000);

// Sistema de login CORRIGIDO - busca por "usuario"
async function fazerLogin(usuario, senha) {
    const btnLogin = document.getElementById('btnLogin');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    
    try {
        // Validar campos
        if (!usuario.trim() || !senha.trim()) {
            throw new Error('Preencha usuário e senha');
        }

        // Mostrar loading
        btnLogin.disabled = true;
        btnText.textContent = 'Autenticando...';
        spinner.classList.remove('hidden');
        
        console.log('🔍 Buscando usuário no Firestore:', usuario);
        
        // Buscar usuário no Firestore pelo campo "usuario"
        const { db, firebaseModules: fb } = window.firebaseApp;
        const usersRef = fb.collection(db, 'usuarios');
        
        // CORREÇÃO: Buscar pelo campo "usuario" em vez de "username"
        const q = fb.query(usersRef, fb.where("usuario", "==", usuario));
        const querySnapshot = await fb.getDocs(q);
        
        console.log('📊 Resultados encontrados:', querySnapshot.size);
        
        if (querySnapshot.empty) {
            throw new Error('Usuário não encontrado');
        }
        
        // Pegar o primeiro usuário encontrado
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        console.log('👤 Dados do usuário encontrado:', userData);
        
        // Verificar se usuário está ativo
        if (userData.ativo === false) {
            throw new Error('Usuário inativo. Contate o administrador.');
        }
        
        // VERIFICAR SENHA - campo "senha"
        console.log('🔐 Verificando senha...');
        console.log('Senha digitada:', senha);
        console.log('Senha no banco:', userData.senha);
        
        if (userData.senha && userData.senha === senha) {
            console.log('✅ Login bem-sucedido! Senha correta.');
            
            // Salvar sessão local
            localStorage.setItem('usuarioLogado', JSON.stringify({
                uid: userDoc.id,
                usuario: userData.usuario,
                nome: userData.nome || userData.usuario,
                nivel: userData.nivel || 'usuario',
                email: userData.email || '',
                sessaoAtiva: userData.sessaoAtiva
            }));
            
            // Mostrar sucesso
            mostrarSucessoLogin(`Bem-vindo, ${userData.usuario}!`);
            
            // Redirecionar após 1 segundo
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
            return;
        } else {
            console.log('❌ Senha incorreta');
            throw new Error('Senha incorreta');
        }
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        
        let mensagemErro = 'Erro ao fazer login';
        if (error.message.includes('não encontrado')) {
            mensagemErro = 'Usuário não encontrado';
        } else if (error.message.includes('Senha incorreta')) {
            mensagemErro = 'Senha incorreta';
        } else if (error.message.includes('inativo')) {
            mensagemErro = error.message;
        } else if (error.message.includes('Preencha')) {
            mensagemErro = error.message;
        } else {
            mensagemErro = error.message || 'Erro desconhecido';
        }
        
        // Mostrar erro de forma visível
        mostrarErroLogin(mensagemErro);
        
    } finally {
        // Restaurar botão
        btnLogin.disabled = false;
        btnText.textContent = 'Entrar no Sistema';
        spinner.classList.add('hidden');
    }
}

function mostrarErroLogin(mensagem) {
    // Criar ou atualizar notificação de erro
    let notificacao = document.getElementById('notificacaoErro');
    
    if (!notificacao) {
        notificacao = document.createElement('div');
        notificacao.id = 'notificacaoErro';
        notificacao.className = 'notificacao error';
        notificacao.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #f5c6cb;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(notificacao);
    }
    
    notificacao.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <strong>Erro:</strong> ${mensagem}
    `;
    
    notificacao.style.display = 'block';
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        notificacao.style.display = 'none';
    }, 5000);
}

function mostrarSucessoLogin(mensagem) {
    let notificacao = document.getElementById('notificacaoSucesso');
    
    if (!notificacao) {
        notificacao = document.createElement('div');
        notificacao.id = 'notificacaoSucesso';
        notificacao.className = 'notificacao success';
        notificacao.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #c3e6cb;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(notificacao);
    }
    
    notificacao.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <strong>Sucesso!</strong> ${mensagem}
    `;
    
    notificacao.style.display = 'block';
    
    // Auto-remover após 3 segundos
    setTimeout(() => {
        notificacao.style.display = 'none';
    }, 3000);
}

function fecharModalBloqueio() {
    document.getElementById('blockedModal').style.display = 'none';
}

// Prevenir qualquer comportamento padrão que possa travar
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());

// Forçar foco no formulário
window.addEventListener('load', function() {
    console.log('🔄 Página completamente carregada - forçando liberação final');
    liberarFormularioCompletamente();
    
    setTimeout(() => {
        const usuarioInput = document.getElementById('loginUsuario');
        if (usuarioInput) {
            usuarioInput.focus();
            usuarioInput.select();
        }
    }, 1000);
});