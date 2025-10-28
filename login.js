// login.js - VERSÃO SIMPLEX SEM LOOPS
console.log('🔥 Login carregado - Versão Simplex');

// Liberação UMA ÚNICA VEZ
function liberarUmaVez() {
    console.log('🎯 Liberação única executada');
    
    // Apenas os elementos do formulário
    const elementos = [
        '#loginUsuario',
        '#loginPassword', 
        '#btnLogin',
        '#loginForm',
        '.form-group',
        'label'
    ];
    
    elementos.forEach(seletor => {
        const els = document.querySelectorAll(seletor);
        els.forEach(el => {
            el.style.pointerEvents = 'auto';
            el.style.cursor = el.tagName === 'INPUT' ? 'text' : 'pointer';
            el.disabled = false;
        });
    });
    
    console.log('✅ Elementos liberados');
}

// Sistema de login
async function fazerLogin(usuario, senha) {
    console.log(`🔐 Login: "${usuario}"`);
    
    const btnLogin = document.getElementById('btnLogin');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    
    try {
        if (!usuario.trim() || !senha.trim()) {
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
            return data.usuario && data.usuario.toLowerCase() === usuario.toLowerCase().trim();
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

// Configuração SIMPLES
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Carregado');
    
    // Liberação ÚNICA
    liberarUmaVez();
    
    // Configurar formulário
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const usuario = document.getElementById('loginUsuario').value;
            const senha = document.getElementById('loginPassword').value;
            fazerLogin(usuario, senha);
        });
    }
    
    // Configurar cliques nos inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('mousedown', function(e) {
            this.focus();
        });
    });
    
    // Focar automaticamente
    setTimeout(() => {
        const inputUsuario = document.getElementById('loginUsuario');
        if (inputUsuario) {
            inputUsuario.focus();
        }
    }, 100);
});

// Apenas UMA liberação extra após carregamento completo
window.addEventListener('load', function() {
    console.log('🎉 Página carregada');
    setTimeout(liberarUmaVez, 200);
});