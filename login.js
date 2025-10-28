// login.js - VERSÃO ZERO BLOQUEIOS
console.log('=== LOGIN INICIADO ===');

// Sistema de login DIRETO
async function fazerLogin(usuario, senha) {
    console.log('Tentando login:', usuario);
    
    const btnLogin = document.getElementById('btnLogin');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    
    try {
        if (!usuario || !senha) {
            alert('Preencha usuário e senha');
            return;
        }

        btnLogin.disabled = true;
        btnText.textContent = 'Autenticando...';
        spinner.classList.remove('hidden');
        
        const { db, firebaseModules: fb } = window.firebaseApp;
        const usersRef = fb.collection(db, 'usuarios');
        const snapshot = await fb.getDocs(usersRef);
        
        const usuarioEncontrado = snapshot.docs.find(doc => {
            const data = doc.data();
            return data.usuario && data.usuario.toLowerCase() === usuario.toLowerCase();
        });
        
        if (!usuarioEncontrado) {
            throw new Error('Usuário não encontrado');
        }
        
        const userData = usuarioEncontrado.data();
        
        if (userData.senha === senha) {
            localStorage.setItem('usuarioLogado', JSON.stringify({
                uid: usuarioEncontrado.id,
                usuario: userData.usuario,
                nome: userData.nome || userData.usuario,
                nivel: userData.nivel || 'usuario'
            }));
            
            window.location.href = 'index.html';
        } else {
            throw new Error('Senha incorreta');
        }
        
    } catch (error) {
        alert('Erro: ' + error.message);
        btnLogin.disabled = false;
        btnText.textContent = 'Entrar no Sistema';
        spinner.classList.add('hidden');
    }
}

// CONFIGURAÇÃO MINIMALISTA .
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== FORMULÁRIO PRONTO ===');
    
    // Configurar formulário de forma DIRETA
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const usuario = document.getElementById('loginUsuario').value;
            const senha = document.getElementById('loginPassword').value;
            fazerLogin(usuario, senha);
        });
    }
    
    // Focar no campo usuário
    setTimeout(() => {
        const inputUsuario = document.getElementById('loginUsuario');
        if (inputUsuario) {
            inputUsuario.focus();
        }
    }, 500);
    
    console.log('=== SISTEMA CONFIGURADO ===');
});