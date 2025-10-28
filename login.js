// login.js - SISTEMA DE LOGIN COM USUÁRIO
console.log('🔥 Login carregado - Sistema com usuário');

// Remover qualquer bloqueio existente
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Carregado - formulário liberado');
    
    // Liberar todos os inputs e botões
    const inputs = document.querySelectorAll('input, button, textarea, select');
    inputs.forEach(element => {
        element.style.pointerEvents = 'auto';
        element.disabled = false;
    });
    
    // Configurar formulário
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const usuario = document.getElementById('loginUsuario').value;
            const password = document.getElementById('loginPassword').value;
            
            console.log('👤 Usuário:', usuario);
            console.log('🔐 Password:', password ? '***' : 'vazio');
            
            await fazerLogin(usuario, password);
        });
    }
    
    // Focar no primeiro campo
    document.getElementById('loginUsuario')?.focus();
});

async function fazerLogin(usuario, senha) {
    const btnLogin = document.getElementById('btnLogin');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    
    try {
        // Mostrar loading
        btnLogin.disabled = true;
        btnText.textContent = 'Autenticando...';
        spinner.classList.remove('hidden');
        
        // Buscar usuário no Firestore pelo username
        const { db, firebaseModules: fb } = window.firebaseApp;
        const usersRef = fb.collection(db, 'usuarios');
        const q = fb.query(usersRef, fb.where('username', '==', usuario));
        const querySnapshot = await fb.getDocs(q);
        
        if (querySnapshot.empty) {
            throw new Error('Usuário não encontrado');
        }
        
        // Pegar o primeiro usuário encontrado
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        if (!userData.ativo) {
            throw new Error('Usuário inativo. Contate o administrador.');
        }
        
        // Fazer login com o email (que está salvo no sistema)
        const userCredential = await fb.signInWithEmailAndPassword(
            window.firebaseApp.auth, 
            userData.email, 
            senha
        );
        
        console.log('✅ Login bem-sucedido:', userData.nome);
        
        // Redirecionar para o sistema
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        
        let mensagemErro = 'Erro ao fazer login';
        if (error.code === 'auth/user-not-found') {
            mensagemErro = 'Usuário não encontrado';
        } else if (error.code === 'auth/wrong-password') {
            mensagemErro = 'Senha incorreta';
        } else if (error.message.includes('inativo')) {
            mensagemErro = error.message;
        } else {
            mensagemErro = error.message || 'Erro desconhecido';
        }
        
        alert('❌ ' + mensagemErro);
    } finally {
        // Restaurar botão
        btnLogin.disabled = false;
        btnText.textContent = 'Entrar no Sistema';
        spinner.classList.add('hidden');
    }
}

// Forçar liberação após 1 segundo (fallback)
setTimeout(() => {
    console.log('⏰ Fallback - liberando elementos');
    document.querySelectorAll('*').forEach(el => {
        el.style.pointerEvents = 'auto';
    });
}, 1000);

function fecharModalBloqueio() {
    document.getElementById('blockedModal').style.display = 'none';
}