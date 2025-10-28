// login.js - SISTEMA DE LOGIN COM USUÁRIO CORRIGIDO
console.log('🔥 Login carregado - Sistema com usuário');

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

// Sistema de login
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
        
        console.log('🔍 Buscando usuário:', usuario);
        
        // Buscar usuário no Firestore
        const { db, firebaseModules: fb } = window.firebaseApp;
        const usersRef = fb.collection(db, 'usuarios');
        const q = fb.query(usersRef, fb.where("username", "==", usuario));
        const querySnapshot = await fb.getDocs(q);
        
        console.log('📊 Resultados encontrados:', querySnapshot.size);
        
        if (querySnapshot.empty) {
            throw new Error('Usuário não encontrado');
        }
        
        // Pegar o primeiro usuário encontrado
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        console.log('👤 Dados do usuário:', userData);
        
        if (userData.ativo === false) {
            throw new Error('Usuário inativo. Contate o administrador.');
        }
        
        // VERIFICAR SENHA DIRETAMENTE (já que você tem campo senha)
        if (userData.senha && userData.senha === senha) {
            console.log('✅ Login bem-sucedido via senha direta');
            
            // Salvar sessão local
            localStorage.setItem('usuarioLogado', JSON.stringify({
                uid: userDoc.id,
                username: userData.username,
                nome: userData.nome,
                nivel: userData.nivel,
                email: userData.email
            }));
            
            // Redirecionar
            window.location.href = 'index.html';
            return;
        }
        
        // Se não tem senha direta, tentar Firebase Auth
        if (userData.email) {
            console.log('🔐 Tentando Firebase Auth com email:', userData.email);
            
            try {
                const userCredential = await fb.signInWithEmailAndPassword(
                    window.firebaseApp.auth, 
                    userData.email, 
                    senha
                );
                
                console.log('✅ Login Firebase bem-sucedido:', userData.nome);
                
                // Salvar sessão
                localStorage.setItem('usuarioLogado', JSON.stringify({
                    uid: userCredential.user.uid,
                    username: userData.username,
                    nome: userData.nome,
                    nivel: userData.nivel,
                    email: userData.email
                }));
                
                // Atualizar último login
                await fb.updateDoc(fb.doc(db, "usuarios", userDoc.id), {
                    ultimoLogin: fb.serverTimestamp()
                });
                
                // Redirecionar
                window.location.href = 'index.html';
                return;
                
            } catch (authError) {
                console.error('❌ Erro Firebase Auth:', authError);
                throw new Error('Senha incorreta');
            }
        }
        
        throw new Error('Credenciais inválidas');
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        
        let mensagemErro = 'Erro ao fazer login';
        if (error.message.includes('não encontrado')) {
            mensagemErro = 'Usuário não encontrado';
        } else if (error.message.includes('Senha incorreta') || error.message.includes('Credenciais inválidas')) {
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