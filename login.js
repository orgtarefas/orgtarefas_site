// Gerenciamento de Estado
let currentUser = null;
let loginAttempts = 0;
const MAX_LOGIN_ATTEMPTS = 3;

// Firebase
let db, auth, fb;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(inicializarLogin, 100);
});

function inicializarLogin() {
    db = window.firebaseApp?.db;
    auth = window.firebaseApp?.auth;
    fb = window.firebaseApp?.firebaseModules;
    
    if (!db || !auth || !fb) {
        console.error('❌ Firebase não carregou corretamente');
        mostrarNotificacao('Erro de configuração. Recarregue a página.', 'error');
        return;
    }
    
    console.log('✅ Firebase Login carregado!');
    configurarAuthListener();
    configurarFormulario();
    verificarLoginSalvo();
}

// Listener de autenticação
function configurarAuthListener() {
    fb.onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('👤 Usuário autenticado:', user.email);
            await verificarPermissaoUsuario(user);
        } else {
            console.log('🔒 Nenhum usuário autenticado');
            currentUser = null;
        }
    });
}

// Verificar permissões do usuário
async function verificarPermissaoUsuario(user) {
    try {
        const userDoc = await fb.getDoc(fb.doc(db, 'usuarios', user.uid));
        
        if (!userDoc.exists()) {
            console.log('❌ Usuário não encontrado na base');
            await logout();
            mostrarNotificacao('Usuário não autorizado.', 'error');
            return;
        }
        
        const userData = userDoc.data();
        
        // Verificar se usuário está ativo
        if (!userData.ativo) {
            await logout();
            mostrarModalBloqueio('Seu acesso foi desativado pelo administrador.');
            return;
        }
        
        // Verificar se há sessão mais recente
        if (userData.ultimoLogin && userData.sessionId !== localStorage.getItem('currentSessionId')) {
            await logout();
            mostrarModalBloqueio('Sua conta foi acessada em outro dispositivo.');
            return;
        }
        
        // Verificar expiração de sessão
        if (userData.sessaoExpiraEm && new Date() > userData.sessaoExpiraEm.toDate()) {
            await logout();
            mostrarModalBloqueio('Sua sessão expirou. Faça login novamente.');
            return;
        }
        
        // Atualizar dados da sessão
        const sessionId = gerarSessionId();
        await fb.updateDoc(fb.doc(db, 'usuarios', user.uid), {
            ultimoLogin: fb.serverTimestamp(),
            sessionId: sessionId,
            sessaoExpiraEm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
        });
        
        localStorage.setItem('currentSessionId', sessionId);
        currentUser = { ...userData, uid: user.uid };
        
        // Redirecionar para o sistema principal
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        mostrarNotificacao('Erro ao verificar permissões.', 'error');
    }
}

// Configurar formulário de login
function configurarFormulario() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', handleLogin);
}

// Manipular login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validar formato de email
    if (!validarEmail(email)) {
        mostrarNotificacao('Por favor, insira um login válido.', 'error');
        return;
    }
    
    await realizarLogin(email, password, rememberMe);
}

// Realizar login
async function realizarLogin(email, password, rememberMe) {
    const btnLogin = document.getElementById('btnLogin');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    
    try {
        // Mostrar loading
        btnLogin.disabled = true;
        btnText.textContent = 'Autenticando...';
        spinner.classList.remove('hidden');
        
        // Verificar se usuário existe e está ativo
        const usersQuery = fb.query(
            fb.collection(db, 'usuarios'),
            fb.where('email', '==', email),
            fb.where('ativo', '==', true)
        );
        
        const userSnapshot = await fb.getDocs(usersQuery);
        
        if (userSnapshot.empty) {
            throw new Error('Usuário não encontrado ou desativado');
        }
        
        // Fazer login com Firebase Auth
        const userCredential = await fb.signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Login realizado com sucesso');
        
        // Salvar preferência de "Lembrar-me"
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('savedEmail', email);
        } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('savedEmail');
        }
        
        loginAttempts = 0;
        mostrarNotificacao('Login realizado com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        loginAttempts++;
        
        let mensagemErro = 'Erro ao fazer login. ';
        
        switch (error.code) {
            case 'auth/user-not-found':
                mensagemErro += 'Usuário não encontrado.';
                break;
            case 'auth/wrong-password':
                mensagemErro += 'Senha incorreta.';
                break;
            case 'auth/too-many-requests':
                mensagemErro += 'Muitas tentativas. Tente novamente mais tarde.';
                break;
            default:
                mensagemErro += error.message;
        }
        
        if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
            mensagemErro += ' Número máximo de tentativas excedido.';
            document.getElementById('loginForm').style.display = 'none';
        }
        
        mostrarNotificacao(mensagemErro, 'error');
        
    } finally {
        // Restaurar botão
        btnLogin.disabled = false;
        btnText.textContent = 'Entrar no Sistema';
        spinner.classList.add('hidden');
    }
}

// Verificar login salvo
function verificarLoginSalvo() {
    const rememberMe = localStorage.getItem('rememberMe');
    const savedEmail = localStorage.getItem('savedEmail');
    
    if (rememberMe === 'true' && savedEmail) {
        document.getElementById('loginEmail').value = savedEmail;
        document.getElementById('rememberMe').checked = true;
    }
}

// Logout
async function logout() {
    try {
        if (auth.currentUser) {
            // Atualizar status do usuário
            const userDoc = await fb.getDoc(fb.doc(db, 'usuarios', auth.currentUser.uid));
            if (userDoc.exists()) {
                await fb.updateDoc(fb.doc(db, 'usuarios', auth.currentUser.uid), {
                    sessionId: null,
                    ultimoLogout: fb.serverTimestamp()
                });
            }
            
            await fb.signOut(auth);
        }
        
        localStorage.removeItem('currentSessionId');
        currentUser = null;
        
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}

// Utilitários
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function gerarSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Modal de bloqueio
function mostrarModalBloqueio(mensagem) {
    document.getElementById('blockedMessage').textContent = mensagem;
    document.getElementById('blockedModal').style.display = 'block';
}

function fecharModalBloqueio() {
    document.getElementById('blockedModal').style.display = 'none';
}

// Notificações
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
    }, 5000);
}

// Fechar modal clicando fora
window.onclick = function(event) {
    const modal = document.getElementById('blockedModal');
    if (event.target === modal) {
        fecharModalBloqueio();
    }
}

// Exportar funções globais
window.logout = logout;
window.fecharModalBloqueio = fecharModalBloqueio;