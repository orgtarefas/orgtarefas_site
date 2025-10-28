// login.js - VERSÃO DEFINITIVA SEM TRAVAMENTO
console.log('🔥 Login carregado - Versão Definitiva');

// Função para FORÇAR elementos clicáveis
function forcarElementosClicaveis() {
    console.log('🎯 Forçando elementos clicáveis...');
    
    // Lista de todos os elementos que devem ser clicáveis
    const elementos = document.querySelectorAll('*');
    
    elementos.forEach(el => {
        // REMOVER qualquer bloqueio
        el.style.pointerEvents = 'auto';
        el.style.userSelect = 'auto';
        el.style.webkitUserSelect = 'auto';
        el.style.cursor = 'auto';
        el.disabled = false;
        el.readOnly = false;
        
        // Configurar específicos
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.style.cursor = 'text';
            el.style.pointerEvents = 'auto';
        }
        
        if (el.tagName === 'BUTTON') {
            el.style.cursor = 'pointer';
            el.style.pointerEvents = 'auto';
        }
        
        if (el.tagName === 'LABEL') {
            el.style.cursor = 'pointer';
            el.style.pointerEvents = 'auto';
        }
    });
    
    console.log('✅ Todos os elementos liberados!');
}

// Sistema de login
async function fazerLogin(usuario, senha) {
    console.log(`🔐 Tentando login: "${usuario}"`);
    
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
            console.log('✅ Login bem-sucedido!');
            
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
        console.error('❌ Erro no login:', error);
        alert('Erro: ' + error.message);
        
        btnLogin.disabled = false;
        btnText.textContent = 'Entrar no Sistema';
        spinner.classList.add('hidden');
    }
}

// CONFIGURAÇÃO PRINCIPAL - MANTÉM ELEMENTOS SEMPRE CLICÁVEIS
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Carregado - Configurando sistema...');
    
    // FORÇAR liberação imediata
    forcarElementosClicaveis();
    
    // Configurar formulário de forma DIRETA
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const usuario = document.getElementById('loginUsuario').value;
            const senha = document.getElementById('loginPassword').value;
            fazerLogin(usuario, senha);
        });
    }
    
    // CONFIGURAR INPUTS PARA SEREM SEMPRE CLICÁVEIS
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        // Garantir que sempre pode focar
        input.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            this.focus();
        });
        
        input.addEventListener('click', function(e) {
            e.stopPropagation();
            this.focus();
        });
        
        // Quando perder foco, garantir que ainda pode ser clicado
        input.addEventListener('blur', function() {
            // Não fazer nada - manter clicável
        });
    });
    
    // Focar no primeiro input
    setTimeout(() => {
        const inputUsuario = document.getElementById('loginUsuario');
        if (inputUsuario) {
            inputUsuario.focus();
            inputUsuario.select();
        }
    }, 100);
});

// MANTER SEMPRE CLICÁVEL - LOOP DE PROTEÇÃO
setInterval(forcarElementosClicaveis, 1000); // A cada 1 segundo

// Liberações extras para garantir
setTimeout(forcarElementosClicaveis, 50);
setTimeout(forcarElementosClicaveis, 200);
setTimeout(forcarElementosClicaveis, 500);
setTimeout(forcarElementosClicaveis, 1000);

// Quando a página carregar completamente
window.addEventListener('load', function() {
    console.log('🎉 Página totalmente carregada!');
    forcarElementosClicaveis();
    
    // Foco final
    setTimeout(() => {
        document.getElementById('loginUsuario')?.focus();
    }, 300);
});

// CLIQUE EM QUALQUER LUGAR DA PÁGINA DEVE MANTER FUNCIONALIDADE
document.addEventListener('click', function(e) {
    // Se clicou em qualquer lugar, garantir que inputs ainda funcionam
    forcarElementosClicaveis();
});

// Prevenir comportamentos problemáticos
document.addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());