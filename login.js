// login.js - VERSÃO RADICAL SEM BLOQUEIOS
console.log('🔥 Login carregado - Versão Radical');

// Função nuclear - remove TUDO que pode bloquear
function removerBloqueiosNuclear() {
    console.log('💥 REMOÇÃO NUCLEAR DE BLOQUEIOS');
    
    // 1. Remover todos os event listeners problemáticos
    const todosElementos = document.querySelectorAll('*');
    
    todosElementos.forEach(element => {
        // Clonar e substituir CADA elemento para remover event listeners
        try {
            const clone = element.cloneNode(true);
            element.parentNode.replaceChild(clone, element);
        } catch (e) {
            // Ignorar elementos que não podem ser clonados
        }
    });
    
    // 2. Aplicar estilos liberadores em TUDO
    document.querySelectorAll('*').forEach(el => {
        el.style.pointerEvents = 'auto';
        el.style.userSelect = 'auto';
        el.style.webkitUserSelect = 'auto';
        el.style.MozUserSelect = 'auto';
        el.style.msUserSelect = 'auto';
        el.style.cursor = 'auto';
        el.disabled = false;
        el.readOnly = false;
        
        // Configurar tipos específicos
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.style.cursor = 'text';
            el.style.pointerEvents = 'auto';
        }
        if (el.tagName === 'BUTTON') {
            el.style.cursor = 'pointer';
        }
        if (el.tagName === 'LABEL') {
            el.style.cursor = 'pointer';
        }
    });
    
    console.log('✅ Remoção nuclear completa!');
}

// Sistema de login SUPER SIMPLES
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

// CONFIGURAÇÃO ULTRA SIMPLES
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Carregado');
    
    // REMOÇÃO NUCLEAR IMEDIATA
    removerBloqueiosNuclear();
    
    // Configurar formulário de forma DIRETA
    const form = document.getElementById('loginForm');
    if (form) {
        // Clonar e substituir o formulário para limpar event listeners
        const novoForm = form.cloneNode(true);
        form.parentNode.replaceChild(novoForm, form);
        
        // Adicionar listener DIRETO
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const usuario = document.getElementById('loginUsuario').value;
            const senha = document.getElementById('loginPassword').value;
            fazerLogin(usuario, senha);
        });
    }
    
    // CONFIGURAR INPUTS PARA CLIQUE DIRETO
    const configurarInputs = () => {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            // Remover listeners antigos clonando
            const novoInput = input.cloneNode(true);
            input.parentNode.replaceChild(novoInput, input);
            
            // Adicionar listener DIRETO para clique
            novoInput.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                e.preventDefault();
                this.focus();
            });
            
            novoInput.addEventListener('click', function(e) {
                e.stopPropagation();
                this.focus();
            });
        });
    };
    
    configurarInputs();
    
    // Focar automaticamente
    setTimeout(() => {
        const inputUsuario = document.getElementById('loginUsuario');
        if (inputUsuario) {
            inputUsuario.focus();
            inputUsuario.select();
        }
    }, 200);
});

// LOOP DE PROTEÇÃO AGGRESSIVO
setInterval(removerBloqueiosNuclear, 500); // A cada 0.5 segundos

// Liberações iniciais múltiplas
for (let i = 0; i < 10; i++) {
    setTimeout(removerBloqueiosNuclear, i * 100);
}