// login.js - VERSÃO ULTRA OTIMIZADA SEM TRAVAMENTO
console.log('🔥 Login carregado - Versão Otimizada');

// Remover TODOS os bloqueadores
function removerBloqueadoresCompletamente() {
    console.log('🎯 Removendo todos os bloqueadores...');
    
    // 1. Remover qualquer overlay bloqueador
    document.querySelectorAll('*').forEach(element => {
        const styles = window.getComputedStyle(element);
        if (
            styles.pointerEvents === 'none' ||
            styles.userSelect === 'none' ||
            element.style.pointerEvents === 'none' ||
            element.disabled
        ) {
            element.style.pointerEvents = 'auto';
            element.style.userSelect = 'auto';
            element.style.webkitUserSelect = 'auto';
            element.disabled = false;
        }
    });
    
    // 2. Configurar inputs especificamente
    const todosElementos = document.querySelectorAll('*');
    todosElementos.forEach(el => {
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'default';
        el.style.userSelect = 'auto';
        el.style.webkitUserSelect = 'auto';
        el.style.msUserSelect = 'auto';
        el.style.MozUserSelect = 'auto';
    });
    
    // 3. Inputs com comportamento específico
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.style.pointerEvents = 'auto';
        input.style.cursor = 'text';
        input.disabled = false;
        input.readOnly = false;
        
        // Clonar e substituir para remover event listeners problemáticos
        const novoInput = input.cloneNode(true);
        input.parentNode.replaceChild(novoInput, input);
    });
    
    // 4. Botões
    const botoes = document.querySelectorAll('button');
    botoes.forEach(botao => {
        botao.style.pointerEvents = 'auto';
        botao.style.cursor = 'pointer';
        botao.disabled = false;
    });
    
    console.log('✅ Todos os bloqueadores removidos!');
}

// Sistema de login SIMPLES e DIRETO
async function fazerLogin(usuario, senha) {
    console.log(`🔐 Tentando login: "${usuario}"`);
    
    const btnLogin = document.getElementById('btnLogin');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    
    try {
        // Validar campos
        if (!usuario.trim() || !senha.trim()) {
            alert('Preencha usuário e senha');
            return;
        }

        // Mostrar loading
        btnLogin.disabled = true;
        btnText.textContent = 'Autenticando...';
        spinner.classList.remove('hidden');
        
        // Buscar usuário no Firestore
        const { db, firebaseModules: fb } = window.firebaseApp;
        const usersRef = fb.collection(db, 'usuarios');
        const snapshot = await fb.getDocs(usersRef);
        
        // Buscar usuário (case insensitive)
        const usuarioEncontrado = snapshot.docs.find(doc => {
            const data = doc.data();
            return data.usuario && data.usuario.toLowerCase() === usuario.toLowerCase().trim();
        });
        
        if (!usuarioEncontrado) {
            throw new Error('Usuário não encontrado');
        }
        
        const userData = usuarioEncontrado.data();
        
        // Verificar senha
        if (userData.senha === senha) {
            console.log('✅ Login bem-sucedido!');
            
            // Salvar sessão
            localStorage.setItem('usuarioLogado', JSON.stringify({
                uid: usuarioEncontrado.id,
                usuario: userData.usuario,
                nome: userData.nome || userData.usuario,
                nivel: userData.nivel || 'usuario'
            }));
            
            // Redirecionar
            window.location.href = 'index.html';
            
        } else {
            throw new Error('Senha incorreta');
        }
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        alert('Erro: ' + error.message);
        
        // Restaurar botão
        btnLogin.disabled = false;
        btnText.textContent = 'Entrar no Sistema';
        spinner.classList.add('hidden');
    }
}

// Configuração INICIAL RÁPIDA
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Carregado - Configurando sistema...');
    
    // REMOVER BLOQUEADORES IMEDIATAMENTE
    removerBloqueadoresCompletamente();
    
    // Configurar formulário de forma SIMPLES
    const form = document.getElementById('loginForm');
    if (form) {
        // REMOVER qualquer event listener existente
        const novoForm = form.cloneNode(true);
        form.parentNode.replaceChild(novoForm, form);
        
        // Adicionar listener SIMPLES
        document.getElementById('loginForm').addEventListener('submit', function(event) {
            event.preventDefault();
            const usuario = document.getElementById('loginUsuario').value;
            const senha = document.getElementById('loginPassword').value;
            fazerLogin(usuario, senha);
        });
    }
    
    // Configurar inputs para serem CLICÁVEIS
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('mousedown', function(e) {
            e.stopPropagation();
        });
        
        input.addEventListener('click', function(e) {
            e.stopPropagation();
            this.focus();
        });
    });
    
    // Focar no primeiro input
    setTimeout(() => {
        const primeiroInput = document.getElementById('loginUsuario');
        if (primeiroInput) {
            primeiroInput.focus();
        }
    }, 100);
});

// REMOÇÃO AGESSIVA CONTÍNUA DE BLOQUEADORES
setTimeout(removerBloqueadoresCompletamente, 50);
setTimeout(removerBloqueadoresCompletamente, 200);
setTimeout(removerBloqueadoresCompletamente, 500);
setTimeout(removerBloqueadoresCompletamente, 1000);
setTimeout(removerBloqueadoresCompletamente, 2000);

// Prevenir comportamentos problemáticos
document.addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());

// Quando a página terminar de carregar
window.addEventListener('load', function() {
    console.log('🎉 Página totalmente carregada - Sistema liberado!');
    removerBloqueadoresCompletamente();
    
    // Forçar foco novamente
    setTimeout(() => {
        document.getElementById('loginUsuario')?.focus();
    }, 300);
});