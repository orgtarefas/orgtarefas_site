// login.js - VERSÃO SIMPLIFICADA E FUNCIONAL
console.log('🔥 Login carregado - Versão Simplificada');

// Função para ver TODOS os usuários
async function verTodosUsuarios() {
    console.log('🛠️ VERIFICANDO TODOS OS USUÁRIOS NO FIRESTORE...');
    
    try {
        const { db, firebaseModules: fb } = window.firebaseApp;
        const usersRef = fb.collection(db, 'usuarios');
        const snapshot = await fb.getDocs(usersRef);
        
        console.log(`📊 TOTAL DE USUÁRIOS: ${snapshot.size}`);
        
        if (snapshot.size === 0) {
            console.log('❌ NENHUM USUÁRIO ENCONTRADO!');
            console.log('💡 Use o admin.html para criar usuários primeiro');
            return [];
        }
        
        const usuarios = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            console.log('--- USUÁRIO ---');
            console.log('ID:', doc.id);
            console.log('Dados:', data);
            console.log('Usuario field:', data.usuario);
            console.log('Senha field:', data.senha);
            console.log('---------------');
            
            usuarios.push({
                id: doc.id,
                ...data
            });
        });
        
        return usuarios;
        
    } catch (error) {
        console.error('❌ Erro ao buscar usuários:', error);
        return [];
    }
}

// Sistema de login SIMPLES
async function fazerLogin(usuario, senha) {
    console.log(`🔐 Tentando login: "${usuario}"`);
    
    const btnLogin = document.getElementById('btnLogin');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    
    try {
        // Mostrar loading
        btnLogin.disabled = true;
        btnText.textContent = 'Autenticando...';
        spinner.classList.remove('hidden');
        
        // Primeiro, ver TODOS os usuários
        const todosUsuarios = await verTodosUsuarios();
        
        if (todosUsuarios.length === 0) {
            throw new Error('Nenhum usuário cadastrado. Use admin.html primeiro.');
        }
        
        // Buscar usuário específico
        const usuarioEncontrado = todosUsuarios.find(u => 
            u.usuario && u.usuario.toString().toLowerCase() === usuario.toLowerCase().trim()
        );
        
        console.log('🔍 Resultado da busca:', usuarioEncontrado);
        
        if (!usuarioEncontrado) {
            const usuariosDisponiveis = todosUsuarios.map(u => u.usuario).filter(Boolean);
            throw new Error(`Usuário não encontrado. Disponíveis: ${usuariosDisponiveis.join(', ')}`);
        }
        
        // Verificar senha
        if (usuarioEncontrado.senha === senha) {
            console.log('✅ Login bem-sucedido!');
            
            // Salvar sessão
            localStorage.setItem('usuarioLogado', JSON.stringify({
                uid: usuarioEncontrado.id,
                usuario: usuarioEncontrado.usuario,
                nome: usuarioEncontrado.nome || usuarioEncontrado.usuario,
                nivel: usuarioEncontrado.nivel || 'usuario'
            }));
            
            // Redirecionar
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } else {
            throw new Error('Senha incorreta');
        }
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        alert('ERRO: ' + error.message);
    } finally {
        btnLogin.disabled = false;
        btnText.textContent = 'Entrar no Sistema';
        spinner.classList.add('hidden');
    }
}

// Configuração inicial
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema carregado');
    
    // Liberar formulário
    document.querySelectorAll('input, button').forEach(el => {
        el.style.pointerEvents = 'auto';
        el.disabled = false;
    });
    
    // Configurar formulário
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            const usuario = document.getElementById('loginUsuario').value;
            const senha = document.getElementById('loginPassword').value;
            await fazerLogin(usuario, senha);
        });
    }
    
    // Focar no input
    setTimeout(() => {
        document.getElementById('loginUsuario')?.focus();
    }, 500);
    
    // Verificar usuários automaticamente após 2 segundos
    setTimeout(async () => {
        console.log('🔄 Verificando usuários automaticamente...');
        await verTodosUsuarios();
    }, 2000);
});